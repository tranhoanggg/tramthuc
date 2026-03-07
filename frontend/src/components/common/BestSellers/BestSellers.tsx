"use client";

import React, { useEffect, useState } from "react";
import "./BestSellers.css";

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  };

  if (loading) return <div className="loading-text">Đang tải món ngon...</div>;

  return (
    <div className="bestsellers-container">
      <div className="bestsellers-header">
        <h2>Bán chạy nhất</h2>
        <a href="#" className="view-all">
          <span>Xem tất cả</span>
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
        </a>
      </div>

      <div className="bestsellers-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <div className="product-image-wrapper">
              <img
                src={product.image_url}
                alt={product.name}
                className="product-image"
              />
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

            <div className="product-info">
              <div className="info-top">
                <h3 className="product-name" title={product.name}>
                  {product.name}
                </h3>
                <p className="product-desc" title={product.description}>
                  {product.description}
                </p>
                <div className="product-stats">
                  <span className="sold-count">
                    Đã bán {product.sold_count}
                  </span>
                </div>
              </div>

              <div className="info-bottom">
                <div className="price-group">
                  {product.original_price && (
                    <span className="original-price">
                      {formatPrice(product.original_price)}
                    </span>
                  )}
                  <span className="current-price">
                    {formatPrice(product.price)}
                  </span>
                </div>

                <div className="action-buttons">
                  <div className="add-cart-btn" title="Thêm vào giỏ">
                    <button className="btn-text">Thêm vào giỏ</button>
                    <svg
                      className="btn-icon"
                      width="18"
                      height="18"
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
                      <line x1="12" y1="10" x2="16" y2="10"></line>
                      <line x1="14" y1="8" x2="14" y2="12"></line>
                    </svg>
                  </div>

                  <div className="buy-now-btn" title="Mua ngay">
                    <button className="btn-text">Mua ngay</button>
                    <svg
                      className="btn-icon"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BestSellers;
