import React, { Suspense } from "react";
import CategoryPageUI from "@/components/pages/CategoryPage/CategoryPage";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            textAlign: "center",
            padding: "100px",
            color: "#888",
            fontSize: "16px",
          }}
        >
          Đang tìm kiếm...
        </div>
      }
    >
      <CategoryPageUI />
    </Suspense>
  );
}
