import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, ListGroup, Spinner } from 'react-bootstrap';
import Footer from '../components/footer';
import { FaLink } from 'react-icons/fa';
import { db } from '..//.firebase/utils/firebase';
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { seasonForDate, compareSeasonsDesc } from '../utils/season';

// Colors
const RED = "#DF2E38";
const WHITE = "#fff";
const DARK_GREY = "#212121";
const LIGHT_GREY = "#f6f6f6";
const BLUE = "#0064D8"; // Link hover color

// Stat type
interface Stat {
  id: string;
  title: string;
  date: string;
  link: string;
  uploadedBy?: string;
}

const usefulLinks = [
  { id: 'ul1', title: 'NAQT Website', description: 'National Academic Quiz Tournaments official website', link: 'https://www.naqt.com' },
  { id: 'ul2', title: 'IESA Scholastic Bowl', description: 'Illinois Elementary School Association Scholastic Bowl', link: 'https://www.iesa.org/activities/scb/' },
  { id: 'ul4', title: 'QBReader', description: 'Online question database for practice and study', link: 'https://qbreader.org' }
];

// ✅ Hardcoded, private list – shown only if user is logged in
const questOnlyLinks = [
  { id: 'q1', title: 'Quest SB Google Drive', description: 'Folder of compiled study resources', link: 'https://drive.google.com/drive/u/0/folders/0BxFsUiIUeXFvalBQVHdpSXZtTkU' }
];

// --- Custom Link Styles ---
const linkStyle: React.CSSProperties = {
  color: DARK_GREY,
  textDecoration: "underline",
  fontWeight: 700,
  fontSize: 15,
  transition: "color 0.13s"
};
const linkHoverStyle: React.CSSProperties = { ...linkStyle, color: BLUE };

// --- Stats Section (season filter, sort, search, grouped by season, fixed-height scroll) ---
const STATS_LIST_HEIGHT = 280;

type StatSort = "newest" | "oldest" | "title";

const controlStyle: React.CSSProperties = {
  borderRadius: 10,
  border: "1.5px solid #f3dadf",
  fontWeight: 600,
  fontSize: 14,
};

