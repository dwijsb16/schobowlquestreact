import React from "react";
import Navbar from "../components/Navbar";
import SendMessage from "../components/SendMessage";
import Footer from "../components/footer";

const SendMessagePage: React.FC = () => {
  return (
    <div style={{ paddingTop: "90px" }}>
      <Navbar />
      <SendMessage />
      <Footer />
    </div>
  );
};

export default SendMessagePage;