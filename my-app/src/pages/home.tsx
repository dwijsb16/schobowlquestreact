// home.tsx
import React from "react";
import Navbar from "../components/Navbar"
import Carousel from "../components/carousel";
import Cards from "../components/cards";
import Accordion from "../components/accordion";
import Footer from "../components/footer";

const Home: React.FC = () => {
    return (
    <div style={{ paddingTop: "70px" }}>
      <Navbar />
      <Carousel />
      <Cards />
      <Accordion />
      <Footer />
    </div>
  );
};

export default Home;