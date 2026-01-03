// ✅ DROP-IN REWRITE of your Accordion file with ONLY the "Co-Captain" enhancement added.
// Everything else stays the same.

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDoc, doc, getDocs } from "firebase/firestore";
import { db } from "../.firebase/utils/firebase";

/* ---------- tiny UI helpers ---------- */
const Badge: React.FC<{
  label: string;
  color?: string;
  bg?: string;
  title?: string;
  onClick?: () => void;
  clickable?: boolean;
}> = ({ label, color = "#fff", bg = "#777", title, onClick, clickable }) => (
  <span
    title={title}
    onClick={onClick}
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
      whiteSpace: "nowrap",
      cursor: clickable ? "pointer" : "default",
      border: clickable ? "1px solid #00000010" : undefined,
      boxShadow: clickable ? "0 1px 6px #00000010" : undefined,
      userSelect: "none",
    }}
  >
    {label}
  </span>
);

const statusStyle = (s?: string) => {
  switch ((s || "").toLowerCase()) {
    case "confirmed":
      return { bg: "#e5fbe9", color: "#166534", text: "CONFIRMED" };
    case "tentative":
      return { bg: "#fff7e6", color: "#92400e", text: "TENTATIVE" };
    case "cancelled":
      return { bg: "#fde8e8", color: "#991b1b", text: "CANCELLED" };
    default:
      return { bg: "#eef2f7", color: "#334155", text: (s || "STATUS").toUpperCase() };
  }
};

