import React from 'react';
import { Container, Row, Col, Card, ListGroup, Button } from 'react-bootstrap';
import { FaFileDownload, FaLink } from 'react-icons/fa';
import Footer from '../components/footer';

// --- Color palette ---
const RED = "#DF2E38";
const WHITE = "#fff";
const DARK_GREY = "#212121";
const LIGHT_GREY = "#f6f6f6";

interface Resource {
  id: string;
  title: string;
  description: string;
  link?: string;
  downloadUrl?: string;
}

const resourceCategories = {
  studyMaterials: [
    {
      id: 'sm1',
      title: 'General Study Guide',
      description: 'Guide introducing key concepts and strategies for Scholastic Bowl',
      downloadUrl: "/documents/general-study-guide.pdf"
    },
  ],
  practiceQuestions: [
    // {
    //   id: 'pq1',
    //   title: 'Literature Practice Set',
    //   description: 'Sample questions from previous tournaments',
    //   downloadUrl: '/documents/literature-practice.pdf'
    // }
  ],
  usefulLinks: [
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
    }
  ]
};

// Individual section with custom colors/spacing
const ResourceSection: React.FC<{ title: string; resources: Resource[] }> = ({
  title,
  resources
}) => (
  <Card
    className="mb-5 shadow-sm border-0"
    style={{
      background: WHITE,
      borderRadius: 18,
      boxShadow: "0 2px 16px #f4c3c6",
      overflow: "visible"
    }}
  >
    <Card.Header
      as="h2"
      className="h5"
      style={{
        background: RED,
        color: WHITE,
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        fontWeight: 700,
        fontSize: "1.18em",
        letterSpacing: 1
      }}
    >
      {title}
    </Card.Header>
    <ListGroup variant="flush" style={{ background: WHITE }}>
      {resources.map((resource) => (
        <ListGroup.Item
          key={resource.id}
          style={{
            borderBottom: "1px solid #fae3e6",
            background: WHITE,
            padding: "1.2em 1em"
          }}
        >
          <div style={{ color: DARK_GREY, fontWeight: 600, fontSize: 16 }}>
            {resource.title}
          </div>
          <div style={{ color: "#B71C1C", fontSize: 13, marginBottom: 9 }}>
            {resource.description}
          </div>
          {resource.downloadUrl && (
            <Button
              variant="outline-danger"
              size="sm"
              href={resource.downloadUrl}
              className="me-2"
              style={{
                fontWeight: 600,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: RED,
                color: RED,
                background: WHITE,
                boxShadow: "0 1px 8px #ffccd5"
              }}
            >
              {FaFileDownload({ size: 14, className: "me-1" })} Download
            </Button>
          )}
          {resource.link && (
            <Button
              variant="outline-dark"
              size="sm"
              href={resource.link}
              target="_blank"
              style={{
                fontWeight: 600,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: DARK_GREY,
                color: DARK_GREY,
                background: WHITE
              }}
            >
              {FaLink({ size: 14, className: "me-1" })} Visit
            </Button>
          )}
        </ListGroup.Item>
      ))}
    </ListGroup>
  </Card>
);

const Resources: React.FC = () => {
  return (
    <div style={{ background: LIGHT_GREY, minHeight: "100vh", width: "100vw" }}>
      <Container fluid className="py-5 px-0" style={{ maxWidth: "100vw" }}>
        <Container style={{ maxWidth: 1100 }}>
          <Row className="mb-4">
            <Col>
              <h1 className="text-center mb-3" style={{ color: RED, fontWeight: 800, letterSpacing: 1 }}>
                Resources
              </h1>
              <p className="lead text-center" style={{ color: DARK_GREY }}>
                Access study materials, practice questions, and useful links to help you prepare for competitions.
              </p>
            </Col>
          </Row>

          <Row>
            <Col lg={10} className="mx-auto">
              <ResourceSection
                title="Study Materials"
                resources={resourceCategories.studyMaterials}
              />
              <ResourceSection
                title="Practice Questions"
                resources={resourceCategories.practiceQuestions}
              />
              <ResourceSection
                title="Useful Links"
                resources={resourceCategories.usefulLinks}
              />
            </Col>
          </Row>
        </Container>
        {/* Footer outside so it flows full width */}
        <div style={{
          marginTop: 64,
          background: WHITE,
          borderTop: `2px solid ${RED}`,
          padding: "0px",
          boxShadow: "0 -2px 24px #fae3e6"
        }}>
          <Footer />
        </div>
      </Container>
    </div>
  );
};

export default Resources;
