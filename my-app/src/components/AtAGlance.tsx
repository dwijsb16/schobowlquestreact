import React from "react";

const AtAGlance: React.FC = () => {
  return (
    <div className="col-md-4">
      <div className="card mt-3">
        <div className="card-header">At a Glance</div>
        <ul className="list-group list-group-flush">
          <li className="list-group-item">
            <a href="tournament-detail.html" className="text-decoration-none">
              1/1: Tournament 1
            </a>
          </li>
          <li className="list-group-item">
            <a href="tournament-detail.html" className="text-decoration-none">
              2/2: Tournament 2
            </a>
          </li>
          <li className="list-group-item">
            <a href="tournament-detail.html" className="text-decoration-none">
              3/3: Tournament 3
            </a>
          </li>
          <li className="list-group-item">
            <a href="tournament-detail.html" className="text-decoration-none">
              4/4: Tournament 4
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AtAGlance;