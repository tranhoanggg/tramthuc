"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import styles from "./CartPage.module.css";

export default function CartPage() {
  // Lấy thêm hàm addToCart để dùng cho phần Gợi ý
  const { cart, updateQuantity, removeFromCart, addToCart } = useCartStore();

  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  const totalAmount = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  // LOGIC FREESHIP: Mốc 200k
  const FREE_SHIPPING_THRESHOLD = 200000;
  const remainingAmount = Math.max(0, FREE_SHIPPING_THRESHOLD - totalAmount);
  const progressPercentage = Math.min(
    (totalAmount / FREE_SHIPPING_THRESHOLD) * 100,
    100,
  );

  const cartItemIds = cart
    .map((item) => item.productId)
    .sort()
    .join(",");

  useEffect(() => {
    const fetchAIRecommendations = async () => {
      if (cart.length === 0) {
        setAiSuggestions([]);
        return;
      }

      setIsLoadingAI(true);
      try {
        const response = await fetch("/api/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cartItems: cart,
            context: "cart",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setAiSuggestions(data);
        }
      } catch (error) {
        console.error("Lỗi lấy dữ liệu gợi ý:", error);
      } finally {
        setIsLoadingAI(false);
      }
    };

    fetchAIRecommendations();
  }, [cartItemIds]);

  if (cart.length === 0) {
    return (
      <div className={styles.emptyCart}>
        <h1 className={styles.emptyTitle}>Giỏ hàng của bạn đang trống</h1>
        <p className={styles.emptyDesc}>
          Hãy khám phá thêm các thức uống tuyệt vời của Trạm Thức nhé!
        </p>
        <Link href="/menu" className={styles.btnMenu}>
          Xem Menu
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.cartContainer}>
      <h1 className={styles.pageTitle}>Giỏ hàng của bạn</h1>

      <div className={styles.cartLayout}>
        {/* CỘT TRÁI: DANH SÁCH SẢN PHẨM & GỢI Ý */}
        <div className={styles.leftColumn}>
          <div className={styles.cartList}>
            {cart.map((item) => (
              <div key={item.productId} className={styles.cartItem}>
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className={styles.itemImage}
                />

                <div className={styles.itemInfo}>
                  <h3 className={styles.itemName}>{item.name}</h3>
                  <p className={styles.itemPrice}>
                    {item.price.toLocaleString("vi-VN")} ₫
                  </p>
                </div>

                <div className={styles.quantityControl}>
                  <button
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity - 1)
                    }
                    className={styles.qtyBtn}
                  >
                    -
                  </button>
                  <span className={styles.qtyValue}>{item.quantity}</span>
                  <button
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity + 1)
                    }
                    className={styles.qtyBtn}
                  >
                    +
                  </button>
                </div>

                <div className={styles.itemTotal}>
                  <p className={styles.itemTotalPrice}>
                    {(item.price * item.quantity).toLocaleString("vi-VN")} ₫
                  </p>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className={styles.btnRemove}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* HIỂN THỊ GỢI Ý CỦA AI */}
          <div className={styles.suggestedSection}>
            <h3 className={styles.suggestedTitle}>Gợi ý cho bạn</h3>

            {isLoadingAI ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px",
                  color: "#6b7280",
                }}
              >
                <span className={styles.loadingPulse}>
                  ⏳ Đang chuẩn bị sản phẩm gợi ý...
                </span>
              </div>
            ) : aiSuggestions.length > 0 ? (
              <div className={styles.suggestedGrid}>
                {aiSuggestions.map((product, index) => (
                  <div key={index} className={styles.suggestedCard}>
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className={styles.suggestedImg}
                    />
                    <h4 className={styles.suggestedName}>{product.name}</h4>
                    <p className={styles.suggestedPrice}>
                      {product.price.toLocaleString("vi-VN")} ₫
                    </p>
                    <button
                      className={styles.btnAddSuggest}
                      onClick={() => addToCart({ ...product, quantity: 1 })}
                    >
                      + Thêm vào giỏ
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG */}
        <div className={styles.rightColumn}>
          <div className={styles.summaryBox}>
            {/* ===== TÍNH NĂNG MỚI: THANH TIẾN TRÌNH FREESHIP ===== */}
            <div className={styles.shippingProgressContainer}>
              {remainingAmount > 0 ? (
                <p className={styles.shippingMessage}>
                  Mua thêm{" "}
                  <span className={styles.highlightAmount}>
                    {remainingAmount.toLocaleString("vi-VN")} ₫
                  </span>{" "}
                  để được miễn phí giao hàng!
                </p>
              ) : (
                <p className={styles.shippingMessage}>
                  <span className={styles.successMessage}>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Chúc mừng! Đơn hàng được Freeship.
                  </span>
                </p>
              )}
              <div className={styles.progressBarBg}>
                <div
                  className={styles.progressBarFill}
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
            {/* ==================================================== */}

            <h2 className={styles.summaryTitle}>Tóm tắt đơn hàng</h2>

            <div className={styles.summaryRow}>
              <span>Tạm tính</span>
              <span>{totalAmount.toLocaleString("vi-VN")} ₫</span>
            </div>

            <div className={styles.summaryRow}>
              <span>Phí vận chuyển</span>
              <span>
                {remainingAmount > 0 ? (
                  "Chưa tính"
                ) : (
                  <span style={{ color: "#10b981", fontWeight: 600 }}>
                    Miễn phí
                  </span>
                )}
              </span>
            </div>

            <div className={styles.summaryTotalRow}>
              <span className={styles.summaryTotalLabel}>Tổng cộng</span>
              <span className={styles.summaryTotalPrice}>
                {totalAmount.toLocaleString("vi-VN")} ₫
              </span>
            </div>

            <Link href="/checkout" className={styles.btnCheckout}>
              TIẾN HÀNH THANH TOÁN
            </Link>

            <p className={styles.note}>
              (Xin lưu ý: Phí vận chuyển sẽ được tính ở trang thanh toán)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
