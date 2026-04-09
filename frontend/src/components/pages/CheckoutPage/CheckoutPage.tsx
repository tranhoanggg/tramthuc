"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { useAddressStore } from "@/store/useAddressStore";
import { useAuth } from "@/context/AuthContext";
import styles from "./CheckoutPage.module.css";

interface CheckoutItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, clearCart } = useCartStore();
  const { user, token } = useAuth();

  const buyNowParam = searchParams.get("buyNow");
  const checkoutType = searchParams.get("type");

  const apiUrl =
    process.env.NEXT_PUBLIC_PAYMENT_API_URL ||
    "https://tramthuc-paymentservice.onrender.com";
  const goongApiKey = process.env.NEXT_PUBLIC_GOONG_API_KEY;

  const [formData, setFormData] = useState<{
    receiverName: string;
    receiverPhone: string;
    fullAddress: string;
    lat: number | null;
    lng: number | null;
  }>({
    receiverName: "",
    receiverPhone: "",
    fullAddress: "",
    lat: null,
    lng: null,
  });

  const { selectedAddress } = useAddressStore();
  const [hasInitAddress, setHasInitAddress] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("VNPAY");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [dynamicShippingFee, setDynamicShippingFee] = useState<number>(40000);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);
  const STORE_COORDS = { lat: 21.005615, lng: 105.843343 };

  // ==========================================
  // LOGIC NẠP DỮ LIỆU MỚI (AN TOÀN TUYỆT ĐỐI)
  // ==========================================
  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let items: CheckoutItem[] = [];

    if (checkoutType === "repurchase") {
      try {
        const saved = sessionStorage.getItem("repurchase_items");
        if (saved) {
          items = JSON.parse(saved);
        } else {
          items = cart || []; // Fallback về giỏ hàng nếu ko tìm thấy
        }
      } catch (error) {
        items = cart || [];
      }
    } else if (buyNowParam) {
      try {
        items = [JSON.parse(decodeURIComponent(buyNowParam))];
      } catch (error) {
        items = cart || [];
      }
    } else {
      items = cart || [];
    }

    setCheckoutItems(items);
    setIsReady(true); // Đánh dấu đã nạp xong dữ liệu
  }, [checkoutType, buyNowParam, cart]);

  // Các phép toán tính tiền
  const subtotal = checkoutItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const isFreeship = subtotal >= 200000;
  const shippingFee = isFreeship ? 0 : dynamicShippingFee;
  const finalTotal = subtotal + shippingFee;

  // ==========================================

  useEffect(() => {
    if (!hasInitAddress && (user || selectedAddress)) {
      if (selectedAddress) {
        // Ưu tiên 1: Lấy địa chỉ khách vừa chọn ở HomePage
        setFormData((prev) => ({
          ...prev,
          receiverName: selectedAddress.receiverName,
          receiverPhone: selectedAddress.receiverPhone,
          fullAddress: selectedAddress.fullAddress,
          lat: selectedAddress.latitude,
          lng: selectedAddress.longitude,
        }));

        // Gọi tự động tính phí ship
        if (selectedAddress.latitude && selectedAddress.longitude) {
          calculateShippingFee(
            selectedAddress.latitude,
            selectedAddress.longitude,
          );
        }
      } else if (user) {
        // Ưu tiên 2: Không có địa chỉ thì rải Tên/SĐT của account ra
        setFormData((prev) => ({
          ...prev,
          receiverName: user.fullName || "",
          receiverPhone: user.phoneNumber || "",
        }));
      }
      setHasInitAddress(true); // Đánh dấu đã init xong, không ghi đè form nếu khách tự gõ tay nữa
    }
  }, [user, selectedAddress, hasInitAddress]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, fullAddress: value });

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.length > 2) {
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch(
            `https://rsapi.goong.io/Place/AutoComplete?api_key=${goongApiKey}&input=${encodeURIComponent(value)}`,
          );
          const data = await res.json();
          if (data && data.predictions) {
            setAddressSuggestions(data.predictions);
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error("Lỗi lấy gợi ý địa chỉ:", error);
        }
      }, 500);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = async (
    placeId: string,
    description: string,
  ) => {
    setFormData({ ...formData, fullAddress: description });
    setShowSuggestions(false);

    try {
      const res = await fetch(
        `https://rsapi.goong.io/Place/Detail?place_id=${placeId}&api_key=${goongApiKey}`,
      );
      const data = await res.json();

      if (data && data.result && data.result.geometry) {
        const location = data.result.geometry.location;

        setFormData((prev) => ({
          ...prev,
          lat: location.lat,
          lng: location.lng,
        }));

        calculateShippingFee(location.lat, location.lng);
      }
    } catch (error) {
      console.error("Lỗi lấy chi tiết tọa độ:", error);
    }
  };

  const calculateShippingFee = async (destLat: number, destLng: number) => {
    setIsCalculatingFee(true);
    try {
      const res = await fetch(
        `https://rsapi.goong.io/DistanceMatrix?origins=${STORE_COORDS.lat},${STORE_COORDS.lng}&destinations=${destLat},${destLng}&vehicle=bike&api_key=${goongApiKey}`,
      );
      const data = await res.json();

      if (data && data.rows && data.rows[0].elements[0].status === "OK") {
        const distanceMeters = data.rows[0].elements[0].distance.value;
        const km = distanceMeters / 1000;

        let fee = 15000;
        if (km > 2) {
          fee += Math.ceil(km - 2) * 5000;
        }
        setDynamicShippingFee(fee);
      } else {
        setDynamicShippingFee(30000);
      }
    } catch (error) {
      setDynamicShippingFee(30000);
    } finally {
      setIsCalculatingFee(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const orderPayload = {
      customerName: formData.receiverName,
      customerPhone: formData.receiverPhone,
      shippingAddress: formData.fullAddress,
      paymentMethod: paymentMethod,
      items: checkoutItems.map((item) => ({
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

      if (response.ok && result.code === 200) {
        if (checkoutType === "repurchase") {
          sessionStorage.removeItem("repurchase_items");
        } else if (!buyNowParam) {
          clearCart();
        }

        if (paymentMethod === "VNPAY") {
          const url = result.data?.paymentUrl;
          if (url) {
            window.location.href = url;
            return;
          } else {
            alert("Không nhận được liên kết VNPAY. Hãy kiểm tra lại Backend!");
          }
        } else {
          alert("🎉 " + (result.message || "Đặt hàng thành công!"));
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

  // CHẶN RENDER KHI DỮ LIỆU CHƯA SẴN SÀNG ĐỂ TRÁNH LỖI GIAO DIỆN
  if (!isReady) {
    return (
      <div className={styles.checkoutContainer}>
        <h1
          className={styles.pageTitle}
          style={{ textAlign: "center", color: "#aaa" }}
        >
          Đang chuẩn bị đơn hàng...
        </h1>
      </div>
    );
  }

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
              <div className={styles.addressWrapper}>
                <input
                  type="text"
                  className={styles.formInputAddress}
                  placeholder="Nhập tên đường, phường/xã..."
                  value={formData.fullAddress}
                  onChange={handleAddressChange}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  required
                />

                {showSuggestions && addressSuggestions.length > 0 && (
                  <ul className={styles.suggestionsList}>
                    {addressSuggestions.map((item) => (
                      <li
                        key={item.place_id}
                        className={styles.suggestionItem}
                        onClick={() =>
                          handleSelectSuggestion(
                            item.place_id,
                            item.description,
                          )
                        }
                      >
                        📍 {item.description}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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
              {checkoutItems.map((item) => (
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
              <span>Tạm tính ({checkoutItems.length} món)</span>
              <span>{subtotal.toLocaleString()} ₫</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Phí vận chuyển</span>
              <span className={isFreeship ? styles.freeShip : ""}>
                {isCalculatingFee ? (
                  <span style={{ fontSize: "12px", color: "#c17a54" }}>
                    Đang tính...
                  </span>
                ) : isFreeship ? (
                  "Miễn phí"
                ) : (
                  `${shippingFee.toLocaleString()} ₫`
                )}
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

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.checkoutContainer}>
          <h1 className={styles.pageTitle}>Đang tải trang thanh toán...</h1>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
