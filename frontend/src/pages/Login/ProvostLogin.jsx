import React, { useState } from "react";
import LoginComp from "../../components/LoginComp/LoginComp";
import Navbar from "../../components/Navbar/Navbar";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { authService } from "../../services/api/authService";
import Footer from "../../components/Footer/Footer";

const ProvostLogin = () => {
  const navigate = useNavigate(); // Initialize useNavigate
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (credentials) => {
    setIsLoading(true);
    const toastId = toast.loading("Logging in...");
    try {
      const response = await authService.loginProvost(credentials);
      console.log("Provost Login API Response:", response);

      // Store token and user info in localStorage
      localStorage.setItem("token", response.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          role: response.role,
          email: credentials.email,
          name: response.user?.name,
        })
      );

      toast.success(response.message || "Login successful!");
      navigate("/provost-login");
    } catch (error) {
      console.error("Provost Login Error:", error);
      toast.error(
        error.message ||
          error?.payload?.message ||
          "An error occurred during login. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
    toast.dismiss(toastId);
  };
  return (
    <>
      <Navbar />
      <LoginComp
        onSubmit={handleSubmit}
        isLoading={isLoading}
        heading="Provost workspace"
        accentTitle="Operational oversight"
        description="Authorize entries, monitor activity logs, and make informed hostel decisions without leaving the dashboard."
      />
      <Footer />
    </>
  );
};

export default ProvostLogin;
