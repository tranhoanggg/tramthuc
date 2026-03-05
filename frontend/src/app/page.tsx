import React from "react";
import "./page.css";
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
    <main className="home-wrapper">
      {/* Lớp nền tối phía sau */}
      <div className="home-background"></div>

      <div className="home-container">
        {/* CỘT TRÁI: Đứng im (Sticky) */}
        <div className="left-column">
          <h1 className="left-title">Đặt món nhanh gọn, chọn lựa thoả thích</h1>
          <p className="left-subtitle">Sẵn sàng phục vụ từ 7:00 - 22:00</p>

          <div className="search-box">
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

          <div className="category-tags">
            {quickCategories.map((cat, index) => (
              <span
                key={index}
                className={`tag ${index === 0 ? "active" : ""}`}
              >
                {cat}
              </span>
            ))}
          </div>
        </div>

        {/* CỘT PHẢI: Cuộn được (Scrollable) */}
        <div className="right-column">
          {/* Ô chọn địa chỉ giao hàng */}
          <div className="address-delivery">
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
