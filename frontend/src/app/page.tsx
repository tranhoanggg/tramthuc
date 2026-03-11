import React from "react";
import styles from "./page.module.css";
import CollectionGrid from "../components/common/CollectionGrid/CollectionGrid";
import BestSellers from "../components/common/BestSellers/BestSellers";
import BackToTop from "../components/common/BackToTop/BackToTop";

export default function Home() {
  const quickCategories = [
    "All",
    "Cà phê",
    "Trà",
    "Đồ ăn vặt",
    "Quà tặng",
    "Bánh ngọt",
    "Combo",
  ];

  return (
    <main className={styles["home-wrapper"]}>
      {/* Lớp nền tối phía sau */}
      <div className={styles["home-background"]}></div>

      <div className={styles["home-container"]}>
        {/* CỘT TRÁI: Đứng im (Sticky) */}
        <div className={styles["left-column"]}>
          <h1 className={styles["left-title"]}>
            Đặt món nhanh gọn, chọn lựa thoả thích
          </h1>
          <p className={styles["left-subtitle"]}>
            Sẵn sàng phục vụ từ 7:00 - 22:00
          </p>

          <div className={styles["search-box"]}>
            <input type="text" placeholder="Tìm đồ uống, món ăn nhẹ..." />
            <button>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </div>

          <div className={styles["category-tags"]}>
            {quickCategories.map((cat, index) => (
              <span
                key={index}
                className={`${styles["tag"]} ${index === 0 ? styles["active"] : ""}`}
              >
                {cat}
              </span>
            ))}
          </div>
        </div>

        {/* CỘT PHẢI: Cuộn được (Scrollable) */}
        <div className={styles["right-column"]}>
          {/* Ô chọn địa chỉ giao hàng */}
          <div className={styles["address-delivery"]}>
            <span>Chọn địa chỉ giao hàng</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>

          {/* Component Lưới Bộ Sưu Tập (Lấy dữ liệu từ Render) */}
          <CollectionGrid />

          <BestSellers />
        </div>
      </div>

      {/* Component Nút Cuộn Lên Đầu Trang */}
      <BackToTop />
    </main>
  );
}
