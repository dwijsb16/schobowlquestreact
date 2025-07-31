import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import emailjs from "emailjs-com";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../.firebase/utils/firebase";
import { getUsersByRole, getCollection, getUsersByTournament, getUsersByTeam } from "../hooks/firestore";
import Footer from "../components/footer";
import NavBar from "../components/Navbar";

const EMAIL_SERVICE_ID = "service_cfows1h";
const EMAIL_TEMPLATE_ID = "template_mk7qghu";
const EMAIL_USER_ID = "GRAfhbyKXL9qsCDKk";

const GROUP_OPTIONS = [
  { label: "Players", type: "role", value: "player" },
  { label: "Coaches", type: "role", value: "coach" },
  { label: "Parents", type: "role", value: "parent" },
];

// --- SVG ICONS ---
const AnnouncementSVG = (
  <svg width="250" height="250" viewBox="0 0 52 52" fill="none">
    
    <g>
      <path d="M41 17L41 35M41 17C36 22.5 18 26 11 29.5V22.5C18 26 36 29.5 41 17Z" stroke="#DF2E38" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="7.5" y="21" width="6" height="10" rx="2" fill="#DF2E38"/>
      <rect x="18" y="33" width="5" height="4" rx="1.7" fill="#232323"/>
    </g>
  </svg>
);
const MessageSVG = (
  <svg width="250" height="250" viewBox="0 0 52 52" fill="none">
    <g>
      <rect x="10" y="15" width="32" height="22" rx="3.5" stroke="#DF2E38" strokeWidth="2.2" fill="#fff"/>
      <path d="M13 17.5L26 29L39 17.5" stroke="#DF2E38" strokeWidth="2.2" strokeLinejoin="round"/>
    </g>
  </svg>
);


