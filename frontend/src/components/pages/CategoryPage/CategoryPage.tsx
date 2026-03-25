"use client";

import React, { useEffect, useState, useRef } from "react";
// Import useRouter để làm nút Back
import { useParams, useRouter } from "next/navigation";
import styles from "./CategoryPage.module.css";

// Định nghĩa kiểu dữ liệu Product
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  image_url: string;
  category: string;
  sold_count: number;
}

// Danh sách các tùy chọn sắp xếp
const sortOptions = [
  { value: "newest", label: "Mới nhất" },
  { value: "best_selling", label: "Bán chạy nhất" },
  { value: "price_asc", label: "Giá: Thấp đến Cao" },
  { value: "price_desc", label: "Giá: Cao đến Thấp" },
];

export default function CategoryPageUI() {
  const router = useRouter();
  const params = useParams();
  const rawCategory = params?.categoryName as string;
  const decodedCategory = rawCategory ? decodeURIComponent(rawCategory) : "";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // State cho Thanh Tìm kiếm và Dropdown Sắp xếp
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest");

  // State quản lý Custom Dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Lấy text hiển thị cho Dropdown
  const selectedSortLabel = sortOptions.find(
    (opt) => opt.value === sortOption,
  )?.label;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  };

  // Tắt dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Gọi API
  useEffect(() => {
    if (!rawCategory) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          "https://tramthuc-backend.onrender.com";
        const res = await fetch(
          `${apiUrl}/api/products/category/${rawCategory}?search=${searchQuery}&sort=${sortOption}`,
        );
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Lỗi fetch category:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [rawCategory, searchQuery, sortOption]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setSearchQuery(searchInput);
    }
  };

  return (
    <div className={styles["category-page-wrapper"]}>
      <div className={styles["category-container"]}>
        {/* KHU VỰC HEADER: Tiêu đề & Bộ lọc */}
        <div className={styles["category-header"]}>
          {/* Cụm Tiêu đề + Nút Back (Chỉ hiện trên Mobile) */}
          <div className={styles["title-wrapper"]}>
            <button
              className={styles["back-btn"]}
              onClick={() => router.back()}
              title="Quay lại"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
            <h1 className={styles["category-title"]}>{decodedCategory}</h1>
          </div>

          <div className={styles["category-controls"]}>
            {/* Thanh Tìm Kiếm */}
            <div className={styles["search-box"]}>
              <input
                type="text"
                placeholder={`Tìm trong ${decodedCategory}...`}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                onClick={() => setSearchQuery(searchInput)}
                title="Tìm kiếm"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            </div>

            {/* Custom Dropdown Sắp Xếp */}
            <div className={styles["custom-dropdown"]} ref={dropdownRef}>
              <div
                className={styles["dropdown-selected"]}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span>{selectedSortLabel}</span>
                <svg
                  className={`${styles["dropdown-arrow"]} ${isDropdownOpen ? styles["open"] : ""}`}
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>

              {isDropdownOpen && (
                <ul className={styles["dropdown-list"]}>
                  {sortOptions.map((opt) => (
                    <li
                      key={opt.value}
                      className={`${styles["dropdown-item"]} ${sortOption === opt.value ? styles["active"] : ""}`}
                      onClick={() => {
                        setSortOption(opt.value);
                        setIsDropdownOpen(false);
                      }}
                    >
                      {opt.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* KHU VỰC HIỂN THỊ SẢN PHẨM */}
        {loading ? (
          <div className={styles["loading-state"]}>Đang tải thực đơn...</div>
        ) : products.length === 0 ? (
          <div className={styles["empty-state"]}>
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ccc"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="8" y1="15" x2="16" y2="15"></line>
              <line x1="9" y1="9" x2="9.01" y2="9"></line>
              <line x1="15" y1="9" x2="15.01" y2="9"></line>
            </svg>
            <p>Không tìm thấy món nào phù hợp!</p>
          </div>
        ) : (
          <div className={styles["category-grid"]}>
            {products.map((product) => (
              <div key={product.id} className={styles["cat-product-card"]}>
                <div className={styles["cat-image-wrapper"]}>
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className={styles["cat-image"]}
                  />
                  {product.original_price &&
                    product.original_price > product.price && (
                      <span className={styles["cat-discount"]}>
                        -
                        {Math.round(
                          ((product.original_price - product.price) /
                            product.original_price) *
                            100,
                        )}
                        %
                      </span>
                    )}
                </div>

                <div className={styles["cat-info"]}>
                  <h3 className={styles["cat-name"]} title={product.name}>
                    {product.name}
                  </h3>
                  <p className={styles["cat-sold"]}>
                    Đã bán {product.sold_count}
                  </p>

                  <div className={styles["cat-price-row"]}>
                    <div className={styles["cat-price-group"]}>
                      {product.original_price && (
                        <span className={styles["cat-original-price"]}>
                          {formatPrice(product.original_price)}
                        </span>
                      )}
                      <span className={styles["cat-current-price"]}>
                        {formatPrice(product.price)}
                      </span>
                    </div>

                    <div className={styles["cat-action-buttons"]}>
                      <button
                        className={styles["cat-add-btn"]}
                        title="Thêm vào giỏ"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="9" cy="21" r="1"></circle>
                          <circle cx="20" cy="21" r="1"></circle>
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                          <line x1="12" y1="10" x2="16" y2="10"></line>
                          <line x1="14" y1="8" x2="14" y2="12"></line>
                        </svg>
                      </button>

                      {/* Nút Mua ngay: Gắn cả Chữ và Icon để CSS xử lý */}
                      <button
                        className={styles["cat-buy-now-btn"]}
                        title="Mua ngay"
                      >
                        <span className={styles["btn-text"]}>Mua ngay</span>
                        <svg
                          className={styles["btn-icon"]}
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                          <line x1="3" y1="6" x2="21" y2="6"></line>
                          <path d="M16 10a4 4 0 0 1-8 0"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
