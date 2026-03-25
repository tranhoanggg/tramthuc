"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { useAuth } from "@/context/AuthContext";
import styles from "./CheckoutPage.module.css";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCartStore();
  const { user, token } = useAuth();

  // URL API lấy từ hình ảnh bạn cung cấp
  const apiUrl =
    process.env.NEXT_PUBLIC_PAYMENT_API_URL ||
    "https://tramthuc-paymentservice.onrender.com";

  const [formData, setFormData] = useState({
    receiverName: "",
    receiverPhone: "",
    fullAddress: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("VNPAY");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Logic tính toán Freeship
  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const isFreeship = subtotal >= 200000;
  const shippingFee = isFreeship ? 0 : 40000;
  const finalTotal = subtotal + shippingFee;

  useEffect(() => {
    if (user) {
      setFormData({
        receiverName: user.fullName || "",
        receiverPhone: user.phoneNumber || "",
        fullAddress: "",
      });
    }
  }, [user]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const orderPayload = {
      customerName: formData.receiverName,
      customerPhone: formData.receiverPhone,
      shippingAddress: formData.fullAddress,
      paymentMethod: paymentMethod,
      items: cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    };

    try {
      const response = await fetch(`${apiUrl}/api/orders/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-User-Id": user?.id?.toString() || "",
          "X-User-Email": user?.email || "",
        },
        body: JSON.stringify(orderPayload),
      });

      const result = await response.json();

      // Kiểm tra mã 200 từ Backend trả về
      if (response.ok && result.code === 200) {
        if (paymentMethod === "VNPAY") {
          const url = result.data?.paymentUrl; // Truy cập đúng cấu trúc data
          if (url) {
            clearCart(); // Xóa giỏ hàng trước khi đi thanh toán
            window.location.href = url;
            return;
          } else {
            alert("Không nhận được liên kết VNPAY. Hãy kiểm tra lại Backend!");
          }
        } else {
          alert("🎉 " + (result.message || "Đặt hàng thành công!"));
          clearCart();
          router.push("/");
        }
      } else {
        alert(result.message || "Lỗi tạo đơn hàng!");
      }
    } catch (error) {
      alert("Lỗi kết nối server thanh toán!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.checkoutContainer}>
      <h1 className={styles.pageTitle}>Thanh toán</h1>

      <form className={styles.checkoutLayout} onSubmit={handlePlaceOrder}>
        <div className={styles.leftColumn}>
          <div className={styles.sectionBox}>
            <h2 className={styles.sectionTitle}>Thông tin nhận hàng</h2>
            <div className={styles.inputRow}>
              <div className={styles.formGroup}>
                <label>Tên người nhận</label>
                <input
                  className={styles.formInput}
                  value={formData.receiverName}
                  onChange={(e) =>
                    setFormData({ ...formData, receiverName: e.target.value })
                  }
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Số điện thoại</label>
                <input
                  className={styles.formInput}
                  value={formData.receiverPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, receiverPhone: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Địa chỉ nhận hàng chi tiết</label>
              <input
                type="text"
                className={styles.formInputAddress}
                placeholder="Số nhà, tên đường, phường/xã..."
                value={formData.fullAddress}
                onChange={(e) =>
                  setFormData({ ...formData, fullAddress: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className={styles.sectionBox}>
            <h2 className={styles.sectionTitle}>Phương thức thanh toán</h2>
            <div className={styles.paymentOptions}>
              <label
                className={`${styles.paymentOption} ${paymentMethod === "VNPAY" ? styles.active : ""}`}
              >
                <input
                  type="radio"
                  value="VNPAY"
                  checked={paymentMethod === "VNPAY"}
                  onChange={() => setPaymentMethod("VNPAY")}
                />
                <span>Thanh toán VNPAY (QR Code / Thẻ nội địa)</span>
              </label>
              <label
                className={`${styles.paymentOption} ${paymentMethod === "COD" ? styles.active : ""}`}
              >
                <input
                  type="radio"
                  value="COD"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                />
                <span>Thanh toán khi nhận hàng (COD)</span>
              </label>
            </div>
          </div>
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.summaryBox}>
            <h2 className={styles.sectionTitle}>Tóm tắt đơn hàng</h2>

            <div className={styles.itemList}>
              {cart.map((item) => (
                <div key={item.productId} className={styles.itemRow}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemQty}>x{item.quantity}</span>
                  </div>
                  <span className={styles.itemTotal}>
                    {(item.price * item.quantity).toLocaleString()} ₫
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.divider}></div>

            <div className={styles.summaryRow}>
              <span>Tạm tính ({cart.length} món)</span>
              <span>{subtotal.toLocaleString()} ₫</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Phí vận chuyển</span>
              <span className={isFreeship ? styles.freeShip : ""}>
                {isFreeship ? "Miễn phí" : `${shippingFee.toLocaleString()} ₫`}
              </span>
            </div>

            <div className={styles.divider}></div>

            <div className={styles.totalRow}>
              <span>Tổng cộng</span>
              <span className={styles.finalAmount}>
                {finalTotal.toLocaleString()} ₫
              </span>
            </div>

            <button
              type="submit"
              className={styles.btnSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "ĐANG XỬ LÝ..." : "XÁC NHẬN ĐẶT HÀNG"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
