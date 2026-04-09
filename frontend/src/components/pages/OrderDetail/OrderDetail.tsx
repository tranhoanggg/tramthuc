"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./OrderDetail.module.css";

interface OrderItem {
  id: number;
  product: { id: number; name: string; imageUrl?: string };
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  createdAt: string;
  totalAmount: number; // Đây thực chất là Subtotal (tiền hàng) lưu trong DB
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  paymentMethod: string;
  paymentStatus: "UNPAID" | "PAID" | "FAILED" | "REFUND_REQUESTED";
  deliveryStatus: "CREATED" | "SHIPPING" | "COMPLETED" | "CANCELLED";
  items: OrderItem[];
}

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = useParams(); // Lấy orderId từ URL
  const { user, token, isAuthenticated, isLoadingAuth } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // State tính toán phí ship on-the-fly
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_PAYMENT_API_URL ||
    process.env.NEXT_PUBLIC_AUTH_API_URL ||
    "https://tramthuc-authservice.onrender.com";
  const GOONG_API_KEY = process.env.NEXT_PUBLIC_GOONG_API_KEY || "";
  const STORE_COORDS = { lat: 21.005615, lng: 105.843343 }; // Tọa độ cửa hàng

  const getSafeToken = () => {
    if (token) return token;
    if (typeof window !== "undefined")
      return localStorage.getItem("tramthuc_token") || "";
    return "";
  };

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      router.push("/login");
    } else if (user && id) {
      fetchOrderDetail();
    }
  }, [isLoadingAuth, isAuthenticated, user, id]);

  const fetchOrderDetail = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
        headers: {
          Authorization: `Bearer ${getSafeToken()}`,
          "X-User-Id": user?.id?.toString() || "",
        },
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setOrder(data.data);
        // Ngay khi lấy được Order, tiến hành dịch ngược địa chỉ để tính phí ship
        calculateOnTheFlyShipping(
          data.data.shippingAddress,
          data.data.totalAmount,
        );
      } else {
        alert("Không tìm thấy đơn hàng!");
        router.push("/orders");
      }
    } catch (error) {
      console.error("Lỗi lấy chi tiết đơn hàng", error);
    } finally {
      setIsLoading(false);
    }
  };

  // HÀM: TÍNH LẠI PHÍ SHIP (Dựa theo logic CheckoutPage)
  const calculateOnTheFlyShipping = async (
    address: string,
    subtotal: number,
  ) => {
    // 1. Kiểm tra Freeship
    if (subtotal >= 200000) {
      setShippingFee(0);
      return;
    }

    setIsCalculatingFee(true);
    try {
      // 2. Geocoding: Đổi text địa chỉ thành Tọa độ (Lat, Lng)
      const geoRes = await fetch(
        `https://rsapi.goong.io/geocode?address=${encodeURIComponent(address)}&api_key=${GOONG_API_KEY}`,
      );
      const geoData = await geoRes.json();

      if (geoData?.results?.[0]?.geometry?.location) {
        const destLat = geoData.results[0].geometry.location.lat;
        const destLng = geoData.results[0].geometry.location.lng;

        // 3. Distance Matrix: Tính khoảng cách
        const distRes = await fetch(
          `https://rsapi.goong.io/DistanceMatrix?origins=${STORE_COORDS.lat},${STORE_COORDS.lng}&destinations=${destLat},${destLng}&vehicle=bike&api_key=${GOONG_API_KEY}`,
        );
        const distData = await distRes.json();

        if (distData?.rows?.[0]?.elements?.[0]?.status === "OK") {
          const distanceMeters = distData.rows[0].elements[0].distance.value;
          const km = distanceMeters / 1000;

          let fee = 15000;
          if (km > 2) {
            fee += Math.ceil(km - 2) * 5000;
          }
          setShippingFee(fee);
        } else {
          setShippingFee(30000); // Fallback
        }
      } else {
        setShippingFee(30000); // Fallback nếu không parse được địa chỉ
      }
    } catch (error) {
      setShippingFee(30000); // Fallback
    } finally {
      setIsCalculatingFee(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading || !order)
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        Đang tải chi tiết đơn hàng...
      </div>
    );

  // XÁC ĐỊNH BƯỚC CỦA TIMELINE
  const isCancelled = order.deliveryStatus === "CANCELLED";
  const step1Active = !isCancelled; // Đã tạo đơn
  const step2Active =
    !isCancelled &&
    (order.paymentStatus === "PAID" || order.paymentMethod === "COD"); // Đã thanh toán hoặc COD
  const step3Active =
    !isCancelled &&
    (order.deliveryStatus === "SHIPPING" ||
      order.deliveryStatus === "COMPLETED"); // Đang giao
  const step4Active = !isCancelled && order.deliveryStatus === "COMPLETED"; // Đã giao

  return (
    <div className={styles["detail-wrapper"]}>
      <div className={styles["header-row"]}>
        <button className={styles["back-btn"]} onClick={() => router.back()}>
          ← Quay lại
        </button>
        <span className={styles["order-id-title"]}>
          ĐƠN HÀNG #TRT-{order.id}
        </span>
      </div>

      {isCancelled ? (
        <div className={styles["cancelled-alert"]}>
          Đơn hàng này đã bị hủy.{" "}
          {order.paymentStatus === "REFUND_REQUESTED"
            ? "(Đang chờ hoàn tiền VNPAY)"
            : ""}
        </div>
      ) : (
        /* KHỐI 1: TIMELINE TRẠNG THÁI (Đã căn ngang bằng nhau) */
        <div className={styles["section-card"]}>
          <div className={styles["timeline-container"]}>
            <div
              className={`${styles["timeline-step"]} ${step1Active ? styles.active : ""}`}
            >
              <div className={styles["step-icon"]}>📋</div>
              <div className={styles["step-label"]}>
                <span className={styles["step-title"]}>Đơn hàng đã đặt</span>
                <span className={styles["step-time"]}>
                  {formatDate(order.createdAt)}
                </span>
              </div>
            </div>

            <div
              className={`${styles["timeline-step"]} ${step2Active ? styles.active : ""}`}
            >
              <div className={styles["step-icon"]}>💳</div>
              <div className={styles["step-label"]}>
                <span className={styles["step-title"]}>
                  {order.paymentMethod === "COD"
                    ? "Đã xác nhận COD"
                    : "Đã thanh toán"}
                </span>
                {/* Giữ khoảng trống để luôn ngang hàng với bước 1 */}
                <span className={styles["step-time"]}>&nbsp;</span>
              </div>
            </div>

            <div
              className={`${styles["timeline-step"]} ${step3Active ? styles.active : ""}`}
            >
              <div className={styles["step-icon"]}>🚚</div>
              <div className={styles["step-label"]}>
                <span className={styles["step-title"]}>Đang giao hàng</span>
                <span className={styles["step-time"]}>&nbsp;</span>
              </div>
            </div>

            <div
              className={`${styles["timeline-step"]} ${step4Active ? styles.active : ""}`}
            >
              <div className={styles["step-icon"]}>✅</div>
              <div className={styles["step-label"]}>
                <span className={styles["step-title"]}>
                  Giao hàng thành công
                </span>
                <span className={styles["step-time"]}>&nbsp;</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KHỐI 2: THÔNG TIN NGƯỜI NHẬN */}
      <div className={styles["section-card"]}>
        <h2 className={styles["section-title"]}>Thông tin người nhận</h2>
        <div className={styles["address-info"]}>
          <p>
            <span className={styles["info-label"]}>Tên người nhận:</span>
            <span>{order.customerName}</span>
          </p>
          <p>
            <span className={styles["info-label"]}>Số điện thoại:</span>
            <span>{order.customerPhone}</span>
          </p>
          <p>
            <span className={styles["info-label"]}>Địa chỉ giao hàng:</span>
            <span>{order.shippingAddress}</span>
          </p>
        </div>
      </div>

      {/* KHỐI 3: DANH SÁCH SẢN PHẨM */}
      <div className={styles["section-card"]}>
        <h2 className={styles["section-title"]}>Sản phẩm</h2>
        {order.items.map((item) => (
          <div key={item.id} className={styles["product-item"]}>
            {item.product?.imageUrl ? (
              <img
                src={item.product.imageUrl}
                alt={item.product.name}
                className={styles["product-img"]}
              />
            ) : (
              <div
                className={styles["product-img"]}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  color: "#aaa",
                }}
              >
                IMG
              </div>
            )}

            <div className={styles["product-details"]}>
              <div className={styles["product-name"]}>
                {item.product?.name || "Sản phẩm Trạm Thức"}
              </div>
              <div className={styles["product-price-qty"]}>
                {formatPrice(item.price)} x {item.quantity}
              </div>
            </div>
            <div className={styles["product-total"]}>
              {formatPrice(item.price * item.quantity)}
            </div>
          </div>
        ))}
      </div>

      {/* KHỐI 4: TÓM TẮT THANH TOÁN */}
      <div className={styles["section-card"]}>
        <div className={styles["summary-container"]}>
          <div className={styles["summary-row"]}>
            <span>Phương thức thanh toán:</span>
            <strong>
              {order.paymentMethod === "VNPAY"
                ? "VNPAY"
                : "Thanh toán khi nhận hàng (COD)"}
            </strong>
          </div>
          <div className={styles["summary-row"]}>
            <span>Tổng tiền hàng:</span>
            <span>{formatPrice(order.totalAmount)}</span>
          </div>
          <div className={styles["summary-row"]}>
            <span>Phí vận chuyển:</span>
            <span>
              {isCalculatingFee ? (
                <span className={styles["calculating-text"]}>
                  Đang tính toán...
                </span>
              ) : shippingFee === 0 ? (
                <span style={{ color: "#2e7d32", fontWeight: "bold" }}>
                  Miễn phí
                </span>
              ) : (
                formatPrice(shippingFee)
              )}
            </span>
          </div>

          <div className={`${styles["summary-row"]} ${styles.total}`}>
            <span>Thành tiền:</span>
            <span className={styles["final-price"]}>
              {isCalculatingFee
                ? "..."
                : formatPrice(order.totalAmount + shippingFee)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
