import React from "react";
import Navbar from "../components/Navbar"
import LoginForm from "../components/LoginForm";
import Footer from "../components/footer";

const login: React.FC = () => {
  return (
    <div style={{ paddingTop: "70px" }}>
      <Navbar />
      <br />
      <div className="container">
        <div className="row">
          <div className="col-xl-4"></div>
          <div className="col-xl-4">
            <img
              src="/images/safety-login-page-3d-illustration-free-png.png"
              alt="Login Illustration"
              width="1920"
              height="1920"
              className="img-fluid"
            />
          </div>
          <div className="col-xl-4"></div>
        </div>
        <br />
        <LoginForm />
      </div>
      <br />
      <Footer />
    </div>
  );
};

export default login;