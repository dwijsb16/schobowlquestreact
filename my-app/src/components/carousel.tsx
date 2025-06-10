import React from "react";

const Carousel: React.FC = () => {
  return (
    <div
      id="carouselExampleIndicators"
      className="carousel slide"
      data-bs-ride="carousel"
    >
      {/* Indicators */}
      <ol className="carousel-indicators">
        <li
          data-bs-target="#carouselExampleIndicators"
          data-bs-slide-to="0"
          className="active"
        ></li>
        <li data-bs-target="#carouselExampleIndicators" data-bs-slide-to="1"></li>
        <li data-bs-target="#carouselExampleIndicators" data-bs-slide-to="2"></li>
      </ol>

      {/* Carousel Items */}
      <div className="carousel-inner">
        <div className="carousel-item active">
          <img
            src="/images/IMG_5824.png"
            className="d-block w-100"
            alt="First slide"
            style={{ maxHeight: "500px", objectFit: "cover" }}
          />
        </div>
        <div className="carousel-item">
          <img
            src="/images/IMG_5825.png"
            className="d-block w-100"
            alt="Second slide"
            style={{ maxHeight: "500px", objectFit: "cover" }}
          />
          <div className="carousel-caption d-none d-md-block">
            <h5>IESA Regional Champions</h5>
            <p>2024</p>
          </div>
        </div>
        <div className="carousel-item">
          <img
            src="/images/IMG_5831.png"
            className="d-block w-100"
            alt="Third slide"
            style={{ maxHeight: "500px", objectFit: "cover" }}
          />
          <div className="carousel-caption d-none d-md-block">
            <h5>IESA Regional Champions</h5>
            <p>2024</p>
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
        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
        <span className="sr-only">Previous</span>
      </a>
      <a
        className="carousel-control-next"
        href="#carouselExampleIndicators"
        role="button"
        data-bs-slide="next"
      >
        <span className="carousel-control-next-icon" aria-hidden="true"></span>
        <span className="sr-only">Next</span>
      </a>
    </div>
  );
};

export default Carousel;