const ManageTournaments: React.FC = () => {
  const navigate = useNavigate();
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [recipientGroups, setRecipientGroups] = useState<any[]>([]);
  const [allEmails, setAllEmails] = useState<string[]>([]);
  const [showRecipientsList, setShowRecipientsList] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ status: "success" | "error"; message: string } | null>(null);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementType, setAnnouncementType] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementBody, setAnnouncementBody] = useState("");
  const [announcementStatus, setAnnouncementStatus] = useState<null | { status: "success" | "error", msg: string }>(null);

  // For dynamic team/tournament selection
  const [teams, setTeams] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [teamSelector, setTeamSelector] = useState<string>("");
  const [tournSelector, setTournSelector] = useState<string>("");

  useEffect(() => {
    if (showMessageModal) {
      getCollection("teams").then(setTeams);
      getCollection("tournaments").then(setTournaments);
    }
  }, [showMessageModal]);

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
          emails = players.map((u: any) => u.email || u);
        } else if (group.type === "tournament") {
          const attendees = await getUsersByTournament(group.value);
          emails = attendees.map((u: any) => u.email || u);
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
    const templateParams = {
      subject,
      message: body,
      to_email: "questsbclub@gmail.com",
      from_email: "questsbclub@gmail.com",
      message_type: "MESSAGE",
      bcc_list: allEmails.join(","),
    };
    try {
      await emailjs.send(EMAIL_SERVICE_ID, EMAIL_TEMPLATE_ID, templateParams, EMAIL_USER_ID);
      setSendResult({ status: "success", message: "Email sent via EmailJS!" });
      setSending(false);
    } catch (err) {
      setSendResult({ status: "error", message: "Failed to send email via EmailJS." });
      setSending(false);
    }
  }
  async function sendAnnouncement() {
    setAnnouncementStatus(null);
    if (!announcementType || !announcementTitle.trim() || !announcementBody.trim()) {
      setAnnouncementStatus({ status: "error", msg: "Please fill out all fields." });
      return;
    }
    try {
      await addDoc(collection(db, "announcements"), {
        type: announcementType,
        title: announcementTitle,
        body: announcementBody,
        timestamp: Timestamp.now()
      });
      setAnnouncementStatus({ status: "success", msg: "Announcement posted!" });
      setAnnouncementType(""); setAnnouncementTitle(""); setAnnouncementBody("");
      setTimeout(() => setShowAnnouncementModal(false), 1000);
    } catch (err) {
      setAnnouncementStatus({ status: "error", msg: "Failed to post announcement." });
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "#f7f7f7",
    }}>
      <NavBar />
      <main style={{ flex: 1 }}>
        <div className="container py-5">
          <div className="row g-4 justify-content-center">
            {/* --- Announcement Card --- */}
            <div className="col-12 col-lg-6">
              <div
                className="card shadow-lg rounded-4 border-0 p-4 h-100"
                style={{
                  background: "#fff",
                  border: "1.5px solid #f7f7f7",
                  minHeight: 420,
                  color: "#212121",
                }}
              >
                <div className="d-flex flex-column align-items-center mb-3">
                  {AnnouncementSVG}
                  <h5 className="card-title fw-bold mb-2" style={{ color: "#B71C1C" }}>
                    Create Announcement
                  </h5>
                </div>
                <p className="card-text mb-4" style={{ color: "#757575" }}>
                  Send official news or event updates to everyone in one place.
                </p>
                <div className="d-flex justify-content-center">
                  <button
                    className="btn"
                    style={{
                      background: "#DF2E38",
                      color: "#fff",
                      fontWeight: 700,
                      letterSpacing: ".06em",
                      fontSize: "1.2rem",
                      borderRadius: 22,
                      padding: "10px 38px",
                      boxShadow: "0 2px 12px #DF2E3833",
                    }}
                    onClick={() => setShowAnnouncementModal(true)}
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
            {/* --- Send Message Card --- */}
            <div className="col-12 col-lg-6">
              <div
                className="card shadow-lg rounded-4 border-0 p-4 h-100"
                style={{
                  background: "#fff",
                  border: "1.5px solid #f7f7f7",
                  minHeight: 420,
                  color: "#212121",
                }}
              >
                <div className="d-flex flex-column align-items-center mb-3">
                  {MessageSVG}
                  <h5 className="card-title fw-bold mb-2" style={{ color: "#B71C1C" }}>
                    Send Message
                  </h5>
                </div>
                <p className="card-text mb-4" style={{ color: "#757575" }}>
                  Instantly send an email to selected groups, teams, or tournament attendees.
                </p>
                <div className="d-flex justify-content-center">
                  <button
                    className="btn"
                    style={{
                      background: "#B71C1C",
                      color: "#fff",
                      fontWeight: 600,
                      letterSpacing: ".04em",
                      fontSize: "1.2rem",
                      borderRadius: 22,
                      padding: "10px 36px",
                      boxShadow: "0 2px 12px #B71C1C33",
                    }}
                    onClick={() => setShowMessageModal(true)}
                  >
                    Send Message
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* --- Announcement Modal --- */}
          {showAnnouncementModal && (
            <div className="modal show d-block" tabIndex={-1}
              style={{ background: "rgba(44, 62, 80, 0.18)", backdropFilter: "blur(1.5px)" }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content rounded-4 border-0 shadow-lg">
                  <div className="modal-header border-0 pb-1">
                    <h5 className="modal-title fw-bold" style={{ color: "#B71C1C" }}>Create Announcement</h5>
                    <button type="button" className="btn-close" aria-label="Close"
                      onClick={() => { setShowAnnouncementModal(false); setAnnouncementStatus(null); }} />
                  </div>
                  <div className="modal-body pt-0">
                    <label className="fw-semibold mb-2">Announcement Type:</label>
                    <select className="form-select mb-3" value={announcementType} onChange={e => setAnnouncementType(e.target.value)}>
                      <option value="">Select Type</option>
                      <option value="announcements">Announcements</option>
                      <option value="reminders">Reminders</option>
                      <option value="celebration">Celebration Corner</option>
                    </select>
                    <input className="form-control mb-3" placeholder="Title"
                      value={announcementTitle} onChange={e => setAnnouncementTitle(e.target.value)} />
                    <textarea className="form-control mb-2" placeholder="Body..."
                      rows={5}
                      value={announcementBody} onChange={e => setAnnouncementBody(e.target.value)} />
                    {announcementStatus &&
                      <div className={`alert alert-${announcementStatus.status}`}>{announcementStatus.msg}</div>}
                  </div>
                  <div className="modal-footer border-0 pt-0">
                    <button className="btn btn-outline-secondary rounded-pill"
                      onClick={() => setShowAnnouncementModal(false)}>Cancel</button>
                    <button className="btn" style={{ background: "#DF2E38", color: "#fff", borderRadius: 18 }}
                      onClick={sendAnnouncement}>Send</button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* --- Message Modal --- */}
          {showMessageModal && (
            <div className="modal show d-block" tabIndex={-1}
              style={{ background: "rgba(44, 62, 80, 0.18)", backdropFilter: "blur(1.5px)" }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content rounded-4 border-0 shadow-lg">
                  <div className="modal-header border-0 pb-1">
                    <h5 className="modal-title fw-bold" style={{ color: "#B71C1C" }}>Send Message</h5>
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
                          <span key={i} className="badge rounded-pill px-3 py-2 d-flex align-items-center gap-2"
                            style={{ background: "#DF2E38", color: "#fff", fontWeight: 600, fontSize: 15 }}>
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
                          {teams.map(t => {
                            const tourn = tournaments.find(trn => trn.id === t.tournamentId);
                            const tournName = tourn ? tourn.eventName : "Unknown Event";
                            return (
                              <option value={t.id} key={t.id}>
                                {t.name} ({tournName})
                              </option>
                            );
                          })}
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
                    <button className="btn" style={{ background: "#B71C1C", color: "#fff", borderRadius: 18 }}
                      onClick={handleSend} disabled={sending || !subject || !body}>
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
      </main>
    </div>
  );
};

export default ManageTournaments;