const StatsSection: React.FC<{
  stats: Stat[],
  loading: boolean,
}> = ({ stats, loading }) => {
  const [hovered, setHovered] = useState<string | null>(null);
  const [season, setSeason] = useState<string>("all");
  const [sort, setSort] = useState<StatSort>("newest");
  const [search, setSearch] = useState("");

  // seasons present in the data, newest first
  const seasons = useMemo(
    () => Array.from(new Set(stats.map((s) => seasonForDate(s.date)))).sort(compareSeasonsDesc),
    [stats]
  );

  // filter + sort; date-based sorts keep seasons together, title sort is A–Z within each season
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = stats.filter(
      (s) =>
        (season === "all" || seasonForDate(s.date) === season) &&
        (!term || (s.title || "").toLowerCase().includes(term))
    );
    return rows.sort((a, b) => {
      const seasonCmp = compareSeasonsDesc(seasonForDate(a.date), seasonForDate(b.date));
      if (sort === "title") return seasonCmp || (a.title || "").localeCompare(b.title || "");
      const dateCmp = (a.date || "").localeCompare(b.date || "");
      return sort === "newest" ? -dateCmp : dateCmp;
    });
  }, [stats, season, sort, search]);

  const visible = filtered;

  return (
    <Card className="mb-3 shadow-sm border-0" style={{ background: WHITE, borderRadius: 16, boxShadow: "0 2px 16px #f4c3c6", overflow: "hidden" }}>
      <Card.Header as="h2" className="h6" style={{ background: RED, color: WHITE, borderTopLeftRadius: 16, borderTopRightRadius: 16, fontWeight: 700, fontSize: "1em", letterSpacing: 1 }}>
        Stats <span style={{ fontWeight: 500, opacity: 0.85 }}>({filtered.length})</span>
      </Card.Header>

      {/* Filters */}
      <div className="d-flex flex-wrap align-items-center" style={{ gap: 8, padding: "0.8em 0.8em 0.4em" }}>
        <input
          type="search"
          className="form-control"
          placeholder="Search stats…"
          aria-label="Search stats by title"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...controlStyle, flex: "1 1 180px" }}
        />
        <select
          className="form-select"
          aria-label="Filter by season"
          value={season}
          onChange={(e) => setSeason(e.target.value)}
          style={{ ...controlStyle, flex: "0 1 170px" }}
        >
          <option value="all">All Seasons</option>
          {seasons.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          className="form-select"
          aria-label="Sort stats"
          value={sort}
          onChange={(e) => setSort(e.target.value as StatSort)}
          style={{ ...controlStyle, flex: "0 1 170px" }}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title (A–Z)</option>
        </select>
      </div>

      <ListGroup
        variant="flush"
        style={{ background: WHITE, height: STATS_LIST_HEIGHT, overflowY: "auto", borderTop: "1px solid #fae3e6" }}
      >
        {visible.length === 0 && !loading && (
          <ListGroup.Item style={{ background: WHITE, color: "#aaa" }}>
            {stats.length === 0 ? "No stats uploaded yet." : "No stats match these filters."}
          </ListGroup.Item>
        )}
        {visible.map((stat, idx) => {
          const statSeason = seasonForDate(stat.date);
          const showHeader = idx === 0 || seasonForDate(visible[idx - 1].date) !== statSeason;
          const seasonCount = filtered.filter((s) => seasonForDate(s.date) === statSeason).length;
          return (
            <React.Fragment key={stat.id}>
              {showHeader && (
                <ListGroup.Item style={{ background: "#fff5f6", color: RED, fontWeight: 800, fontSize: 13, letterSpacing: 0.5, padding: "0.35em 0.8em", position: "sticky", top: 0, zIndex: 1 }}>
                  {statSeason === "No Date" ? "No Date" : `${statSeason} Season`}
                  <span style={{ color: "#B71C1C", fontWeight: 600, marginLeft: 8 }}>({seasonCount})</span>
                </ListGroup.Item>
              )}
              <ListGroup.Item
                className="d-flex justify-content-between align-items-baseline"
                style={{ borderBottom: "1px solid #fae3e6", background: WHITE, padding: "0.45em 0.8em", gap: 10 }}
              >
                <div style={{ fontWeight: 700, color: DARK_GREY, fontSize: 14, minWidth: 0 }}>
                  <a
                    href={stat.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={hovered === stat.id ? linkHoverStyle : linkStyle}
                    onMouseEnter={() => setHovered(stat.id)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(stat.id)}
                    onBlur={() => setHovered(null)}
                  >
                    {FaLink({ size: 13, className: "me-1" })}
                    {stat.title}
                  </a>
                </div>
                <div style={{ color: "#B71C1C", fontSize: 12, whiteSpace: "nowrap" }}>{stat.date}</div>
              </ListGroup.Item>
            </React.Fragment>
          );
        })}
      </ListGroup>
      {loading && (
        <div className="text-center py-3">
          <Spinner animation="border" size="sm" /> Loading...
        </div>
      )}
    </Card>
  );
};

