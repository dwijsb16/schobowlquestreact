import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../.firebase/utils/firebase"; // Adjust import path if needed

const RED = "#DF2E38";
const DARK_RED = "#A71D2A";
const GREY = "#3B3B3B";
const LIGHT_GREY = "#F4F4F4";

const CATEGORY_LABELS = {
  "tournament-day": "Announcements for Tournament Day",
  "tournament-teams": "Announcements for Tournament Teams",
  "news": "News"
};

type Announcement = {
  id: string;
  type: string;
  title: string;
  body: string;
  timestamp?: any;
};

const Accordion: React.FC = () => {
  const [grouped, setGrouped] = useState<{ [cat: string]: Announcement[] }>({});
  const [loading, setLoading] = useState(true);
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  useEffect(() => {
    async function fetchAnnouncements() {
      setLoading(true);
      try {
        const q = query(collection(db, "announcements"), orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);
        const announcements: Announcement[] = [];
        snapshot.forEach(doc => {
          announcements.push({ id: doc.id, ...(doc.data() as Omit<Announcement, "id">) });
        });
        const groupedByType: { [cat: string]: Announcement[] } = {};
        for (const type of Object.keys(CATEGORY_LABELS)) groupedByType[type] = [];
        for (const a of announcements) {
          if (a.type in CATEGORY_LABELS) {
            groupedByType[a.type as keyof typeof CATEGORY_LABELS].push(a);
          }
        }
        setGrouped(groupedByType);
      } finally {
        setLoading(false);
      }
    }
    fetchAnnouncements();
  }, []);

  return (
    <div className="accordion my-5 shadow-sm rounded" id="qaAccordion">
      {loading ? (
        <div className="p-4 text-center">Loading announcements...</div>
      ) : (
        Object.entries(CATEGORY_LABELS).map(([type, label], idx) => (
          <div className="accordion-item" key={type}>
            <h2 className="accordion-header" id={`heading${idx}`}>
              <button
                className={`accordion-button ${openIdx === idx ? "" : "collapsed"}`}
                type="button"
                aria-expanded={openIdx === idx}
                aria-controls={`collapse${idx}`}
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                style={{
                  fontWeight: 700,
                  fontSize: "1.13rem",
                  background: openIdx === idx ? LIGHT_GREY : "#fff",
                  color: openIdx === idx ? RED : GREY,
                  border: `2px solid ${openIdx === idx ? RED : "#ececec"}`,
                  borderBottom: openIdx === idx ? `1px solid #ececec` : undefined,
                  borderRadius: openIdx === idx ? "14px 14px 0 0" : "14px",
                  transition: "background 0.2s, border 0.2s, color 0.13s",
                  boxShadow: openIdx === idx ? `0 2px 12px #df2e3840` : "none"
                }}
              >
                {label}
              </button>
            </h2>
            <div
              id={`collapse${idx}`}
              className={`accordion-collapse collapse ${openIdx === idx ? "show" : ""}`}
              aria-labelledby={`heading${idx}`}
              data-bs-parent="#qaAccordion"
            >
              <div className="accordion-body"
                style={{
                  background: "#fff8f8",
                  borderRadius: "0 0 14px 14px",
                  borderTop: `2px solid ${RED}10`, // subtle red tint
                  boxShadow: "none"
                }}>
                {grouped[type] && grouped[type].length > 0 ? (
                  grouped[type].map(ann => (
                    <div key={ann.id} className="mb-3 pb-2" style={{ borderBottom: `1px solid ${RED}1a` }}>
                      <div style={{ fontWeight: 700, color: RED }}>{ann.title}</div>
                      <div style={{ color: GREY }}>{ann.body}</div>
                      {ann.timestamp?.toDate &&
                        <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>
                          {ann.timestamp.toDate().toLocaleString()}
                        </div>}
                    </div>
                  ))
                ) : (
                  <div className="text-muted" style={{ fontSize: 15 }}>No announcements.</div>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Accordion;
