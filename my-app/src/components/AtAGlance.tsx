import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, where, startAfter, limit } from "firebase/firestore";
import { db } from "../.firebase/utils/firebase";
import { Link } from "react-router-dom";

// For status coloring
const statusColor = (status: string) => {
  switch (status) {
    case "confirmed": return "#6BCB77"; // green
    case "cancelled": return "#FF6B6B"; // red
    case "tentative": return "#FFD93D"; // yellow
    default: return "#BDBDBD"; // gray
  }
};

const PAGE_SIZE = 8; // or whatever you want

const AtAGlanceCalendar: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  // Fetch events (paginated)
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const today = new Date();
      let q = query(
        collection(db, "tournaments"),
        where("date", ">=", today.toISOString().slice(0, 10)),
        orderBy("date"),
        limit(PAGE_SIZE)
      );
      if (lastVisible) q = query(
        collection(db, "tournaments"),
        where("date", ">=", today.toISOString().slice(0, 10)),
        orderBy("date"),
        startAfter(lastVisible.date),
        limit(PAGE_SIZE)
      );
      const snap = await getDocs(q);
      const newEvents = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvents(prev => [...prev, ...newEvents]);
      setLastVisible(newEvents.length > 0 ? newEvents[newEvents.length - 1] : lastVisible);
      setHasMore(newEvents.length === PAGE_SIZE);
    } catch (e) {
      setHasMore(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line
  }, []);

  const handleLoadMore = () => {
    if (!loading && hasMore) fetchEvents();
  };

  // Format date nicely
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <div className="col-md-4">
      <div className="card mt-3 shadow-sm" style={{ minHeight: 350, borderRadius: 18 }}>
        <div className="card-header fw-bold" style={{ fontSize: 18, background: "#f6f8fc", borderTopLeftRadius: 18, borderTopRightRadius: 18 }}>
          At a Glance
        </div>
        <div style={{ maxHeight: 320, overflowY: "auto" }}>
          {events.length === 0 && !loading && (
            <div className="text-center text-muted py-4">No upcoming events.</div>
          )}
          {events.map((ev) => (
            <div
              key={ev.id}
              className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2"
              style={{ borderColor: "#eef2f8", padding: "0 16px" }}
            >
              <div>
                <Link to={`/tournament/${ev.id}`}
                  style={{ textDecoration: "none", fontWeight: 500, color: "#1e417d" }}>
                  <span style={{
                    fontWeight: 700,
                    color: "#2677c9",
                    marginRight: 10
                  }}>{formatDate(ev.date)}</span>
                  {ev.eventName}
                </Link>
                <div style={{ fontSize: 13, color: "#7fa2b2" }}>
                  {ev.location || <span style={{ color: "#c4c4c4" }}>No location</span>}
                </div>
              </div>
              <span
                className="badge badge-pill"
                style={{
                  background: statusColor(ev.status),
                  color: "#fff",
                  fontSize: 15,
                  padding: "7px 18px"
                }}>
                {ev.status ? ev.status.charAt(0).toUpperCase() + ev.status.slice(1) : "TBA"}
              </span>
            </div>
          ))}
          {loading && (
            <div className="text-center text-secondary py-3">Loading...</div>
          )}
          {hasMore && !loading && (
            <div className="text-center mt-2 mb-2">
              <button className="btn btn-outline-primary btn-sm rounded-pill" onClick={handleLoadMore}>
                Load More
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AtAGlanceCalendar;
