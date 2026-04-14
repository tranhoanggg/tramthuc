import React, { Suspense } from "react";
import AdminOrdersPage from "@/components/pages/AdminOrdersPage/AdminOrdersPage";

export const metadata = {
  title: "Quản lý Đơn hàng | Trạm Thức Admin",
  description: "Trang quản lý đơn hàng Trạm Thức",
};

export default function OrdersRoute() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: "center", padding: "100px" }}>
          Đang tải danh sách đơn hàng...
        </div>
      }
    >
      <AdminOrdersPage />
    </Suspense>
  );
}
