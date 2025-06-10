import React from "react";

const Accordion: React.FC = () => {
  const accordionData = [
    {
      title: "Announcements for Tournament Day",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    },
    {
      title: "Announcements for Tournament Teams",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    },
    {
      title: "News",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    },
  ];

  return (
    <div id="accordion1" role="tablist">
      {accordionData.map((item, index) => (
        <div className="card" key={index}>
          <div className="card-header" role="tab" id={`heading${index}`}>
            <h5 className="mb-0">
              <a
                data-toggle="collapse"
                href={`#collapse${index}`}
                role="button"
                aria-expanded={index === 0}
                aria-controls={`collapse${index}`}
              >
                {item.title}
              </a>
            </h5>
          </div>
          <div
            id={`collapse${index}`}
            className={`collapse ${index === 0 ? "show" : ""}`}
            role="tabpanel"
            aria-labelledby={`heading${index}`}
            data-parent="#accordion1"
          >
            <div className="card-body">{item.content}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Accordion;