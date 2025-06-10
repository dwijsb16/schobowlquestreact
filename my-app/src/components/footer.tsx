import React from "react";

const Footer: React.FC = () => {
  return (
    <footer>
      <div className="row">
        <div className="offset-xl-3 col-xl-1">
          <img
            src="/images/quest-Q-logo.png"
            className="img-fluid img-thumbnail"
            alt=""
          />
        </div>
        <div className="col-xl-6">
          Copyright © Quest Academy. All rights reserved. 2023
        </div>
      </div>
    </footer>
  );
};

export default Footer;