const typeStyle = (t?: string) => {
  switch ((t || "").toLowerCase()) {
    case "tournament":
      return { bg: "#e6f0ff", color: "#1d4ed8", text: "TOURNAMENT" };
    case "match_play":
      return { bg: "#f3e8ff", color: "#6d28d9", text: "MATCH" };
    case "extra_practice":
      return { bg: "#e6fff4", color: "#047857", text: "PRACTICE" };
    default:
      return { bg: "#eef2f7", color: "#334155", text: (t || "EVENT").toUpperCase() };
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
    <div
      style={{
        minWidth: 140,
        color: "#64748b",
        fontWeight: 700,
        textTransform: "uppercase",
        fontSize: 12,
        letterSpacing: 0.6,
      }}
    >
      {label}
    </div>
    <div style={{ color: "#0f172a", fontSize: 15 }}>{children}</div>
  </div>
);

/* ---------- status chip styles ---------- */
type Chip = { text: string; bg: string; color: string };
const chip = (text: string, bg: string, color: string): Chip => ({ text, bg, color });

function chipsForSignup(s: any): Chip[] {
  const avail = (s.availability || "").toLowerCase();
  const time = (t: string) => t?.slice(0, 5); // "HH:MM" friendly
  switch (avail) {
    case "yes":
      return [chip("Attending", "#e6fff4", "#047857")];
    case "no":
      return [chip("Not Attending", "#fde8e8", "#991b1b")];
    case "early":
      return [chip(`Leaving early @ ${time(s.endTime)}`, "#fff7e6", "#92400e")];
    case "late":
      return [chip(`Arriving late @ ${time(s.startTime)}`, "#f0f9ff", "#075985")];
    case "late_early":
      return [
        chip(`Arriving @ ${time(s.startTime)}`, "#f0f9ff", "#075985"),
        chip(`Leaving @ ${time(s.endTime)}`, "#fff7e6", "#92400e"),
      ];
    default:
      return [chip("No response", "#eef2f7", "#334155")];
  }
}

/* ---------- the component ---------- */
const Accordion: React.FC = () => {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [overlay, setOverlay] = useState<{ open: boolean; title: string; items: string[] }>({
    open: false,
    title: "",
    items: [],
  });

  useEffect(() => {
    const fetchAll = async () => {
      const tournSnap = await getDocs(collection(db, "tournaments"));
      const tourns = tournSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => {
          const A = Date.parse(
            `${a.date || "9999-12-31"}T${(a.startTime || "00:00").padEnd(8, ":00")}`
          );
          const B = Date.parse(
            `${b.date || "9999-12-31"}T${(b.startTime || "00:00").padEnd(8, ":00")}`
          );
          return A - B;
        });

      const results = await Promise.all(
        tourns.map(async (t: any) => {
          // signups for this tournament
          const signupSnap = await getDocs(collection(db, "signups", t.id, "entries"));
          const signupDocs = signupSnap.docs.map((s) => ({ id: s.id, ...(s.data() as any) }));

          // map signupId -> playerId
          const signupIdToPlayerId = new Map<string, string>();
          signupDocs.forEach((s) => s.playerId && signupIdToPlayerId.set(s.id, s.playerId));

          // fetch unique player docs used here
          const uniquePlayerIds = Array.from(new Set(signupDocs.map((s) => s.playerId).filter(Boolean)));
          const playerDocs = await Promise.all(uniquePlayerIds.map((pid) => getDoc(doc(db, "players", pid))));
          const playerIdToName = new Map<string, string>();
          playerDocs.forEach((p) => {
            if (p.exists()) {
              const data: any = p.data();
              playerIdToName.set(
                p.id,
                `${data.firstName || ""} ${data.lastName || ""}`.trim() || "Unknown"
              );
            }
          });

          // helper – prefer parent name if provided
          const volunteerDisplay = (s: any) => {
            const playerName = playerIdToName.get(s.playerId) || "Unknown";
            const parent = (s.parentName || "").trim();
            return parent ? `${parent} (parent of ${playerName})` : playerName;
          };

          // overlay lists
          const moderators = signupDocs.filter((s) => !!s.canModerate).map(volunteerDisplay);
          const scorekeepers = signupDocs.filter((s) => !!s.canScorekeep).map(volunteerDisplay);

          // team pretty lines
          const teamsSnap = await getDocs(collection(db, "tournaments", t.id, "teams"));
          const teamLines: string[] = [];

          teamsSnap.forEach((teamDoc) => {
            const td: any = teamDoc.data();
            const teamName = td.name || "Team";
            const members = Array.isArray(td.players) ? td.players : [];

            // ✅ NEW: compute captain count to label "Captain" vs "Co-Captain"
            const captainCount = members.filter((m: any) => !!m?.isCaptain).length;
            const captainLabel = captainCount > 1 ? "Co-Captain" : "Captain";

            const prettyMembers = members.map((m: any) => {
              const pid = signupIdToPlayerId.get(m.signupId || "");
              const name = pid ? playerIdToName.get(pid) || "Unknown" : "Unknown";

              // ✅ If multiple captains, show "(Co-Captain)" instead of "(Captain)"
              return m.isCaptain ? `${name} (${captainLabel})` : name;
            });

            teamLines.push(`${teamName}: ${prettyMembers.join(", ") || "—"}`);
          });

          // counts
          const canDrive = signupDocs.filter((s) => (s.carpool || "").includes("can-drive")).length;

          // build "responses" list with chips
          const responses = signupDocs.map((s) => {
            const name = playerIdToName.get(s.playerId) || "Unknown";
            const tags = chipsForSignup(s);
            return { name, tags };
          });

          // totals
          const total = signupDocs.length;
          const attendingCount = signupDocs.filter(
            (s) => (s.availability || "").toLowerCase() !== "no" && (s.availability || "") !== ""
          ).length;

          return {
            ...t,
            _teamsPretty: teamLines,
            _counts: {
              canDrive,
              moderatorsCount: moderators.length,
              scorekeepersCount: scorekeepers.length,
            },
            _lists: { moderators, scorekeepers },
            _responsesMeta: { total, attending: attendingCount },
            _responses: responses,
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
                style={{ padding: "14px 16px", borderBottom: "1px solid #eef2f7", gap: 10 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
                    {t.eventName || "Untitled Event"}
                  </div>

                  <Badge label={st.text} color={st.color} bg={st.bg} />
                  <Badge label={tp.text} color={tp.color} bg={tp.bg} />
                  {t.date && <Badge label={t.date} color="#1f2937" bg="#e5e7eb" />}
                  <Badge
                    label={isPublished ? "TEAMS PUBLISHED" : "TEAMS NOT PUBLISHED"}
                    color={isPublished ? "#065f46" : "#991b1b"}
                    bg={isPublished ? "#d1fae5" : "#fee2e2"}
                    title="Tournament-level publication flag"
                  />
                </div>

                <div className="d-flex gap-2">
                  <Link
                    to={`/edit-tournament`}
                    className="btn btn-outline-danger btn-sm"
                    style={{ borderRadius: 12, fontWeight: 700 }}
                  >
                    Edit Info
                  </Link>
                  <Link
                    to={`/coaches/make-teams`}
                    className="btn btn-dark btn-sm"
                    style={{ borderRadius: 12, fontWeight: 700 }}
                  >
                    Manage Teams
                  </Link>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: "14px 16px" }}>
                <Row label="Location">{t.location || <span className="text-muted">N/A</span>}</Row>

                <Row label="Time">
                  {t.startTime ? `Start: ${t.startTime}` : ""}
                  {t.endTime ? `${t.startTime ? " | " : ""}End: ${t.endTime}` : ""}
                  {!t.startTime && !t.endTime && <span className="text-muted">N/A</span>}
                </Row>

                <Row label="Shirt Color">{t.shirtColor || <span className="text-muted">N/A</span>}</Row>

                {t.additionalInfo && <Row label="Notes">{t.additionalInfo}</Row>}

                {/* Quick helpers / counts */}
                <div className="d-flex flex-wrap" style={{ gap: 8, marginTop: 8, marginBottom: 8 }}>
                  <Badge label={`Can Drive: ${t._counts?.canDrive ?? 0}`} color="#1e293b" bg="#e2e8f0" />
                  <Badge
                    label={`Moderators: ${t._counts?.moderatorsCount ?? 0}`}
                    color="#1e293b"
                    bg="#e2e8f0"
                    clickable
                    onClick={() => setOverlay({ open: true, title: "Moderators", items: t._lists?.moderators || [] })}
                  />
                  <Badge
                    label={`Scorekeepers: ${t._counts?.scorekeepersCount ?? 0}`}
                    color="#1e293b"
                    bg="#e2e8f0"
                    clickable
                    onClick={() => setOverlay({ open: true, title: "Scorekeepers", items: t._lists?.scorekeepers || [] })}
                  />
                </div>

                {/* Responses */}
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>
                    Responses{" "}
                    <span style={{ fontWeight: 700, color: "#64748b", fontSize: 13 }}>
                      (Total: {t._responsesMeta?.total ?? 0}
                      {typeof t._responsesMeta?.attending === "number" ? ` • Attending: ${t._responsesMeta.attending}` : ""})
                    </span>
                  </div>

                  {t._responses?.length ? (
                    <ul style={{ paddingLeft: 18, marginBottom: 0 }}>
                      {t._responses.map((r: any, i: number) => (
                        <li
                          key={i}
                          style={{
                            marginBottom: 6,
                            color: "#0f172a",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>{r.name}</span>
                          {r.tags.map((c: Chip, idx: number) => (
                            <span
                              key={idx}
                              style={{
                                padding: "2px 8px",
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 700,
                                background: c.bg,
                                color: c.color,
                              }}
                            >
                              {c.text}
                            </span>
                          ))}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-muted">No responses yet</div>
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

        {tournaments.length === 0 && <div className="text-center text-muted py-5">No tournaments found.</div>}
      </div>

      {/* overlay modal */}
      {overlay.open && (
        <div
          onClick={() => setOverlay({ open: false, title: "", items: [] })}
          style={{
            position: "fixed",
            inset: 0,
            background: "#0006",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            className="card p-3"
            onClick={(e) => e.stopPropagation()}
            style={{ width: 420, maxWidth: "92vw", borderRadius: 14 }}
          >
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="m-0" style={{ fontWeight: 800 }}>
                {overlay.title}
              </h5>
              <button
                className="btn btn-sm btn-light"
                onClick={() => setOverlay({ open: false, title: "", items: [] })}
              >
                Close
              </button>
            </div>
            {overlay.items.length ? (
              <ul className="mb-0" style={{ paddingLeft: 18 }}>
                {overlay.items.map((n, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>
                    {n}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-muted">No one yet</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Accordion;
