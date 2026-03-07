"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./NavbarMobile.module.css";

const NavbarMobile = () => {
  const [activeTab, setActiveTab] = useState("home");
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (navRef.current) {
      const height = navRef.current.offsetHeight;
      document.documentElement.style.setProperty(
        "--nav-mobile-height",
        `${height}px`,
      );
    }
  }, []);

  return (
    <div className={styles["bottom-nav"]} ref={navRef}>
      {/* Tab: Trang chủ */}
      <div
        className={`${styles["nav-item"]} ${activeTab === "home" ? styles["active"] : ""}`}
        onClick={() => setActiveTab("home")}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span>Trang chủ</span>
      </div>

      {/* Tab: Đơn hàng */}
      <div
        className={`${styles["nav-item"]} ${activeTab === "orders" ? styles["active"] : ""}`}
        onClick={() => setActiveTab("orders")}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span>Đơn hàng</span>
      </div>

      {/* Tab: Đã thích */}
      <div
        className={`${styles["nav-item"]} ${activeTab === "likes" ? styles["active"] : ""}`}
        onClick={() => setActiveTab("likes")}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        <span>Đã thích</span>
      </div>

      {/* Tab: Thông báo */}
      <div
        className={`${styles["nav-item"]} ${activeTab === "notifications" ? styles["active"] : ""}`}
        onClick={() => setActiveTab("notifications")}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        <span>Thông báo</span>
      </div>

      {/* Tab: Tôi */}
      <div
        className={`${styles["nav-item"]} ${activeTab === "profile" ? styles["active"] : ""}`}
        onClick={() => setActiveTab("profile")}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span>Tôi</span>
      </div>
    </div>
  );
};

export default NavbarMobile;
