import React, { useState } from "react";
import LoginComp from "../../components/LoginComp/LoginComp";
import Navbar from "../../components/Navbar/Navbar";
import { apiConnector } from "../../services/apiconnector";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/Footer/Footer";

const StudentLogin = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async ({ email, password }) => {
    setIsLoading(true);
    try {
      const response = await apiConnector("POST", "/auth/login", {
        email,
        password,
      });
      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        navigate("/student-login");
      } else {
        alert(response.data.message || "Login failed.");
      }
    } catch (error) {
      alert(error.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <Navbar />
      <LoginComp
        onSubmit={handleSubmit}
        isLoading={isLoading}
        heading="Student portal"
        accentTitle="HMS Student Experience"
        description="Track room allotments, submit requests, and stay aligned with campus updates in real time."
      />
      <Footer />
    </>
  );
};

export default StudentLogin;
