"use client";

import React, { useEffect, useState } from "react";
import "./BestSellers.css";

// Định nghĩa kiểu dữ liệu dựa trên bảng products của bạn
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

const BestSellers = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Gọi API thông qua biến môi trường
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000";

    fetch(`${apiUrl}/api/products/best-sellers`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Lỗi fetch best sellers:", err);
        setLoading(false);
      });
  }, []);

  // Hàm tiện ích: Định dạng tiền tệ VNĐ (VD: 45000 -> 45.000đ)
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  };

  if (loading) return <div className="loading-text">Đang tải món ngon...</div>;

  return (
    <div className="bestsellers-container">
      <div className="bestsellers-header">
        <h2>🔥 Bán Chạy Nhất</h2>
        <a href="#" className="view-all">
          Xem tất cả
        </a>
      </div>

      <div className="bestsellers-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            {/* Ảnh sản phẩm */}
            <div className="product-image-wrapper">
              <img
                src={product.image_url}
                alt={product.name}
                className="product-image"
              />
              {/* Badge giảm giá (Nếu có giá gốc) */}
              {product.original_price &&
                product.original_price > product.price && (
                  <span className="discount-badge">
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

            {/* Thông tin sản phẩm */}
            <div className="product-info">
              <h3 className="product-name" title={product.name}>
                {product.name}
              </h3>
              <p className="product-desc" title={product.description}>
                {product.description}
              </p>

              <div className="product-stats">
                <span className="sold-count">Đã bán {product.sold_count}</span>
              </div>

              <div className="product-price-row">
                <div className="price-group">
                  <span className="current-price">
                    {formatPrice(product.price)}
                  </span>
                  {product.original_price && (
                    <span className="original-price">
                      {formatPrice(product.original_price)}
                    </span>
                  )}
                </div>
                {/* Nút thêm vào giỏ hàng (Giao diện) */}
                <button className="add-to-cart-btn">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BestSellers;
