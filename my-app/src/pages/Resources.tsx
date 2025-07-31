import React, { useEffect, useState, useRef } from 'react';
import { Container, Row, Col, Card, ListGroup, Spinner } from 'react-bootstrap';
import Footer from '../components/footer';
import { FaLink } from 'react-icons/fa';
import { db } from '../.firebase/utils/firebase';
import { collection, query, orderBy, getDocs, startAfter, limit, QueryDocumentSnapshot } from "firebase/firestore";

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
  {
    id: 'ul1',
    title: 'NAQT Website',
    description: 'National Academic Quiz Tournaments official website',
    link: 'https://www.naqt.com'
  },
  {
    id: 'ul2',
    title: 'IESA Scholastic Bowl',
    description: 'Illinois Elementary School Association Scholastic Bowl',
    link: 'https://www.iesa.org/activities/sb/'
  },
  {
    id: 'ul3',
    title: 'SCOP study sheets',
    description: 'Study sheets in certain topics curated by SCOP',
    link: 'https://scop-qb.org/study-sheets/'
  },
  {
    id: 'ul4',
    title: 'QBreader',
    description: 'Online question database for practice and study',
    link: 'https://qbreader.org'
  }
];

// --- Custom Link Styles ---
const linkStyle: React.CSSProperties = {
  color: DARK_GREY,
  textDecoration: "underline",
  fontWeight: 700,
  fontSize: 15,
  transition: "color 0.13s"
};
const linkHoverStyle: React.CSSProperties = {
  ...linkStyle,
  color: BLUE
};

// --- Stats Section (Infinite List with Load More) ---
const PAGE_SIZE = 10;

const StatsSection: React.FC<{
  stats: Stat[],
  loading: boolean,
  onLoadMore: () => void,
  hasMore: boolean
}> = ({ stats, loading, onLoadMore, hasMore }) => {
  // For blue hover/focus, use inline state (since you don't use CSS)
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <Card
      className="mb-3 shadow-sm border-0"
      style={{
        background: WHITE,
        borderRadius: 16,
        minHeight: 120,
        overflowY: "auto",
        boxShadow: "0 2px 16px #f4c3c6"
      }}
    >
      <Card.Header
        as="h2"
        className="h6"
        style={{
          background: RED,
          color: WHITE,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          fontWeight: 700,
          fontSize: "1em",
          letterSpacing: 1
        }}
      >
        Stats (Most Recent First)
      </Card.Header>
      <ListGroup variant="flush" style={{ background: WHITE }}>
        {stats.length === 0 && !loading && (
          <ListGroup.Item style={{ background: WHITE, color: "#aaa" }}>
            No stats uploaded yet.
          </ListGroup.Item>
        )}
        {stats.map((stat) => (
          <ListGroup.Item
            key={stat.id}
            style={{
              borderBottom: "1px solid #fae3e6",
              background: WHITE,
              padding: "0.8em 0.8em"
            }}
          >
            <div style={{ fontWeight: 700, color: DARK_GREY, fontSize: 15, marginBottom: 2 }}>
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
            <div style={{ color: "#B71C1C", fontSize: 13, marginBottom: 3 }}>{stat.date}</div>
          </ListGroup.Item>
        ))}
      </ListGroup>
      {loading && (
        <div className="text-center py-3">
          <Spinner animation="border" size="sm" /> Loading...
        </div>
      )}
      {hasMore && !loading && (
        <div className="text-center pb-3">
          <button
            onClick={onLoadMore}
            style={{
              background: WHITE,
              color: RED,
              border: `2px solid ${RED}`,
              borderRadius: 10,
              fontWeight: 700,
              padding: "6px 28px",
              fontSize: 16,
              cursor: "pointer",
              marginTop: 6,
              transition: "background 0.12s, color 0.12s"
            }}
            onMouseDown={e => e.preventDefault()}
          >
            Load More
          </button>
        </div>
      )}
    </Card>
  );
};

// --- Useful Links Section ---
const UsefulLinksSection: React.FC = () => {
  const [hovered, setHovered] = useState<string | null>(null);
  return (
    <Card
      className="mb-3 shadow-sm border-0"
      style={{
        background: WHITE,
        borderRadius: 16,
        boxShadow: "0 2px 16px #f4c3c6"
      }}
    >
      <Card.Header
        as="h2"
        className="h6"
        style={{
          background: RED,
          color: WHITE,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          fontWeight: 700,
          fontSize: "1em",
          letterSpacing: 1
        }}
      >
        Useful Links
      </Card.Header>
      <ListGroup variant="flush" style={{ background: WHITE }}>
        {usefulLinks.map(link => (
          <ListGroup.Item
            key={link.id}
            style={{
              borderBottom: "1px solid #fae3e6",
              background: WHITE,
              padding: "1em 0.9em"
            }}
          >
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

// --- Main Resources Page ---
const Resources: React.FC = () => {
  const [stats, setStats] = useState<Stat[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const initialized = useRef(false);

  // Initial load (runs only once)
  useEffect(() => {
    if (!initialized.current) {
      loadStats(true);
      initialized.current = true;
    }
    // eslint-disable-next-line
  }, []);

  // Load stats with Firestore pagination
  const loadStats = async (reset = false) => {
    setLoading(true);
    let q = query(
      collection(db, "stats"),
      orderBy("date", "desc"),
      limit(PAGE_SIZE)
    );
    if (!reset && lastDoc) {
      q = query(
        collection(db, "stats"),
        orderBy("date", "desc"),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );
    }
    const querySnap = await getDocs(q);
    const newStats = querySnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Stat[];
    setStats(prev => reset ? newStats : [...prev, ...newStats]);
    setLastDoc(querySnap.docs[querySnap.docs.length - 1] || null);
    setHasMore(querySnap.docs.length === PAGE_SIZE);
    setLoading(false);
  };

  return (
    <div style={{ background: LIGHT_GREY, minHeight: "100vh", width: "100vw", padding: 0 }}>
      <Container fluid className="py-3 px-0" style={{ maxWidth: "100vw" }}>
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
              <StatsSection
                stats={stats}
                loading={loading}
                onLoadMore={() => loadStats(false)}
                hasMore={hasMore}
              />
              <UsefulLinksSection />
            </Col>
          </Row>
        </Container>
      </Container>
      <div style={{
        marginTop: 32,
        background: WHITE,
        borderTop: `2px solid ${RED}`,
        width: "100vw",
        position: "relative",
        left: "50%",
        right: "50%",
        marginLeft: "-50vw",
        marginRight: "-50vw",
        boxShadow: "none"
      }}>
        <Footer />
      </div>
    </div>
  );
};

export default Resources;
