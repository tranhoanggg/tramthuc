"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import "./CategoryPage.css";

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

export default function CategoryPageUI() {
  const params = useParams();
  const rawCategory = params?.categoryName as string;
  const decodedCategory = rawCategory ? decodeURIComponent(rawCategory) : "";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // State cho Thanh Tìm kiếm và Dropdown Sắp xếp
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest");

  // Hàm Format tiền tệ
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  };

  // Tự động gọi lại API mỗi khi Danh mục, Từ khóa tìm kiếm hoặc Lựa chọn sắp xếp thay đổi
  useEffect(() => {
    if (!rawCategory) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000";

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

  // Xử lý sự kiện bấm phím Enter khi tìm kiếm
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setSearchQuery(searchInput);
    }
  };

  return (
    <div className="category-page-wrapper">
      <div className="category-container">
        {/* KHU VỰC HEADER: Tiêu đề & Bộ lọc */}
        <div className="category-header">
          <h1 className="category-title">{decodedCategory}</h1>

          <div className="category-controls">
            {/* Thanh Tìm Kiếm */}
            <div className="search-box">
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

            {/* Dropdown Sắp Xếp */}
            <select
              className="sort-dropdown"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="newest">✨ Mới nhất</option>
              <option value="best_selling">🔥 Bán chạy nhất</option>
              <option value="price_asc">💵 Giá: Thấp đến Cao</option>
              <option value="price_desc">💎 Giá: Cao đến Thấp</option>
            </select>
          </div>
        </div>

        {/* KHU VỰC HIỂN THỊ SẢN PHẨM */}
        {loading ? (
          <div className="loading-state">Đang tải thực đơn...</div>
        ) : products.length === 0 ? (
          <div className="empty-state">
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
          <div className="category-grid">
            {products.map((product) => (
              <div key={product.id} className="cat-product-card">
                {/* Ảnh sản phẩm (Vuông) */}
                <div className="cat-image-wrapper">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="cat-image"
                  />
                  {product.original_price &&
                    product.original_price > product.price && (
                      <span className="cat-discount">
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

                {/* Thông tin chữ */}
                <div className="cat-info">
                  <h3 className="cat-name" title={product.name}>
                    {product.name}
                  </h3>
                  <p className="cat-sold">Đã bán {product.sold_count}</p>

                  {/* Hàng dưới cùng: Giá và Nút mua */}
                  <div className="cat-price-row">
                    <div className="cat-price-group">
                      <span className="cat-current-price">
                        {formatPrice(product.price)}
                      </span>
                      {product.original_price && (
                        <span className="cat-original-price">
                          {formatPrice(product.original_price)}
                        </span>
                      )}
                    </div>

                    {/* Nút thêm vào giỏ hàng dạng Icon */}
                    <button className="cat-add-btn" title="Thêm vào giỏ">
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
