import React, { Suspense } from "react";
import AdminProductsPage from "@/components/pages/AdminProductsPage/AdminProductsPage";

export const metadata = {
  title: "Quản lý Sản phẩm | Trạm Thức Admin",
  description: "Cập nhật sản phẩm và kho hàng",
};

export default function ProductsRoute() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: "center", padding: "100px" }}>
          Đang tải danh sách sản phẩm...
        </div>
      }
    >
      <AdminProductsPage />
    </Suspense>
  );
}
