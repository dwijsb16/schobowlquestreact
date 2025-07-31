import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../.firebase/utils/firebase";
import Navbar from "../components/Navbar";
import Carousel from "../components/carousel";
import Cards from "../components/cards";
import Accordion from "../components/accordion";
import Footer from "../components/footer";

const Home: React.FC = () => {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User is signed in with UID:", user.uid);
      } else {
        console.log("User is logged out");
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      <Navbar />
      <Accordion />
      <Cards />
      <Carousel />      
      <Footer />
    </div>
  );
};

export default Home;
