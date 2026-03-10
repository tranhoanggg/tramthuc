"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./NavbarPC.module.css";

import logo from "../../../assets/images/logo.png";

const NavbarPC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Cà phê");

  const [selectedCity, setSelectedCity] = useState("TP. HCM");
  const [isCityOpen, setIsCityOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const categories = ["Cà phê", "Trà", "Đồ ăn vặt", "Quà tặng"];
  const cities = ["TP. HCM", "Hà Nội", "Đà Nẵng", "Huế", "Hải Phòng"];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsCityOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

          <button className={styles["login-btn"]}>Đăng nhập</button>
        </div>
      </div>
    </nav>
  );
};

export default NavbarPC;
