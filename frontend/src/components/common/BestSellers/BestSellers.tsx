"use client";

import React, { useEffect, useState } from "react";
import styles from "./BestSellers.module.css";

import AddToCartButton from "@/components/common/AddToCartButton/AddToCartButton";

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

  if (loading)
    return <div className={styles["loading-text"]}>Đang tải món ngon...</div>;

  return (
    <div className={styles["bestsellers-container"]}>
      <div className={styles["bestsellers-header"]}>
        <h2>Bán chạy nhất</h2>
        <a href="#" className={styles["view-all"]}>
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

      <div className={styles["bestsellers-grid"]}>
        {products.map((product) => (
          <div key={product.id} className={styles["product-card"]}>
            <div className={styles["product-image-wrapper"]}>
              <img
                src={product.image_url}
                alt={product.name}
                className={styles["product-image"]}
              />
              {product.original_price &&
                product.original_price > product.price && (
                  <span className={styles["discount-badge"]}>
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

            <div className={styles["product-info"]}>
              <div className={styles["info-top"]}>
                <h3 className={styles["product-name"]} title={product.name}>
                  {product.name}
                </h3>
                <p
                  className={styles["product-desc"]}
                  title={product.description}
                >
                  {product.description}
                </p>
                <div className={styles["product-stats"]}>
                  <span className={styles["sold-count"]}>
                    Đã bán {product.sold_count}
                  </span>
                </div>
              </div>

              <div className={styles["info-bottom"]}>
                <div className={styles["price-group"]}>
                  {product.original_price && (
                    <span className={styles["original-price"]}>
                      {formatPrice(product.original_price)}
                    </span>
                  )}
                  <span className={styles["current-price"]}>
                    {formatPrice(product.price)}
                  </span>
                </div>

                <div className={styles["action-buttons"]}>
                  <AddToCartButton
                    className={styles["add-cart-btn"]}
                    product={{
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      imageUrl: product.image_url,
                    }}
                  >
                    <button className={styles["btn-text"]}>Thêm vào giỏ</button>
                    <svg
                      className={styles["btn-icon"]}
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
                  </AddToCartButton>

                  <div className={styles["buy-now-btn"]} title="Mua ngay">
                    <button className={styles["btn-text"]}>Mua ngay</button>
                    <svg
                      className={styles["btn-icon"]}
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
