import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
// @ts-ignore
import { gapi } from "gapi-script";

// --- Firestore imports (use your own path) ---
import { getUsersByRole, getCollection, getUsersByTournament, getUsersByTeam } from "../hooks/firestore";

// Google API Stuff
const CLIENT_ID = "430877906839-qfj30rff9auh5u9oaqcrasfbo75m1v1r.apps.googleusercontent.com";
const API_KEY = "AIzaSyCJSOHaAE_EyMED5WgTQ88bZqnGSGFNOdQ";
const SCOPES = "https://www.googleapis.com/auth/gmail.send";

// Possible recipient groups (extend as you wish)
const GROUP_OPTIONS = [
  { label: "Players", type: "role", value: "player" },
  { label: "Coaches", type: "role", value: "coach" },
  { label: "Parents", type: "role", value: "parent" },
  // Teams and tournaments are dynamically loaded
];

const ManageTournaments: React.FC = () => {
  const navigate = useNavigate();
  const [showMessageModal, setShowMessageModal] = useState(false);

  // Massmail State
  const [recipientGroups, setRecipientGroups] = useState<any[]>([]); // { label, type, value }
  const [allEmails, setAllEmails] = useState<string[]>([]);
  const [showRecipientsList, setShowRecipientsList] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ status: "success" | "error"; message: string } | null>(null);

  // Google Auth State
  const tokenClient = useRef<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // For dynamic team/tournament selection
  const [teams, setTeams] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [teamSelector, setTeamSelector] = useState<string>("");
  const [tournSelector, setTournSelector] = useState<string>("");

  // --- GAPI Setup
  useEffect(() => {
    gapi.load("client", async () => {
      await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"]
      });
    });
    if (!tokenClient.current && (window as any).google?.accounts?.oauth2) {
      tokenClient.current = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
          setAccessToken(response.access_token);
          gapi.client.setToken({ access_token: response.access_token });
        }
      });
    }
  }, []);

  // Load teams & tournaments from Firestore
  useEffect(() => {
    if (showMessageModal) {
      getCollection("teams").then(setTeams);
      getCollection("tournaments").then(setTournaments);
    }
  }, [showMessageModal]);

  // --- Recipient Group Selection Logic ---
  useEffect(() => {
    async function getAllEmails() {
      const allSets: Set<string> = new Set();
      for (let group of recipientGroups) {
        let emails: string[] = [];
        if (group.type === "role") {
          const users = await getUsersByRole(group.value);
          emails = users.map((u: any) => u.email);
        } else if (group.type === "team") {
          const players = await getUsersByTeam(group.value);
          emails = players.map((u: any) => u.email || u); // fallback if just email
        } else if (group.type === "tournament") {
          const attendees = await getUsersByTournament(group.value);
          emails = attendees.map((u: any) => u.email || u); // fallback if just email
        }
        emails.forEach(e => e && allSets.add(e));
      }
      setAllEmails(Array.from(allSets));
    }
    if (recipientGroups.length > 0) {
      getAllEmails();
    } else {
      setAllEmails([]);
    }
  }, [recipientGroups]);

  function addRecipientGroup(group: any) {
    if (!recipientGroups.some(g => g.type === group.type && g.value === group.value)) {
      setRecipientGroups([...recipientGroups, group]);
    }
  }
  function removeRecipientGroup(idx: number) {
    setRecipientGroups(recipientGroups.filter((_, i) => i !== idx));
  }

  // --- Send Mail ---
  async function handleSend() {
    setSending(true);
    setSendResult(null);
    if (allEmails.length === 0) {
      setSendResult({ status: "error", message: "Select at least one group with members." });
      setSending(false);
      return;
    }
    if (!subject.trim() || !body.trim()) {
      setSendResult({ status: "error", message: "Subject and body are required." });
      setSending(false);
      return;
    }

    const email = [
      `To: ${allEmails.join(",")}`,
      `Subject: ${subject}`,
      "Content-Type: text/plain; charset=utf-8",
      "",
      body,
    ].join("\n");

    const base64EncodedEmail = btoa(unescape(encodeURIComponent(email)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    function sendGmail() {
      return gapi.client.gmail.users.messages.send({
        userId: "me",
        resource: { raw: base64EncodedEmail },
      });
    }

    try {
      if (!accessToken) {
        tokenClient.current.requestAccessToken();
        tokenClient.current.callback = async (response: any) => {
          setAccessToken(response.access_token);
          gapi.client.setToken({ access_token: response.access_token });
          await sendGmail();
          setSendResult({ status: "success", message: "Email sent successfully!" });
          setSending(false);
        };
      } else {
        await sendGmail();
        setSendResult({ status: "success", message: "Email sent successfully!" });
        setSending(false);
      }
    } catch (err: any) {
      setSendResult({ status: "error", message: "Failed to send email." });
      setSending(false);
    }
  }

  // --- UI ---
  return (
    <div className="container py-5">
      <div className="row g-4 justify-content-center">
        {/* --- Edit/Delete Tournaments Card --- */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-lg rounded-4 border-0 p-4 h-100"
            style={{ transition: "box-shadow .2s", minHeight: 420 }}>
            <img className="card-img-top mb-3 rounded-3"
              src="/images/card-img.png" alt="Tournament card"
              style={{ objectFit: "cover", height: 180 }} />
            <div className="card-body p-0">
              <h5 className="card-title fw-bold mb-2 text-primary">Edit or Delete Tournaments</h5>
              <p className="card-text text-muted mb-4">Change, cancel, or reschedule tournaments with just a click.</p>
              <div className="d-flex justify-content-center">
                <button className="btn btn-primary btn-lg rounded-pill px-5 shadow-sm"
                  style={{ fontWeight: 700, letterSpacing: ".06em", fontSize: "1.3rem", boxShadow: "0 2px 16px rgba(46,85,136,0.07)" }}
                  onClick={() => navigate("/edit-tournament")}
                >Go</button>
              </div>
            </div>
          </div>
        </div>
        {/* --- Send Message Card --- */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-lg rounded-4 border-0 p-4 h-100"
            style={{
              background: "linear-gradient(125deg, #e3f2fd 0%, #e8eaf6 100%)",
              transition: "box-shadow .2s", minHeight: 420,
            }}>
            <img className="card-img-top mb-3 rounded-3"
              src="/images/message-card.png" alt="Message card"
              style={{ objectFit: "cover", height: 180 }} />
            <div className="card-body p-0">
              <h5 className="card-title fw-bold mb-2 text-primary">Send Message</h5>
              <p className="card-text text-muted mb-4">Instantly send an email to selected groups, teams, or tournament attendees.</p>
              <button className="btn btn-primary btn-lg rounded-pill shadow-sm px-4"
                style={{ fontWeight: 600, letterSpacing: ".04em" }}
                onClick={() => setShowMessageModal(true)}
              >Send Message</button>
            </div>
          </div>
        </div>
      </div>
      {/* --- Message Modal --- */}
      {showMessageModal && (
        <div className="modal show d-block" tabIndex={-1}
          style={{ background: "rgba(44, 62, 80, 0.18)", backdropFilter: "blur(1.5px)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-0 pb-1">
                <h5 className="modal-title fw-bold text-primary">Send Message</h5>
                <button type="button" className="btn-close" aria-label="Close"
                  onClick={() => {
                    setShowMessageModal(false); setSendResult(null);
                    setRecipientGroups([]); setSubject(""); setBody(""); setSending(false);
                  }} />
              </div>
              <div className="modal-body pt-0">
                {/* --- Group Select --- */}
                <div className="mb-2">
                  <label className="fw-semibold mb-2">Add Groups to Email:</label>
                  <div className="d-flex flex-wrap gap-2 mb-2">
                    {/* Chips for selected groups */}
                    {recipientGroups.map((g, i) => (
                      <span key={i} className="badge rounded-pill bg-primary px-3 py-2 d-flex align-items-center gap-2">
                        {g.label}
                        <button className="btn-close btn-close-white btn-sm ms-2" type="button" style={{ fontSize: 12, opacity: 0.8 }}
                          onClick={() => removeRecipientGroup(i)} />
                      </span>
                    ))}
                  </div>
                  {/* Static role groups */}
                  <div className="d-flex flex-wrap gap-2 mb-2">
                    {GROUP_OPTIONS.map(g => (
                      <button key={g.label}
                        className="btn btn-outline-secondary btn-sm rounded-pill"
                        disabled={recipientGroups.some(rg => rg.type === g.type && rg.value === g.value)}
                        onClick={() => addRecipientGroup(g)}
                      >{g.label}</button>
                    ))}
                    {/* Team Selector */}
                    <select value={teamSelector} onChange={e => {
                      const val = e.target.value;
                      if (val) {
                        const team = teams.find(t => t.id === val);
                        addRecipientGroup({ label: `Team: ${team?.name || val}`, type: "team", value: val });
                        setTeamSelector("");
                      }
                    }} className="form-select form-select-sm" style={{ width: 160 }}>
                      <option value="">+ Team</option>
                      {teams.map(t => (
                        <option value={t.id} key={t.id}>{t.name}</option>
                      ))}
                    </select>
                    {/* Tournament Selector */}
                    <select value={tournSelector} onChange={e => {
                      const val = e.target.value;
                      if (val) {
                        const tourn = tournaments.find(t => t.id === val);
                        addRecipientGroup({ label: `Tournament: ${tourn?.eventName || val}`, type: "tournament", value: val });
                        setTournSelector("");
                      }
                    }} className="form-select form-select-sm" style={{ width: 180 }}>
                      <option value="">+ Tournament</option>
                      {tournaments.map(t => (
                        <option value={t.id} key={t.id}>{t.eventName}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* --- Recipient Summary --- */}
                <div className="mb-2">
                  <b>{allEmails.length}</b> recipients selected.
                  {allEmails.length > 0 && (
                    <button className="btn btn-link btn-sm ms-2 p-0" onClick={() => setShowRecipientsList(true)}>See all</button>
                  )}
                </div>
                {/* --- Subject and Body --- */}
                <input className="form-control mb-3 rounded-3"
                  placeholder="Subject"
                  style={{ fontSize: "1rem" }}
                  value={subject} onChange={e => setSubject(e.target.value)} disabled={sending} />
                <textarea className="form-control rounded-3"
                  placeholder="Type your message here..." rows={5}
                  style={{ fontSize: "1rem" }}
                  value={body} onChange={e => setBody(e.target.value)} disabled={sending} />
                {/* --- Status --- */}
                {sendResult && (
                  <div className={`alert mt-3 alert-${sendResult.status === "success" ? "success" : "danger"}`}>
                    {sendResult.message}
                  </div>
                )}
              </div>
              <div className="modal-footer border-0 pt-0">
                <button className="btn btn-outline-secondary rounded-pill" onClick={() => setShowMessageModal(false)} disabled={sending}>
                  Cancel
                </button>
                <button className="btn btn-primary rounded-pill px-4" onClick={handleSend} disabled={sending || !subject || !body}>
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </div>
          {/* --- Recipients List Popup --- */}
          {showRecipientsList && (
            <div style={{
              position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
              background: "rgba(32,48,80,0.27)", zIndex: 1055, display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <div className="card p-4 rounded-4 shadow" style={{ minWidth: 350, maxWidth: 450 }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <b>Recipient List</b>
                  <button className="btn-close" onClick={() => setShowRecipientsList(false)} />
                </div>
                <div style={{ maxHeight: 290, overflowY: "auto", fontSize: 14 }}>
                  {allEmails.map(email => (
                    <div key={email} style={{ borderBottom: "1px solid #eee", padding: 5 }}>{email}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageTournaments;
