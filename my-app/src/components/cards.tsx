import React from "react";

const Cards: React.FC = () => {
  const cardData = [
    {
      title: "Date:",
      text: "IESA Tournament at Highland Park Middle school",
      link: "/tournament",
    },
    {
      title: "Date",
      text: "NAQT Tournament at Northwestern University",
      link: "tournament-detail.html",
    },
    {
      title: "Date",
      text: "IESA Tournament at Barrington Middle School Station Campus",
      link: "tournament-detail.html",
    },
  ];

  return (
    <div className="row">
      {cardData.map((card, index) => (
        <div className="col-xl-4" key={index}>
          <div className="card col-md-4 col-xl-12">
            <img
              src="/images/tournament-logo-860-16353.png"
              alt=""
              width="800"
              height="281"
              className="img-fluid"
            />
            <div className="card-body">
              <h5 className="card-title">{card.title}</h5>
              <p className="card-text">{card.text}</p>
              <a href={card.link} className="btn btn-primary">
                Details
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Cards;