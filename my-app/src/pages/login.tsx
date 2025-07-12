import React from "react";
import Navbar from "../components/Navbar"
import LoginForm from "../components/LoginForm";
import Footer from "../components/footer";

const login: React.FC = () => {
  return (
    <div>
      <Navbar />
      <div className="container">
        <LoginForm />
      </div>
      <Footer />
    </div>
  );
};

export default login;