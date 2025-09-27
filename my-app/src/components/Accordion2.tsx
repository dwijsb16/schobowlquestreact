import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  getDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { db } from "../.firebase/utils/firebase";

// --- Small badge helpers ---
const Badge: React.FC<{ label: string; color?: string; bg?: string; title?: string }> = ({ label, color = "#fff", bg = "#777", title }) => (
  <span
    title={title}
    style={{
      display: "inline-block",
      padding: "4px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 800,
      color,
      background: bg,
      letterSpacing: 0.3,
      marginRight: 8,
      whiteSpace: "nowrap"
    }}
  >
    {label}
  </span>
);

// --- Status / Type badge styles ---
const statusStyle = (s?: string) => {
  switch ((s || "").toLowerCase()) {
    case "confirmed": return { bg: "#e5fbe9", color: "#166534", text: "CONFIRMED" };
    case "tentative": return { bg: "#fff7e6", color: "#92400e", text: "TENTATIVE" };
    case "cancelled": return { bg: "#fde8e8", color: "#991b1b", text: "CANCELLED" };
    default: return { bg: "#eef2f7", color: "#334155", text: (s || "STATUS").toUpperCase() };
  }
};
const typeStyle = (t?: string) => {
  switch ((t || "").toLowerCase()) {
    case "tournament": return { bg: "#e6f0ff", color: "#1d4ed8", text: "TOURNAMENT" };
    case "match_play": return { bg: "#f3e8ff", color: "#6d28d9", text: "MATCH" };
    case "extra_practice": return { bg: "#e6fff4", color: "#047857", text: "PRACTICE" };
    default: return { bg: "#eef2f7", color: "#334155", text: (t || "EVENT").toUpperCase() };
  }
};

const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    className="card border-0 shadow-sm"
    style={{
      borderRadius: 18,
      background: "#fff",
      boxShadow: "0 6px 28px #0f172a10",
      overflow: "hidden",
      marginBottom: 16,
    }}
  >
    {children}
  </div>
);

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="d-flex" style={{ gap: 10, marginBottom: 6, alignItems: "baseline" }}>
    <div style={{ minWidth: 140, color: "#64748b", fontWeight: 700, textTransform: "uppercase", fontSize: 12, letterSpacing: 0.6 }}>
      {label}
    </div>
    <div style={{ color: "#0f172a", fontSize: 15 }}>{children}</div>
  </div>
);

