"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import styles from "./NavbarPC.module.css";
import { useAuth } from "@/context/AuthContext"; // IMPORT AUTH CONTEXT

import logo from "../../../assets/images/logo.png";

const NavbarPC = () => {
  const router = useRouter();
  const pathname = usePathname();

  // Gọi Global State từ AuthContext
  const { user, isAuthenticated, logoutContext } = useAuth();

  const [activeTab, setActiveTab] = useState("");

  const [selectedCity, setSelectedCity] = useState("TP. HCM");
  const [isCityOpen, setIsCityOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Thêm State và Ref cho Dropdown của User Profile
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const categories = ["Cà phê", "Trà", "Đồ ăn vặt", "Quà tặng"];
  const cities = ["TP. HCM", "Hà Nội", "Đà Nẵng", "Huế", "Hải Phòng"];

  useEffect(() => {
    if (pathname.includes("/category/")) {
      const currentCategory = pathname.split("/").pop();
      if (currentCategory) {
        setActiveTab(decodeURIComponent(currentCategory));
      }
    } else {
      setActiveTab("");
    }
  }, [pathname]);

  // Cập nhật sự kiện click ra ngoài để đóng cả 2 menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Đóng menu chọn tỉnh thành
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsCityOpen(false);
      }
      // Đóng menu User Profile
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Logic cắt chữ cái đầu để làm Avatar mặc định
  const getInitials = (name: string) => {
    if (!name) return "U";
    const words = name.trim().split(" ");
    return words[words.length - 1].charAt(0).toUpperCase();
  };

  return (
    <nav className={styles["navbar"]}>
      <div className={styles["navbar-container"]}>
        <div className={styles["navbar-left"]}>
          <Image
            src={logo}
            alt="Trạm Thức"
            height={45}
            className={styles["navbar-logo"]}
            onClick={() => router.push("/")}
          />

          <div className={styles["location-selector"]} ref={dropdownRef}>
            <div
              className={styles["location-current"]}
              onClick={() => setIsCityOpen(!isCityOpen)}
            >
              <span>{selectedCity}</span>
              <svg
                className={`${styles["dropdown-icon"]} ${isCityOpen ? styles["open"] : ""}`}
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06z"></path>
              </svg>
            </div>

            {isCityOpen && (
              <ul className={styles["location-dropdown-list"]}>
                {cities.map((city) => (
                  <li
                    key={city}
                    className={`${styles["location-item"]} ${selectedCity === city ? styles["selected"] : ""}`}
                    onClick={() => {
                      setSelectedCity(city);
                      setIsCityOpen(false);
                    }}
                  >
                    {city}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <ul className={styles["navbar-menu"]}>
          {categories.map((category) => (
            <li
              key={category}
              className={`${styles["nav-item"]} ${activeTab === category ? styles["active"] : ""}`}
              onClick={() => {
                setActiveTab(category);
                router.push(`/category/${category}`);
              }}
            >
              {category}
            </li>
          ))}
        </ul>

        <div className={styles["navbar-right"]}>
          <div className={styles["search-icon-wrapper"]}>
            <svg
              className={styles["search-icon"]}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>

          {/* HIỂN THỊ CÓ ĐIỀU KIỆN (CONDITIONAL RENDERING) */}
          {!isAuthenticated ? (
            <button
              className={styles["login-btn"]}
              onClick={() => {
                router.push(`/login`);
              }}
            >
              Đăng nhập
            </button>
          ) : (
            <div className={styles["user-profile-wrapper"]} ref={userMenuRef}>
              <div
                className={styles["user-profile-trigger"]}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                {/* Render Avatar hoặc Chữ cái */}
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Avatar"
                    className={styles["user-avatar-img"]}
                  />
                ) : (
                  <div className={styles["user-avatar-fallback"]}>
                    {getInitials(user?.fullName || "")}
                  </div>
                )}

                <span className={styles["user-name"]}>{user?.fullName}</span>

                <svg
                  className={`${styles["dropdown-icon"]} ${isUserMenuOpen ? styles["open"] : ""}`}
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06z"></path>
                </svg>
              </div>

              {/* Menu Dropdown */}
              {isUserMenuOpen && (
                <div className={styles["user-dropdown-menu"]}>
                  <div className={styles["user-dropdown-header"]}>
                    <h4>{user?.fullName}</h4>
                    <p>{user?.email || user?.phoneNumber}</p>
                  </div>

                  <button
                    onClick={() => {
                      router.push("/profile");
                      setIsUserMenuOpen(false);
                    }}
                    className={styles["user-dropdown-item"]}
                  >
                    Thông tin tài khoản
                  </button>
                  <button
                    onClick={() => {
                      router.push("/orders");
                      setIsUserMenuOpen(false);
                    }}
                    className={styles["user-dropdown-item"]}
                  >
                    Đơn hàng của tôi
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logoutContext();
                    }}
                    className={`${styles["user-dropdown-item"]} ${styles["logout"]}`}
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavbarPC;
