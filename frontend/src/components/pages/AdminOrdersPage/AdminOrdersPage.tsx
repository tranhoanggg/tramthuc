"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout/AdminLayout";
import { Table, Tag, Button, Space, Modal, Tabs, message, Spin } from "antd";
import {
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CarOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/context/AuthContext";

interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  delivery_status: string;
  created_at: string;
  note: string;
}

interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  name: string;
  image_url: string;
}

export default function AdminOrdersPage() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // State cho bộ lọc Tabs
  const [activeTab, setActiveTab] = useState("ALL");

  // State cho Modal Xem Chi Tiết
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "https://tramthuc-backend.onrender.com";

  // 1. FETCH DANH SÁCH ĐƠN HÀNG
  const fetchOrders = async () => {
    if (!user || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-User-Role": user.role || "",
        },
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách đơn hàng:", error);
      message.error("Không thể tải danh sách đơn hàng!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user, token]);

  // 2. FETCH CHI TIẾT 1 ĐƠN HÀNG KHI MỞ MODAL
  const fetchOrderItems = async (orderId: number) => {
    setLoadingItems(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/orders/${orderId}/items`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-User-Role": user?.role || "",
        },
      });
      const data = await res.json();
      if (data.success) {
        setOrderItems(data.data);
      }
    } catch (error) {
      message.error("Không thể tải chi tiết món ăn!");
    } finally {
      setLoadingItems(false);
    }
  };

  const handleViewDetails = (record: Order) => {
    setSelectedOrder(record);
    setOrderItems([]);
    setIsModalVisible(true);
    fetchOrderItems(record.id);
  };

  // 3. CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG (DUYỆT, GIAO, HỦY)
  const handleUpdateStatus = async (
    orderId: number,
    deliveryStatus: string,
    paymentStatus?: string,
  ) => {
    try {
      const bodyParams: any = { delivery_status: deliveryStatus };
      if (paymentStatus) bodyParams.payment_status = paymentStatus;

      const res = await fetch(`${apiUrl}/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-User-Role": user?.role || "",
        },
        body: JSON.stringify(bodyParams),
      });
      const data = await res.json();

      if (data.success) {
        message.success(`Đã cập nhật trạng thái đơn #${orderId}!`);
        fetchOrders(); // Load lại bảng ngay lập tức
        if (isModalVisible) setIsModalVisible(false); // Tự đóng modal nếu đang mở
      } else {
        message.error(data.message || "Cập nhật thất bại!");
      }
    } catch (error) {
      message.error("Lỗi kết nối khi cập nhật!");
    }
  };

  // ================= CẤU HÌNH BẢNG (TABLE) =================
  const formatVND = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  // Bộ lọc theo Tab (Frontend)
  const filteredOrders = orders.filter((order) => {
    if (activeTab === "ALL") return true;
    return order.delivery_status === activeTab;
  });

  const columns = [
    {
      title: "Mã Đơn",
      dataIndex: "id",
      key: "id",
      render: (id: number) => <strong>#{id}</strong>,
    },
    {
      title: "Khách hàng",
      key: "customer",
      render: (_: any, record: Order) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.customer_name}</div>
          <div style={{ fontSize: "12px", color: "#888" }}>
            {record.customer_phone}
          </div>
        </div>
      ),
    },
    {
      title: "Tổng Tiền",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (amount: number) => (
        <span style={{ color: "#c17a54", fontWeight: "bold" }}>
          {formatVND(amount)}
        </span>
      ),
    },
    {
      title: "Thanh toán",
      dataIndex: "payment_status",
      key: "payment_status",
      render: (status: string) => {
        let color = status === "PAID" ? "green" : "orange";
        let text = status === "PAID" ? "Đã thanh toán" : "Chưa thanh toán";
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Giao hàng",
      dataIndex: "delivery_status",
      key: "delivery_status",
      render: (status: string) => {
        let color = "blue";
        let text = "Chờ xử lý";
        if (status === "SHIPPING") {
          color = "orange";
          text = "Đang giao";
        }
        if (status === "COMPLETED") {
          color = "green";
          text = "Đã giao";
        }
        if (status === "CANCELLED") {
          color = "red";
          text = "Đã hủy";
        }
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Ngày đặt",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => new Date(date).toLocaleString("vi-VN"),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: any, record: Order) => (
        <Space size="middle">
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
            title="Xem chi tiết"
          />

          {/* Nút Duyệt / Giao hàng */}
          {record.delivery_status === "CREATED" && (
            <Button
              type="primary"
              style={{ backgroundColor: "#1890ff" }}
              icon={<CarOutlined />}
              onClick={() => handleUpdateStatus(record.id, "SHIPPING")}
              title="Bắt đầu giao"
            >
              Giao hàng
            </Button>
          )}

          {/* Nút Hoàn Thành */}
          {record.delivery_status === "SHIPPING" && (
            <Button
              type="primary"
              style={{ backgroundColor: "#52c41a" }}
              icon={<CheckCircleOutlined />}
              onClick={() => handleUpdateStatus(record.id, "COMPLETED", "PAID")}
              title="Đã giao xong"
            >
              Hoàn thành
            </Button>
          )}

          {/* Nút Hủy (Chỉ hiện khi chưa giao xong) */}
          {(record.delivery_status === "CREATED" ||
            record.delivery_status === "SHIPPING") && (
            <Button
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => {
                if (
                  window.confirm(
                    `Bạn có chắc chắn muốn HỦY đơn hàng #${record.id} không?`,
                  )
                ) {
                  handleUpdateStatus(record.id, "CANCELLED");
                }
              }}
              title="Hủy đơn"
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2>Quản lý Đơn hàng</h2>
        <Button onClick={fetchOrders} loading={loading}>
          Làm mới
        </Button>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: "ALL", label: "Tất cả đơn" },
          { key: "CREATED", label: "Chờ xử lý" },
          { key: "SHIPPING", label: "Đang giao" },
          { key: "COMPLETED", label: "Hoàn thành" },
          { key: "CANCELLED", label: "Đã hủy" },
        ]}
      />

      <Table
        columns={columns}
        dataSource={filteredOrders}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        style={{ marginTop: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
      />

      {/* POPUP XEM CHI TIẾT ĐƠN HÀNG */}
      <Modal
        title={`Chi tiết đơn hàng #${selectedOrder?.id}`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={700}
      >
        {selectedOrder && (
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginBottom: "20px",
                padding: "15px",
                backgroundColor: "#f9f9f9",
                borderRadius: "8px",
              }}
            >
              <p>
                <strong>Khách hàng:</strong> {selectedOrder.customer_name}
              </p>
              <p>
                <strong>Số điện thoại:</strong> {selectedOrder.customer_phone}
              </p>
              <p style={{ gridColumn: "span 2" }}>
                <strong>Địa chỉ giao:</strong> {selectedOrder.shipping_address}
              </p>
              <p>
                <strong>Phương thức:</strong>{" "}
                {selectedOrder.payment_method === "COD"
                  ? "Thanh toán khi nhận hàng"
                  : "Chuyển khoản VNPAY"}
              </p>
              <p>
                <strong>Ghi chú:</strong> {selectedOrder.note || "Không có"}
              </p>
            </div>

            <h3 style={{ marginBottom: 10 }}>Danh sách món:</h3>
            {loadingItems ? (
              <div style={{ textAlign: "center", padding: 20 }}>
                <Spin />
              </div>
            ) : (
              <Table
                dataSource={orderItems}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: "Món",
                    key: "name",
                    render: (record) => (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <img
                          src={record.image_url}
                          alt={record.name}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 4,
                            objectFit: "cover",
                          }}
                        />
                        <span>{record.name}</span>
                      </div>
                    ),
                  },
                  {
                    title: "Đơn giá",
                    dataIndex: "price",
                    render: (p) => formatVND(p),
                  },
                  { title: "Số lượng", dataIndex: "quantity", align: "center" },
                  {
                    title: "Thành tiền",
                    key: "total",
                    render: (r) => (
                      <strong style={{ color: "#c17a54" }}>
                        {formatVND(r.price * r.quantity)}
                      </strong>
                    ),
                    align: "right",
                  },
                ]}
              />
            )}

            <div
              style={{ textAlign: "right", marginTop: 20, fontSize: "18px" }}
            >
              Tổng cộng:{" "}
              <strong style={{ color: "#c17a54", fontSize: "24px" }}>
                {formatVND(selectedOrder.total_amount)}
              </strong>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