const Accordion: React.FC = () => {
  const [tournaments, setTournaments] = useState<any[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      // 1) Pull tournaments and sort by date + startTime
      const tournSnap = await getDocs(collection(db, "tournaments"));
      const tourns = tournSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => {
          const A = Date.parse(`${a.date || "9999-12-31"}T${(a.startTime || "00:00").padEnd(8, ":00")}`);
          const B = Date.parse(`${b.date || "9999-12-31"}T${(b.startTime || "00:00").padEnd(8, ":00")}`);
          return A - B;
        });

      // 2) For each tournament, fetch:
      //    - signup entries (to map signupId -> playerId and name)
      //    - teams (with players.signupId + isCaptain)
      //    - build pretty team lines "Team A: Alice (Captain), Bob"
      const results = await Promise.all(
        tourns.map(async (t: any) => {
          // --- pull signups so we can resolve names by signupId ---
          const signupSnap = await getDocs(collection(db, "signups", t.id, "entries"));
          const signupDocs = signupSnap.docs.map(s => ({ id: s.id, ...(s.data() as any) }));
          const signupIdToPlayerId = new Map<string, string>();
          signupDocs.forEach(s => {
            if (s.playerId) signupIdToPlayerId.set(s.id, s.playerId);
          });

          // Fetch unique player docs for these signups
          const uniquePlayerIds = Array.from(new Set(signupDocs.map(s => s.playerId).filter(Boolean)));
          const playerDocs = await Promise.all(uniquePlayerIds.map(pid => getDoc(doc(db, "players", pid))));
          const playerIdToName = new Map<string, string>();
          playerDocs.forEach(p => {
            if (p.exists()) {
              const data: any = p.data();
              playerIdToName.set(p.id, `${data.firstName || ""} ${data.lastName || ""}`.trim() || "Unknown");
            }
          });
          // --- signup counters & name lists ---
const totalSignups = signupDocs.length;
const attendingDocs = signupDocs.filter(s => (s.availability || "").toLowerCase() !== "no");

const allSignupNames = signupDocs
  .map(s => playerIdToName.get(s.playerId) || "Unknown");

const attendingNames = attendingDocs
  .map(s => playerIdToName.get(s.playerId) || "Unknown");


          // --- pull teams and format lines ---
          const teamsSnap = await getDocs(collection(db, "tournaments", t.id, "teams"));
          const teamLines: string[] = [];
          teamsSnap.forEach(teamDoc => {
            const td: any = teamDoc.data();
            const teamName = td.name || "Team";
            const members = Array.isArray(td.players) ? td.players : [];
            const prettyMembers = members.map((m: any) => {
              const pid = signupIdToPlayerId.get(m.signupId || "");
              const name = pid ? (playerIdToName.get(pid) || "Unknown") : "Unknown";
              return m.isCaptain ? `${name} (Captain)` : name;
            });
            teamLines.push(`${teamName}: ${prettyMembers.join(", ") || "—"}`);
          });

          // People counts (optional: reuse your earlier lists)
          // Simple counts using signup docs:
          const canDrive = signupDocs.filter(s => (s.carpool || "").includes("can-drive")).length;
          const canMod = signupDocs.filter(s => !!s.canModerate).length;
          const canScore = signupDocs.filter(s => !!s.canScorekeep).length;

          return {
            ...t,
            _teamsPretty: teamLines,               // formatted lines
            _counts: { canDrive, canMod, canScore },
              _signups: {
                total: totalSignups,
                namesAll: allSignupNames,
                attending: attendingNames.length,
                namesAttending: attendingNames,
              },
            
          };
        })
      );

      setTournaments(results);
    };
    fetchAll();
  }, []);

  return (
    <div style={{ background: "#f6f8fb", minHeight: "100vh" }}>
      <div className="container py-4" style={{ maxWidth: 1000 }}>
        <h1 className="mb-4" style={{ fontWeight: 900, color: "#111827", letterSpacing: 0.4 }}>
          Events & Teams
        </h1>

        {tournaments.map((t: any) => {
          const st = statusStyle(t.status);
          const tp = typeStyle(t.eventType);
          const isPublished = !!t.teamsPublished;

          return (
            <Card key={t.id}>
              {/* Header */}
              <div
                className="d-flex flex-wrap align-items-center justify-content-between"
                style={{
                  padding: "14px 16px",
                  borderBottom: "1px solid #eef2f7",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
                    {t.eventName || "Untitled Event"}
                  </div>

                  <Badge label={st.text} color={st.color} bg={st.bg} />
                  <Badge label={tp.text} color={tp.color} bg={tp.bg} />
                  {t.date && (
                    <Badge label={t.date} color="#1f2937" bg="#e5e7eb" />
                  )}
                  <Badge
                    label={isPublished ? "TEAMS PUBLISHED" : "TEAMS NOT PUBLISHED"}
                    color={isPublished ? "#065f46" : "#991b1b"}
                    bg={isPublished ? "#d1fae5" : "#fee2e2"}
                    title="Tournament-level publication flag"
                  />
                </div>

                <div className="d-flex gap-2">
                  <Link to={`/edit-tournament`} className="btn btn-outline-danger btn-sm" style={{ borderRadius: 12, fontWeight: 700 }}>
                    Edit Info
                  </Link>
                  <Link to={`/coaches/make-teams`} className="btn btn-dark btn-sm" style={{ borderRadius: 12, fontWeight: 700 }}>
                    Manage Teams
                  </Link>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: "14px 16px" }}>
                <Row label="Location">
                  {t.location || <span className="text-muted">N/A</span>}
                </Row>

                <Row label="Time">
                  {t.startTime ? `Start: ${t.startTime}` : ""}
                  {t.endTime ? `${t.startTime ? " | " : ""}End: ${t.endTime}` : ""}
                  {!t.startTime && !t.endTime && <span className="text-muted">N/A</span>}
                </Row>

                <Row label="Shirt Color">
                  {t.shirtColor || <span className="text-muted">N/A</span>}
                </Row>

                {t.additionalInfo && (
                  <Row label="Notes">{t.additionalInfo}</Row>
                )}

                {/* Quick helpers / counts */}
                <div className="d-flex flex-wrap" style={{ gap: 8, marginTop: 8, marginBottom: 8 }}>
                  <Badge label={`Can Drive: ${t._counts?.canDrive ?? 0}`} color="#1e293b" bg="#e2e8f0" />
                  <Badge label={`Moderators: ${t._counts?.canMod ?? 0}`} color="#1e293b" bg="#e2e8f0" />
                  <Badge label={`Scorekeepers: ${t._counts?.canScore ?? 0}`} color="#1e293b" bg="#e2e8f0" />
                </div>
                {/* Signups */}
<div style={{ marginTop: 10 }}>
  <div style={{ fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>
    Signups{" "}
    <span style={{ fontWeight: 700, color: "#64748b", fontSize: 13 }}>
      (Total: {t._signups?.total ?? 0}
      {typeof t._signups?.attending === "number" ? ` • Attending: ${t._signups.attending}` : ""})
    </span>
  </div>

  {t._signups?.namesAll?.length ? (
    <ul style={{ paddingLeft: 18, marginBottom: 0 }}>
      {t._signups.namesAll.map((name: string, i: number) => (
        <li key={i} style={{ marginBottom: 3, color: "#0f172a" }}>
          {name}
        </li>
      ))}
    </ul>
  ) : (
    <div className="text-muted">No signups yet</div>
  )}
</div>

                {/* Teams */}
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>Teams</div>
                  {t._teamsPretty && t._teamsPretty.length > 0 ? (
                    <ul style={{ paddingLeft: 18, marginBottom: 0 }}>
                      {t._teamsPretty.map((line: string, idx: number) => (
                        <li key={idx} style={{ marginBottom: 4, color: "#0f172a" }}>
                          {line}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-muted">No teams yet</div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}

        {tournaments.length === 0 && (
          <div className="text-center text-muted py-5">No tournaments found.</div>
        )}
      </div>
    </div>
  );
};

export default Accordion;
