"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import "./Navbar.css";

import logo from "../../../assets/images/logo.png";

const Navbar = () => {
  const [activeTab, setActiveTab] = useState("Cà phê");

  const [selectedCity, setSelectedCity] = useState("TP. HCM");
  const [isCityOpen, setIsCityOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const categories = ["Cà phê", "Trà", "Đồ ăn vặt", "Quà tặng"];
  const cities = ["TP. HCM", " Hà Nội", "Đà Nẵng", "Huế", "Hải Phòng"];

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
  });

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <Image
            src={logo}
            alt="Trạm Thức"
            height={45}
            className="navbar-logo"
          />

          <div className="location-selector" ref={dropdownRef}>
            <div
              className="location-current"
              onClick={() => setIsCityOpen(!isCityOpen)}
            >
              <span>{selectedCity}</span>
              <svg
                className={`dropdown-icon ${isCityOpen ? "open" : ""}`}
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06z"></path>
              </svg>
            </div>

            {isCityOpen && (
              <ul className="location-dropdown-list">
                {cities.map((city) => (
                  <li
                    key={city}
                    className={`location-item ${selectedCity === city ? "selected" : ""}`}
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

        <ul className="navbar-menu">
          {categories.map((category) => (
            <li
              key={category}
              className={`nav-item ${activeTab === category ? "active" : ""}`}
              onClick={() => setActiveTab(category)}
            >
              {category}
            </li>
          ))}
        </ul>

        <div className="navbar-right">
          <div className="search-icon-wrapper">
            <svg
              className="search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>

          <button className="login-btn">Đăng nhập</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
