import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../.firebase/utils/firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const RED = "#DF2E38";
const CARD_BG = "#fff";
const CARD_BORDER = "#eee";
const HEADER_COLOR = "#232323";
const BODY_COLOR = "#474747";

const CATEGORY_LABELS = {
  announcements: "Announcements",
  celebration: "Celebration Corner",
  reminders: "Reminders"
};

type Announcement = {
  id: string;
  type: string;
  title: string;
  body: string;
  timestamp?: any;
};

const AnnouncementsGrid: React.FC = () => {
  const [grouped, setGrouped] = useState<{ [cat: string]: Announcement[] }>({});
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState<boolean>(false);

  // Listen for auth state changes
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      setLoggedIn(!!user);
    });
    return () => unsub();
  }, []);

  // Fetch and group announcements
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
        Object.keys(CATEGORY_LABELS).forEach(type => (groupedByType[type] = []));
        for (const a of announcements) {
          if (a.type in CATEGORY_LABELS) {
            groupedByType[a.type].push(a);
          }
        }
        setGrouped(groupedByType);
      } finally {
        setLoading(false);
      }
    }
    fetchAnnouncements();
  }, []);

  // Only show these categories if logged in
  const colConfigs = [
    loggedIn ? "announcements" : null,
    "celebration",
    loggedIn ? "reminders" : null
  ].filter(Boolean) as ("announcements" | "celebration" | "reminders")[];

  // Responsive grid with up to 3 columns, always center "celebration"
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1150,
        margin: "0 auto",
        padding: "30px 0",
      }}
    >
      {loading ? (
        <div className="p-4 text-center">Loading announcements...</div>
      ) : (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 28,
            justifyContent: "center",
          }}
        >
          {colConfigs.map(type => (
            <div
              key={type}
              style={{
                background: CARD_BG,
                borderRadius: 18,
                boxShadow: "0 3px 18px #ececec55",
                border: `1.5px solid ${CARD_BORDER}`,
                padding: "22px 18px 18px 18px",
                flex: "1 1 310px",
                minWidth: 270,
                maxWidth: 355,
                display: "flex",
                flexDirection: "column",
                minHeight: 340,
                transition: "box-shadow .18s",
              }}
            >
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 22,
                  color: HEADER_COLOR,
                  marginBottom: 12,
                  letterSpacing: 0.7,
                  borderBottom: `2.2px solid ${RED}22`,
                  paddingBottom: 7,
                }}
              >
                {CATEGORY_LABELS[type]}
              </div>
              <div style={{ flex: 1 }}>
                {grouped[type] && grouped[type].length > 0 ? (
                  grouped[type].map((ann) => (
                    <div
                      key={ann.id}
                      style={{
                        marginBottom: 15,
                        paddingBottom: 11,
                        borderBottom: `1px solid #eeeeee`,
                      }}
                    >
                      <div style={{ fontWeight: 700, color: RED, fontSize: 16 }}>
                        {ann.title}
                      </div>
                      <div
                        style={{
                          color: BODY_COLOR,
                          fontSize: 15,
                          whiteSpace: "pre-line",
                          marginBottom: 3,
                          marginTop: 2,
                        }}
                      >
                        {ann.body}
                      </div>
                      {ann.timestamp?.toDate && (
                        <div
                          style={{
                            fontSize: 12.2,
                            color: "#b3b3b3",
                            marginTop: 2,
                          }}
                        >
                          {ann.timestamp.toDate().toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div
                    className="text-muted"
                    style={{
                      fontSize: 15.5,
                      marginTop: 25,
                      textAlign: "center",
                      color: "#ababab",
                    }}
                  >
                    No {CATEGORY_LABELS[type].toLowerCase()} yet.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Responsive styles */}
      <style>
        {`
          @media (max-width: 900px) {
            div[style*="flex-wrap: wrap"] > div {
              min-width: 85vw !important;
              max-width: 100vw !important;
              margin-left: auto !important;
              margin-right: auto !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default AnnouncementsGrid;
