import React, { useState } from "react";
import LoginComp from "../../components/LoginComp/LoginComp";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

const OtherLogin = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = () => {
    setIsLoading(true);
    // Add a small delay to show the loading state before redirect
    setTimeout(() => {
      window.location.href = "/other-login";
    }, 500);
  };
  return (
    <>
      <Navbar />
      <LoginComp
        onSubmit={handleSubmit}
        isLoading={isLoading}
        heading="Team member access"
        accentTitle="HMS Staff Portal"
        description="Facility managers, security teams, and support staff can collaborate, log updates, and stay informed."
      />
      <Footer />
    </>
  );
};

export default OtherLogin;
