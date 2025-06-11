import React, { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../.firebase/utils/firebase";
import Navbar from "../components/Navbar";
import Carousel from "../components/carousel";
import Cards from "../components/cards";
import Accordion from "../components/accordion";
import Footer from "../components/footer";

const Home: React.FC = () => {
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        const uid = user.uid;
        console.log("User is signed in with UID:", uid);
      } else {
        // User is signed out
        console.log("User is logged out");
      }
    });
  }, []);

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