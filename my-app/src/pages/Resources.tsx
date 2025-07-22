import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, ListGroup, Button } from 'react-bootstrap';
import Footer from '../components/footer';
import { FaLink } from 'react-icons/fa';
import { db } from '../.firebase/utils/firebase';
import { collection, query, orderBy, getDocs } from "firebase/firestore";

const RED = "#DF2E38";
const WHITE = "#fff";
const DARK_GREY = "#212121";
const LIGHT_GREY = "#f6f6f6";

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

const StatsSection: React.FC<{ stats: Stat[] }> = ({ stats }) => (
  <Card
    className="mb-3 shadow-sm border-0"
    style={{
      background: WHITE,
      borderRadius: 16,
      maxHeight: 260,
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
      {stats.length === 0 && (
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
          <div style={{ fontWeight: 700, color: DARK_GREY, fontSize: 15, marginBottom: 2 }}>{stat.title}</div>
          <div style={{ color: "#B71C1C", fontSize: 13, marginBottom: 3 }}>{stat.date}</div>
          <Button
            size="sm"
            href={stat.link}
            target="_blank"
            style={{
              fontWeight: 600,
              borderRadius: 6,
              borderWidth: 2,
              borderColor: RED,
              color: RED,
              background: WHITE,
              fontSize: 14,
              padding: "3px 10px"
            }}
            variant="outline-danger"
          >
            {FaLink({ size: 13, className: "me-1" })} View Link
          </Button>
        </ListGroup.Item>
      ))}
    </ListGroup>
  </Card>
);

const UsefulLinksSection: React.FC = () => (
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
            {link.title}
          </div>
          <div style={{ color: "#B71C1C", fontSize: 12, marginBottom: 8 }}>
            {link.description}
          </div>
          <Button
            variant="outline-dark"
            size="sm"
            href={link.link}
            target="_blank"
            style={{
              fontWeight: 600,
              borderRadius: 6,
              borderWidth: 2,
              borderColor: DARK_GREY,
              color: DARK_GREY,
              background: WHITE,
              fontSize: 14,
              padding: "3px 10px"
            }}
          >
            {FaLink({ size: 13, className: "me-1" })} Visit
          </Button>
        </ListGroup.Item>
      ))}
    </ListGroup>
  </Card>
);

const Resources: React.FC = () => {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch stats from Firestore, newest first
    const fetchStats = async () => {
      setLoading(true);
      const q = query(collection(db, "stats"), orderBy("date", "desc"));
      const querySnap = await getDocs(q);
      const out: Stat[] = querySnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Stat[];
      setStats(out);
      setLoading(false);
    };
    fetchStats();
  }, []);

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
              <StatsSection stats={stats} />
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
