import React from "react";

const Carousel: React.FC = () => {
  return (
    <div>
      <div
        id="carouselExampleIndicators"
        className="carousel slide"
        data-bs-ride="carousel"
      >
        {/* Carousel Items */}
        <div className="carousel-inner">
          <div className="carousel-item active">
            <img
              src="/images/IMG_8142.png"
              className="d-block w-100"
              alt="First slide"
              style={{ maxHeight: "500px", objectFit: "contain" }}
            />
            <div className="carousel-caption d-none d-md-block">
              <h5>MSNCT 21st Place</h5>
              <p>2025</p>
            </div>
          </div>
          <div className="carousel-item">
            <img
              src="/images/IMG_8533.png"
              className="d-block w-100"
              alt="Second slide"
              style={{ maxHeight: "500px", objectFit: "contain" }}
            />
            <div className="carousel-caption d-none d-md-block">
              <h5>IESA Class 1A State Champions</h5>
              <p>2025</p>
            </div>
          </div>
          <div className="carousel-item">
            <img
              src="/images/imageweuse1.png"
              className="d-block w-100"
              alt="Third slide"
              style={{ maxHeight: "500px", objectFit: "contain" }}
            />
            <div className="carousel-caption d-none d-md-block">
              <h5>NAC Middle School National Champions</h5>
              <p>2025</p>
            </div>
          </div>
          <div className="carousel-item">
            <img
              src="/images/IMG_8134.jpeg"
              className="d-block w-100"
              alt="Fourth slide"
              style={{ maxHeight: "500px", objectFit: "contain" }}
            />
            <div className="carousel-caption d-none d-md-block">
              <h5>MSNCT 20th Place</h5>
              <p>2025</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <a
          className="carousel-control-prev"
          href="#carouselExampleIndicators"
          role="button"
          data-bs-slide="prev"
        >
          <span
            aria-hidden="true"
            style={{ display: "inline-block", width: 32, height: 32 }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32">
              <polyline points="20,8 12,16 20,24"
                fill="none"
                stroke="black"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="sr-only">Previous</span>
        </a>
        <a
          className="carousel-control-next"
          href="#carouselExampleIndicators"
          role="button"
          data-bs-slide="next"
        >
          <span
            aria-hidden="true"
            style={{ display: "inline-block", width: 32, height: 32 }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32">
              <polyline points="12,8 20,16 12,24"
                fill="none"
                stroke="black"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="sr-only">Next</span>
        </a>
      </div>
    </div>
  );
};

export default Carousel;
