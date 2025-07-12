import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import emailjs from "emailjs-com";
import { db } from "../.firebase/utils/firebase";

// EMAILJS config
const SERVICE_ID = "service_cfows1h";
const TEMPLATE_ID = "template_mk7qghu";
const EMAILJS_KEY = "GRAfhbyKXL9qsCDKk";

// Types
type TournamentDoc = {
  id: string;
  eventName: string; // always required in your dropdowns!
};

type Team = {
  id: string;
  name: string;
  tournamentId: string;
  emails: string[];
  tournamentName: string;
};

const SendBulkMessage: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "danger"; message: string } | null>(null);

  // 1. Load all teams (with tournament names)
  useEffect(() => {
    async function fetchTeams() {
      // First fetch all tournaments (with type-casting for eventName!)
      const tournSnap = await getDocs(collection(db, "tournaments"));
      const tournaments: TournamentDoc[] = tournSnap.docs.map((docu) => ({
        id: docu.id,
        eventName: (docu.data() as any).eventName ?? "Unknown", // fallback if not set
      }));

      let allTeams: Team[] = [];
      for (const t of tournaments) {
        const teamsSnap = await getDocs(collection(db, "tournaments", t.id, "teams"));
        for (const teamDoc of teamsSnap.docs) {
          const teamData = teamDoc.data();
          let emails: string[] = [];
          for (const player of teamData.players || []) {
            const signupRef = doc(db, "signups", t.id, "entries", player.signupId);
            const signupSnap = await getDoc(signupRef);
            if (signupSnap.exists()) {
              const signupData = signupSnap.data();
              if (signupData.parentEmail) emails.push(signupData.parentEmail);
              if (signupData.email) emails.push(signupData.email);
              if (signupData.playerId) {
                const playerSnap = await getDoc(doc(db, "players", signupData.playerId));
                if (playerSnap.exists()) {
                  const playerData = playerSnap.data();
                  if (playerData.email) emails.push(playerData.email);
                  if (playerData.parentEmail) emails.push(playerData.parentEmail);
                }
              }
            }
          }
          emails = [...new Set(emails.filter(Boolean).map((e: string) => e.trim()))];
          allTeams.push({
            id: teamDoc.id,
            name: teamData.name,
            tournamentId: t.id,
            emails,
            tournamentName: t.eventName, // Now guaranteed to exist!
          });
        }
      }
      setTeams(allTeams);
    }
    fetchTeams();
  }, []);

  // 2. Handle team selection
  function handleTeamSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
    setSelectedTeamIds(selected);
  }

  // 3. Send Message via EmailJS
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setAlert(null);
    if (!subject.trim() || !content.trim() || selectedTeamIds.length === 0) {
      setAlert({ type: "danger", message: "Please fill out all fields and select at least one team." });
      return;
    }
    setSending(true);

    // Get all emails from selected teams
    const allEmails = teams
      .filter((t) => selectedTeamIds.includes(t.id))
      .flatMap((t) => t.emails);
    const uniqueEmails = [...new Set(allEmails)].filter(Boolean);

    if (uniqueEmails.length === 0) {
      setAlert({ type: "danger", message: "No email addresses found for selected team(s)." });
      setSending(false);
      return;
    }

    try {
      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
          subject,
          content,
          bcc_list: uniqueEmails.join(","),
        },
        EMAILJS_KEY
      );
      setAlert({ type: "success", message: "Message sent successfully!" });
      setSubject("");
      setContent("");
      setSelectedTeamIds([]);
    } catch (err: any) {
      setAlert({ type: "danger", message: "Failed to send message. Please try again." });
    }
    setSending(false);
  }

  return (
    <div className="container py-5" style={{ maxWidth: 600 }}>
      <h2 className="mb-4" style={{ fontWeight: 700, color: "#2155CD" }}>Send Message</h2>
      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible`} role="alert">
          {alert.message}
          <button type="button" className="btn-close" onClick={() => setAlert(null)}></button>
        </div>
      )}

      <form onSubmit={handleSend}>
        <div className="mb-3">
          <label className="form-label fw-semibold">Select Teams</label>
          <select
            className="form-select"
            multiple
            value={selectedTeamIds}
            onChange={handleTeamSelect}
            style={{ minHeight: 120 }}
            disabled={sending || teams.length === 0}
          >
            {teams.map((team) => (
              <option value={team.id} key={team.id}>
                {team.name} &mdash; {team.tournamentName}
              </option>
            ))}
          </select>
          <small className="text-muted">
            Hold <kbd>Ctrl</kbd> (Windows) or <kbd>Cmd</kbd> (Mac) to select multiple.
          </small>
        </div>
        <div className="mb-3">
          <label className="form-label fw-semibold">Subject</label>
          <input
            type="text"
            className="form-control"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            disabled={sending}
            placeholder="Subject"
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label fw-semibold">Content</label>
          <textarea
            className="form-control"
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={6}
            disabled={sending}
            placeholder="Type your message..."
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary btn-lg w-100"
          style={{ fontWeight: 700, borderRadius: 18 }}
          disabled={sending}
        >
          {sending ? "Sending..." : "Send Message"}
        </button>
      </form>
    </div>
  );
};

export default SendBulkMessage;
