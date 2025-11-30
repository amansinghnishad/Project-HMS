import React, { useEffect, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import DashboardLayout from "../../../components/dashboard/layout/DashboardLayout";
import { provostLayoutConfig } from "../config/provostLayoutConfig";

const ProvostLayout = () => {
  const [welcomeLabel, setWelcomeLabel] = useState(
    provostLayoutConfig.welcomeLabel || "Welcome"
  );

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      const name = parsedUser?.name || parsedUser?.fullName || "";
      if (name) {
        setWelcomeLabel(`Welcome, ${name}`);
      }
    } catch (error) {
      console.warn("Unable to parse stored user", error);
    }
  }, []);

  const layoutConfig = useMemo(
    () => ({ ...provostLayoutConfig, welcomeLabel }),
    [welcomeLabel]
  );

  return (
    <DashboardLayout config={layoutConfig}>
      <Outlet />
    </DashboardLayout>
  );
};

export default ProvostLayout;
