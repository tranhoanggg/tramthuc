import React, { Suspense } from "react";
import AdminDashboardPage from "@/components/pages/AdminDashboard/AdminDashboard";

export const metadata = {
  title: "Dashboard | Trạm Thức Admin",
  description: "Trang thống kê quản trị Trạm Thức",
};

export default function DashboardRoute() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: "center", padding: "100px" }}>
          Đang tải trang quản trị...
        </div>
      }
    >
      <AdminDashboardPage />
    </Suspense>
  );
}