// --- Useful Links Section ---
const UsefulLinksSection: React.FC = () => {
  const [hovered, setHovered] = useState<string | null>(null);
  return (
    <Card className="mb-3 shadow-sm border-0" style={{ background: WHITE, borderRadius: 16, boxShadow: "0 2px 16px #f4c3c6" }}>
      <Card.Header as="h2" className="h6" style={{ background: RED, color: WHITE, borderTopLeftRadius: 16, borderTopRightRadius: 16, fontWeight: 700, fontSize: "1em", letterSpacing: 1 }}>
        Useful Links
      </Card.Header>
      <ListGroup variant="flush" style={{ background: WHITE }}>
        {usefulLinks.map(link => (
          <ListGroup.Item key={link.id} style={{ borderBottom: "1px solid #fae3e6", background: WHITE, padding: "1em 0.9em" }}>
            <div style={{ color: DARK_GREY, fontWeight: 600, fontSize: 15 }}>
              <a
                href={link.link}
                target="_blank"
                rel="noopener noreferrer"
                style={hovered === link.id ? linkHoverStyle : linkStyle}
                onMouseEnter={() => setHovered(link.id)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(link.id)}
                onBlur={() => setHovered(null)}
              >
                {FaLink({ size: 13, className: "me-1" })}
                {link.title}
              </a>
            </div>
            <div style={{ color: "#B71C1C", fontSize: 12, marginBottom: 8 }}>
              {link.description}
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Card>
  );
};

// --- Quest-Only (Hardcoded) Section — shows only if logged in ---
const QuestOnlyLinksSection: React.FC = () => {
  const [hovered, setHovered] = useState<string | null>(null);
  return (
    <Card className="mb-3 shadow-sm border-0" style={{ background: WHITE, borderRadius: 16, boxShadow: "0 2px 16px #f4c3c6" }}>
      <Card.Header as="h2" className="h6" style={{ background: RED, color: WHITE, borderTopLeftRadius: 16, borderTopRightRadius: 16, fontWeight: 700, fontSize: "1em", letterSpacing: 1 }}>
        Quest-Only Resources
      </Card.Header>
      <ListGroup variant="flush" style={{ background: WHITE }}>
        {questOnlyLinks.map(link => (
          <ListGroup.Item key={link.id} style={{ borderBottom: "1px solid #fae3e6", background: WHITE, padding: "1em 0.9em" }}>
            <div style={{ color: DARK_GREY, fontWeight: 700, fontSize: 15 }}>
              <a
                href={link.link}
                target="_blank"
                rel="noopener noreferrer"
                style={hovered === link.id ? linkHoverStyle : linkStyle}
                onMouseEnter={() => setHovered(link.id)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(link.id)}
                onBlur={() => setHovered(null)}
              >
                {FaLink({ size: 13, className: "me-1" })}
                {link.title}
              </a>
            </div>
            {link['description'] && (
              <div style={{ color: "#B71C1C", fontSize: 12, marginBottom: 8 }}>
                {link['description']}
              </div>
            )}
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Card>
  );
};

// --- Main Resources Page ---
const Resources: React.FC = () => {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔐 Auth state (to toggle Quest-only section)
  const [user, setUser] = useState<FirebaseUser | null>(null);

  // Load all stats once; filtering, sorting and paging happen client-side
  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const querySnap = await getDocs(query(collection(db, "stats"), orderBy("date", "desc")));
        setStats(querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Stat[]);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  // Auth listener
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: LIGHT_GREY
      }}
    >
      {/* Main content */}
      <main style={{ flex: 1 }}>
        <Container fluid className="py-3 px-0">
          <Container style={{ maxWidth: 900 }}>
            <Row className="mb-3">
              <Col>
                <h1 className="text-center mb-2" style={{ color: RED, fontWeight: 800, letterSpacing: 1 }}>
                  Resources
                </h1>
                <p className="lead text-center" style={{ color: DARK_GREY, fontSize: 17 }}>
                  Access stats and useful links to help you prepare for competitions.
                </p>
              </Col>
            </Row>

            <Row>
              <Col lg={10} className="mx-auto" style={{ padding: 0 }}>
                <StatsSection stats={stats} loading={loading} />

                {/* ✅ Only render if logged in */}
                {user && <QuestOnlyLinksSection />}

                <UsefulLinksSection />
              </Col>
            </Row>
          </Container>
        </Container>
      </main>

      {/* Footer pinned to the bottom without extra scroll */}
      <footer style={{ background: WHITE, borderTop: `2px solid ${RED}` }}>
        <Footer />
      </footer>
    </div>
  );
};

export default Resources;
