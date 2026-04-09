"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./OrdersPage.module.css";

interface OrderItem {
  id: number;
  product: { id: number; name: string; imageUrl?: string };
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  createdAt: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: "UNPAID" | "PAID" | "FAILED" | "REFUND_REQUESTED";
  deliveryStatus: "CREATED" | "SHIPPING" | "COMPLETED" | "CANCELLED";
  items: OrderItem[];
}

export default function OrdersPageUI() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoadingAuth } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");

  // STATE MỚI: Quản lý danh sách ID các đơn hàng đang được mở rộng (Xem thêm)
  const [expandedOrders, setExpandedOrders] = useState<number[]>([]);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_PAYMENT_API_URL ||
    process.env.NEXT_PUBLIC_AUTH_API_URL ||
    "https://tramthuc-authservice.onrender.com";

  const getSafeToken = () => {
    if (token) return token;
    if (typeof window !== "undefined")
      return localStorage.getItem("tramthuc_token") || "";
    return "";
  };

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      router.push("/login");
    } else if (user) {
      fetchMyOrders();
    }
  }, [isLoadingAuth, isAuthenticated, user]);

  const fetchMyOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/my-orders`, {
        headers: {
          Authorization: `Bearer ${getSafeToken()}`,
          "X-User-Id": user?.id?.toString() || "",
          "X-User-Email": user?.email || "",
        },
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách đơn hàng", error);
    } finally {
      setIsLoading(false);
    }
  };

  // HÀM MỚI: Xử lý bật/tắt danh sách sản phẩm
  const toggleExpandOrder = (orderId: number) => {
    setExpandedOrders(
      (prev) =>
        prev.includes(orderId)
          ? prev.filter((id) => id !== orderId) // Nếu đang mở -> Thu gọn
          : [...prev, orderId], // Nếu đang đóng -> Mở rộng
    );
  };

  const handleAction = async (action: string, orderId: number) => {
    try {
      const headers = {
        Authorization: `Bearer ${getSafeToken()}`,
        "X-User-Id": user?.id?.toString() || "",
        "Content-Type": "application/json",
      };

      if (action === "CANCEL") {
        if (!confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;
        const res = await fetch(
          `${API_BASE_URL}/api/orders/${orderId}/cancel`,
          { method: "PUT", headers },
        );
        if (res.ok) {
          alert("Hủy đơn hàng thành công!");
          fetchMyOrders();
        } else {
          alert((await res.json()).message || "Không thể hủy đơn hàng này!");
        }
      } else if (action === "RECEIVED") {
        if (!confirm("Xác nhận bạn đã nhận được hàng?")) return;
        const res = await fetch(
          `${API_BASE_URL}/api/orders/${orderId}/received`,
          { method: "PUT", headers },
        );
        if (res.ok) {
          alert("Cảm ơn bạn đã mua sắm tại Trạm Thức!");
          fetchMyOrders();
        } else {
          alert((await res.json()).message || "Lỗi cập nhật trạng thái!");
        }
      } else if (action === "VIEW_DETAIL") {
        router.push(`/orders/${orderId}`);
      }
      // === LOGIC MUA LẠI CHUẨN UX ===
      else if (action === "REPURCHASE") {
        const orderToCopy = orders.find((o) => o.id === orderId);
        if (!orderToCopy) return;

        // Ép dữ liệu sản phẩm cũ về định dạng của Giỏ hàng
        const itemsToBuy = orderToCopy.items.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.product.imageUrl || "",
        }));

        // Lưu vào Session Storage để không làm ảnh hưởng Cart chính
        sessionStorage.setItem("repurchase_items", JSON.stringify(itemsToBuy));

        // Chuyển thẳng sang trang thanh toán kèm cờ
        router.push("/checkout?type=repurchase");
      }
    } catch (err) {
      alert("Lỗi kết nối đến máy chủ!");
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "ALL") return true;

    if (activeTab === "TO_PAY") {
      return (
        (order.paymentStatus === "UNPAID" ||
          order.paymentStatus === "FAILED") &&
        order.paymentMethod === "VNPAY" &&
        order.deliveryStatus !== "CANCELLED"
      );
    }
    if (activeTab === "PROCESSING") {
      const isCodPending =
        order.paymentMethod === "COD" && order.deliveryStatus === "CREATED";
      const isVnPayPaid =
        order.paymentMethod === "VNPAY" &&
        order.paymentStatus === "PAID" &&
        order.deliveryStatus === "CREATED";
      return isCodPending || isVnPayPaid;
    }
    if (activeTab === "SHIPPING") return order.deliveryStatus === "SHIPPING";
    if (activeTab === "COMPLETED") return order.deliveryStatus === "COMPLETED";
    if (activeTab === "CANCELLED") return order.deliveryStatus === "CANCELLED";

    return true;
  });

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

  const getPaymentBadge = (status: string, method: string) => {
    if (status === "PAID")
      return (
        <span className={`${styles.badge} ${styles["badge-paid"]}`}>
          Đã thanh toán
        </span>
      );
    if (status === "REFUND_REQUESTED")
      return (
        <span className={`${styles.badge} ${styles["badge-unpaid"]}`}>
          Chờ hoàn tiền
        </span>
      );
    if (status === "FAILED")
      return (
        <span className={`${styles.badge} ${styles["badge-unpaid"]}`}>
          Lỗi thanh toán
        </span>
      );
    if (method === "COD")
      return (
        <span className={`${styles.badge} ${styles["badge-unpaid"]}`}>
          Thanh toán khi nhận
        </span>
      );
    return (
      <span className={`${styles.badge} ${styles["badge-unpaid"]}`}>
        Chưa thanh toán
      </span>
    );
  };

  const getDeliveryBadge = (status: string) => {
    switch (status) {
      case "CREATED":
        return (
          <span className={`${styles.badge} ${styles["badge-created"]}`}>
            Chờ xác nhận
          </span>
        );
      case "SHIPPING":
        return (
          <span className={`${styles.badge} ${styles["badge-shipping"]}`}>
            Đang giao hàng
          </span>
        );
      case "COMPLETED":
        return (
          <span className={`${styles.badge} ${styles["badge-completed"]}`}>
            Đã hoàn thành
          </span>
        );
      case "CANCELLED":
        return (
          <span className={`${styles.badge} ${styles["badge-cancelled"]}`}>
            Đã hủy
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading)
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        Đang tải đơn hàng...
      </div>
    );

  return (
    <div className={styles["orders-wrapper"]}>
      <h1 className={styles["page-title"]}>Lịch sử đơn hàng</h1>

      <div className={styles["tabs-container"]}>
        {[
          { id: "ALL", label: "Tất cả" },
          { id: "TO_PAY", label: "Chờ thanh toán" },
          { id: "PROCESSING", label: "Đang xử lý" },
          { id: "SHIPPING", label: "Đang giao" },
          { id: "COMPLETED", label: "Hoàn thành" },
          { id: "CANCELLED", label: "Đã hủy" },
        ].map((tab) => (
          <div
            key={tab.id}
            className={`${styles["tab-item"]} ${activeTab === tab.id ? styles["tab-active"] : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </div>

      <div className={styles["orders-list"]}>
        {filteredOrders.length === 0 ? (
          <div className={styles["empty-state"]}>
            <div className={styles["empty-icon"]}>📦</div>
            <p>Chưa có đơn hàng nào trong trạng thái này.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            // Xác định xem đơn này có đang được bấm mở rộng không
            const isExpanded = expandedOrders.includes(order.id);
            // Nếu mở rộng thì lấy hết, không thì chỉ lấy 2 món đầu
            const itemsToShow = isExpanded
              ? order.items
              : order.items.slice(0, 2);

            return (
              <div key={order.id} className={styles["order-card"]}>
                <div className={styles["card-header"]}>
                  <div>
                    <span className={styles["order-id"]}>#TRT-{order.id}</span>
                    <span className={styles["order-date"]}>
                      • {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <div className={styles["badges-wrapper"]}>
                    {getPaymentBadge(order.paymentStatus, order.paymentMethod)}
                    {getDeliveryBadge(order.deliveryStatus)}
                  </div>
                </div>

                <div className={styles["card-body"]}>
                  {itemsToShow.map((item) => (
                    <div key={item.id} className={styles["order-item"]}>
                      {item.product?.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className={styles["item-image"]}
                        />
                      ) : (
                        <div className={styles["item-image"]}>IMG</div>
                      )}
                      <div className={styles["item-details"]}>
                        <div className={styles["item-name"]}>
                          {item.product?.name || "Sản phẩm Trạm Thức"}
                        </div>
                        <div className={styles["item-qty"]}>
                          x{item.quantity}
                        </div>
                      </div>
                      <div className={styles["item-price"]}>
                        {formatPrice(item.price)}
                      </div>
                    </div>
                  ))}

                  {/* --- HIỂN THỊ NÚT THU GỌN / XEM THÊM --- */}
                  {order.items.length > 2 && (
                    <div
                      className={styles["more-items-text"]}
                      onClick={() => toggleExpandOrder(order.id)}
                      style={{ fontWeight: "500" }}
                    >
                      {isExpanded
                        ? "Thu gọn ∧"
                        : `Xem thêm ${order.items.length - 2} sản phẩm khác ∨`}
                    </div>
                  )}
                </div>

                <div className={styles["card-footer"]}>
                  <div className={styles["total-wrapper"]}>
                    <span className={styles["total-label"]}>
                      Tổng tiền thanh toán
                    </span>
                    <span className={styles["total-price"]}>
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>

                  <div className={styles["actions-wrapper"]}>
                    {order.deliveryStatus === "SHIPPING" && (
                      <>
                        <button
                          className={`${styles.btn} ${styles["btn-outline"]}`}
                          onClick={() => handleAction("VIEW_DETAIL", order.id)}
                        >
                          Xem chi tiết
                        </button>
                        <button
                          className={`${styles.btn} ${styles["btn-outline"]}`}
                          onClick={() => handleAction("TRACKING", order.id)}
                        >
                          Theo dõi đơn
                        </button>
                        <button
                          className={`${styles.btn} ${styles["btn-primary"]}`}
                          onClick={() => handleAction("RECEIVED", order.id)}
                        >
                          Đã nhận hàng
                        </button>
                      </>
                    )}

                    {(order.paymentStatus === "UNPAID" ||
                      order.paymentStatus === "FAILED") &&
                      order.paymentMethod === "VNPAY" &&
                      order.deliveryStatus === "CREATED" && (
                        <>
                          <button
                            className={`${styles.btn} ${styles["btn-outline"]}`}
                            onClick={() => handleAction("CANCEL", order.id)}
                          >
                            Hủy đơn
                          </button>
                          <button
                            className={`${styles.btn} ${styles["btn-primary"]}`}
                            onClick={() => handleAction("PAY_NOW", order.id)}
                          >
                            Thanh toán ngay
                          </button>
                        </>
                      )}

                    {((order.paymentMethod === "COD" &&
                      order.deliveryStatus === "CREATED") ||
                      (order.paymentStatus === "PAID" &&
                        order.deliveryStatus === "CREATED")) && (
                      <>
                        <button
                          className={`${styles.btn} ${styles["btn-outline"]}`}
                          onClick={() => handleAction("CANCEL", order.id)}
                        >
                          Hủy đơn
                        </button>
                        <button
                          className={`${styles.btn} ${styles["btn-primary"]}`}
                          onClick={() => handleAction("VIEW_DETAIL", order.id)}
                        >
                          Xem chi tiết
                        </button>
                      </>
                    )}

                    {(order.deliveryStatus === "COMPLETED" ||
                      order.deliveryStatus === "CANCELLED") && (
                      <>
                        <button
                          className={`${styles.btn} ${styles["btn-outline"]}`}
                          onClick={() => handleAction("VIEW_DETAIL", order.id)}
                        >
                          Xem chi tiết
                        </button>
                        <button
                          className={`${styles.btn} ${styles["btn-primary"]}`}
                          onClick={() => handleAction("REPURCHASE", order.id)}
                        >
                          Mua lại
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
