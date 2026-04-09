"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import styles from "./NavbarPC.module.css";
import { useAuth } from "@/context/AuthContext";
import { useCartStore } from "@/store/useCartStore";

import logo from "../../../assets/images/logo.png";

const NavbarPC = () => {
  const router = useRouter();
  const pathname = usePathname();

  // Gọi Global State từ AuthContext
  const { user, isAuthenticated, isLoadingAuth, logoutContext } = useAuth();
  const cart = useCartStore((state) => state.cart);
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  const [activeTab, setActiveTab] = useState("");

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const categories = ["Cà phê", "Trà", "Đồ ăn vặt", "Quà tặng"];

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

  useEffect(() => {
    if (isSearchModalOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchModalOpen]);

  // Đóng Search Modal khi ấn phím Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSearchModal();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // Logic cắt chữ cái đầu để làm Avatar mặc định
  const getInitials = (name: string) => {
    if (!name) return "U";
    const words = name.trim().split(" ");
    return words[words.length - 1].charAt(0).toUpperCase();
  };

  const closeSearchModal = () => {
    setIsSearchModalOpen(false);
    setSearchInput("");
    setSearchError("");
  };

  const handleSearchSubmit = async () => {
    const keyword = searchInput.trim();
    if (!keyword) return;

    setIsSearching(true);
    setSearchError("");

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://tramthuc-backend.onrender.com";
      const res = await fetch(
        `${apiUrl}/api/products?search=${encodeURIComponent(keyword)}`,
      );
      const data = await res.json();

      if (data && data.length > 0) {
        // Có kết quả -> Đóng modal và chuyển trang
        closeSearchModal();
        router.push(`/search?q=${encodeURIComponent(keyword)}`);
      } else {
        // Không có kết quả -> Báo lỗi tại chỗ
        setSearchError(
          `Xin lỗi, không tìm thấy món nào mang tên "${keyword}"!`,
        );
      }
    } catch (error) {
      setSearchError("Lỗi kết nối máy chủ. Vui lòng thử lại sau!");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <>
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
            <div
              className={styles["search-icon-wrapper"]}
              onClick={() => setIsSearchModalOpen(true)}
            >
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

            <div
              className={styles["cart-icon-wrapper"]}
              onClick={() => router.push("/cart")}
            >
              <svg
                className={styles["cart-icon"]}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>

              {/* Nếu có đồ trong giỏ thì mới hiện bóng đỏ */}
              {totalItems > 0 && (
                <span className={styles["cart-badge"]}>{totalItems}</span>
              )}
            </div>

            {isLoadingAuth ? (
              // TRẠNG THÁI ĐANG KIỂM TRA TOKEN: Hiện nút đăng nhập nhưng bị disabled
              <button
                className={`${styles["login-btn"]} ${styles["loading"]}`}
                disabled
              >
                Đang xác thực...
              </button>
            ) : !isAuthenticated ? (
              // TRẠNG THÁI CHƯA ĐĂNG NHẬP
              <button
                className={styles["login-btn"]}
                onClick={() => router.push(`/login`)}
              >
                Đăng nhập
              </button>
            ) : (
              // TRẠNG THÁI ĐÃ ĐĂNG NHẬP: Hiện Profile
              <div className={styles["user-profile-wrapper"]} ref={userMenuRef}>
                {/* ... (Phần User Profile Trigger và Dropdown giữ nguyên như cũ) ... */}
                <div
                  className={styles["user-profile-trigger"]}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
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
                        router.push("/password/change");
                        setIsUserMenuOpen(false);
                      }}
                      className={styles["user-dropdown-item"]}
                    >
                      Đổi mật khẩu
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

      {isSearchModalOpen && (
        <div
          className={styles["search-modal-overlay"]}
          onMouseDown={closeSearchModal}
        >
          {/* onMouseDown bên trong nội dung phải gọi e.stopPropagation() để không bị đóng modal khi click vào ô input */}
          <div
            className={styles["search-modal-content"]}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className={styles["search-input-wrapper"]}>
              <svg
                className={styles["search-input-icon"]}
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                className={styles["search-input"]}
                placeholder="Bạn muốn uống gì hôm nay?"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setSearchError(""); // Ẩn lỗi đi khi người dùng bắt đầu gõ lại
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                disabled={isSearching}
              />
              <button
                className={styles["search-close-btn"]}
                onClick={closeSearchModal}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {isSearching && (
              <div
                className={styles["search-status-text"]}
                style={{ color: "#c17a54" }}
              >
                Đang tìm kiếm...
              </div>
            )}
            {searchError && (
              <div className={styles["search-status-text"]}>{searchError}</div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default NavbarPC;
