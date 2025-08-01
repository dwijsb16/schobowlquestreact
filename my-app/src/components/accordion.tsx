import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit, startAfter } from "firebase/firestore";
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

const PAGE_SIZE = 5;

const AnnouncementsGrid: React.FC = () => {
  const [grouped, setGrouped] = useState<{ [cat: string]: any[] }>({});
  const [lastDocs, setLastDocs] = useState<{ [cat: string]: any }>({});
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      setLoggedIn(!!user);
    });
    return () => unsub();
  }, []);

  const loadAnnouncements = async (category: string, startAfterDoc?: any) => {
    const baseQuery = query(
      collection(db, "announcements"),
      orderBy("timestamp", "desc"),
      limit(PAGE_SIZE)
    );
    let q = baseQuery;
    if (startAfterDoc) {
      q = query(baseQuery, startAfter(startAfterDoc));
    }
  
    const snapshot = await getDocs(q);
    const newAnns = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((doc: any) => doc.type === category);
  
    setGrouped((prev) => {
      const existingIds = new Set((prev[category] || []).map((a: any) => a.id));
      const uniqueNewAnns = newAnns.filter((a) => !existingIds.has(a.id));
      return {
        ...prev,
        [category]: [...(prev[category] || []), ...uniqueNewAnns]
      };
    });
  
    if (snapshot.docs.length > 0) {
      setLastDocs((prev) => ({
        ...prev,
        [category]: snapshot.docs[snapshot.docs.length - 1]
      }));
    }
  };
  

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      const cats = Object.keys(CATEGORY_LABELS);
      for (const cat of cats) {
        await loadAnnouncements(cat);
      }
      setLoading(false);
    };
    loadAll();
  }, []);

  const colConfigs = [
    loggedIn ? "announcements" : null,
    "celebration",
    loggedIn ? "reminders" : null
  ].filter(Boolean) as ("announcements" | "celebration" | "reminders")[];

  const handleScroll = (e: React.UIEvent<HTMLDivElement>, type: string) => {
    const target = e.currentTarget;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 10) {
      if (lastDocs[type]) loadAnnouncements(type, lastDocs[type]);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1150,
        margin: "0 auto",
        padding: "30px 0"
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
            justifyContent: "center"
          }}
        >
          {colConfigs.map((type) => (
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
                transition: "box-shadow .18s"
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
                  paddingBottom: 7
                }}
              >
                {CATEGORY_LABELS[type]}
              </div>
              <div
                onScroll={(e) => handleScroll(e, type)}
                style={{
                  flex: 1,
                  overflowY: "auto",
                  maxHeight: 260,
                  paddingRight: 4
                }}
              >
                {grouped[type] && grouped[type].length > 0 ? (
                  grouped[type].map((ann) => (
                    <div
                      key={ann.id}
                      style={{
                        marginBottom: 15,
                        paddingBottom: 11,
                        borderBottom: `1px solid #eeeeee`
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
                          marginTop: 2
                        }}
                      >
                        {ann.body}
                      </div>
                      {ann.timestamp?.toDate && (
                        <div
                          style={{
                            fontSize: 12.2,
                            color: "#b3b3b3",
                            marginTop: 2
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
                      color: "#ababab"
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
    </div>
  );
};

export default AnnouncementsGrid;
