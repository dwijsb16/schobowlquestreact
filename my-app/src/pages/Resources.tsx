import React from 'react';
import { Container, Row, Col, Card, ListGroup, Button } from 'react-bootstrap';
import { FaFileDownload, FaLink } from 'react-icons/fa';
import Footer from '../components/footer';

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
      title: 'History Study Guide',
      description: 'Comprehensive guide for historical events and dates',
      downloadUrl: '/documents/history-guide.pdf'
    },
    {
      id: 'sm2',
      title: 'Science Quick Reference',
      description: 'Key scientific concepts and formulas',
      downloadUrl: '/documents/science-reference.pdf'
    }
  ],
  practiceQuestions: [
    {
      id: 'pq1',
      title: 'Literature Practice Set',
      description: 'Sample questions from previous tournaments',
      downloadUrl: '/documents/literature-practice.pdf'
    }
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
    }
  ]
};

const ResourceSection: React.FC<{ title: string; resources: Resource[] }> = ({ 
  title, 
  resources 
}) => (
  <Card className="mb-4">
    <Card.Header as="h2" className="h5">{title}</Card.Header>
    <ListGroup variant="flush">
      {resources.map((resource) => (
        <ListGroup.Item key={resource.id}>
          <h3 className="h6 mb-1">{resource.title}</h3>
          <p className="mb-2 text-muted small">{resource.description}</p>

          {resource.downloadUrl && (
            <Button 
              variant="outline-primary" 
              size="sm" 
              href={resource.downloadUrl}
              className="me-2"
            >
              {FaFileDownload({ size: 14, className: "me-1" })} Download
            </Button>
          )}
          {resource.link && (
            <Button 
              variant="outline-secondary" 
              size="sm" 
              href={resource.link} 
              target="_blank"
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
    <Container fluid className="py-5">
      <Container>
        <Row className="mb-4">
          <Col>
            <h1 className="text-center mb-4">Resources</h1>
            <p className="lead text-center">
              Access study materials, practice questions, and useful links to help 
              you prepare for competitions.
            </p>
          </Col>
        </Row>

        <Row>
          <Col lg={8} className="mx-auto">
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

        <Footer />
      </Container>
    </Container>
  );
};

export default Resources;