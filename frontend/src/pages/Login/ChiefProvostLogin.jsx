import React, { useState } from "react";
import LoginComp from "../../components/LoginComp/LoginComp";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

const ChiefProvostLogin = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = () => {
    setIsLoading(true);
    // Add a small delay to show the loading state before redirect
    setTimeout(() => {
      window.location.href = "/chief-provost-login";
    }, 500);
  };
  return (
    <>
      <Navbar />
      <LoginComp
        onSubmit={handleSubmit}
        isLoading={isLoading}
        heading="Chief Provost console"
        accentTitle="Leadership access"
        description="Review escalations, approve leave workflows, and keep every hostel in sync from a unified command center."
      />
      <Footer />
    </>
  );
};

export default ChiefProvostLogin;
