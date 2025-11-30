import React from "react";
import { Outlet } from "react-router-dom";
import DashboardLayout from "../../../components/Dashboard/layout/DashboardLayout";
import { studentLayoutConfig } from "../config/studentLayoutConfig";

const StudentLayout = () => {
  return (
    <DashboardLayout config={studentLayoutConfig}>
      <Outlet />
    </DashboardLayout>
  );
};

export default StudentLayout;
