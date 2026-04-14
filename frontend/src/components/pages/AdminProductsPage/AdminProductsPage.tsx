"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout/AdminLayout";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Tag,
  message,
  Popconfirm,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useAuth } from "@/context/AuthContext";

export default function AdminProductsPage() {
  const { user, token } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [form] = Form.useForm();

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "https://tramthuc-backend.onrender.com";

  // 1. FETCH SẢN PHẨM
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-User-Role": user?.role || "",
        },
      });
      const data = await res.json();
      if (data.success) setProducts(data.data);
    } catch (error) {
      message.error("Lỗi tải danh sách sản phẩm!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && token) fetchProducts();
  }, [user, token]);

  // 2. MỞ MODAL THÊM / SỬA
  const openModal = (product: any = null) => {
    setEditingProduct(product);
    if (product) {
      form.setFieldsValue(product); // Đổ dữ liệu cũ vào form nếu là sửa
    } else {
      form.resetFields(); // Làm sạch form nếu là thêm mới
      form.setFieldsValue({ is_active: true, stock: 100 }); // Giá trị mặc định
    }
    setIsModalOpen(true);
  };

  // 3. XỬ LÝ LƯU (SUBMIT FORM)
  const handleSave = async (values: any) => {
    try {
      const isUpdating = !!editingProduct;
      const url = isUpdating
        ? `${apiUrl}/api/admin/products/${editingProduct.id}`
        : `${apiUrl}/api/admin/products`;
      const method = isUpdating ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-User-Role": user?.role || "",
        },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (data.success) {
        message.success(data.message);
        setIsModalOpen(false);
        fetchProducts(); // Tải lại bảng
      } else {
        message.error(data.message || "Có lỗi xảy ra!");
      }
    } catch (error) {
      message.error("Lỗi kết nối máy chủ!");
    }
  };

  // 4. XỬ LÝ XÓA (ẨN)
  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-User-Role": user?.role || "",
        },
      });
      const data = await res.json();
      if (data.success) {
        message.success("Đã ẩn sản phẩm!");
        fetchProducts();
      }
    } catch (error) {
      message.error("Lỗi kết nối máy chủ!");
    }
  };

  // Cấu hình Cột của Bảng
  const formatVND = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const columns = [
    {
      title: "Hình ảnh",
      dataIndex: "image_url",
      render: (url: string) => (
        <img
          src={url}
          alt="img"
          style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 8 }}
        />
      ),
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "name",
      key: "name",
      render: (text: string) => (
        <strong style={{ color: "#c17a54" }}>{text}</strong>
      ),
    },
    {
      title: "Danh mục",
      dataIndex: "category",
      key: "category",
    },
    {
      title: "Giá bán",
      dataIndex: "price",
      render: (price: number) => formatVND(price),
    },
    {
      title: "Tồn kho",
      dataIndex: "stock",
      render: (stock: number) => {
        let color = stock > 10 ? "green" : stock > 0 ? "orange" : "red";
        return <Tag color={color}>{stock} sản phẩm</Tag>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "blue" : "default"}>
          {isActive ? "Đang bán" : "Đã ẩn"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: any, record: any) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openModal(record)} />
          <Popconfirm
            title="Bạn có chắc muốn ẩn sản phẩm này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
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
        <h2>Quản lý Sản phẩm & Kho</h2>
        <Button
          type="primary"
          style={{ backgroundColor: "#c17a54" }}
          icon={<PlusOutlined />}
          onClick={() => openModal()}
        >
          Thêm Sản Phẩm
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 8 }}
      />

      {/* MODAL THÊM / SỬA SẢN PHẨM */}
      <Modal
        title={editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null} // Tắt footer mặc định để dùng nút submit của Form
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="name"
            label="Tên sản phẩm"
            rules={[{ required: true, message: "Vui lòng nhập tên!" }]}
          >
            <Input placeholder="Ví dụ: Cà phê muối" />
          </Form.Item>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}
          >
            <Form.Item
              name="category"
              label="Danh mục"
              rules={[{ required: true, message: "Chọn danh mục!" }]}
            >
              <Select>
                <Select.Option value="Cà phê">Cà phê</Select.Option>
                <Select.Option value="Trà">Trà</Select.Option>
                <Select.Option value="Đồ ăn vặt">Đồ ăn vặt</Select.Option>
                <Select.Option value="Quà tặng">Quà tặng</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="price"
              label="Giá bán (VNĐ)"
              rules={[{ required: true, message: "Nhập giá!" }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                step={1000}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
              />
            </Form.Item>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}
          >
            <Form.Item
              name="stock"
              label="Số lượng tồn kho"
              rules={[{ required: true, message: "Nhập tồn kho!" }]}
            >
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>

            <Form.Item
              name="is_active"
              label="Trạng thái hiển thị"
              valuePropName="checked"
            >
              <Switch checkedChildren="Đang bán" unCheckedChildren="Đã ẩn" />
            </Form.Item>
          </div>

          <Form.Item
            name="image_url"
            label="Link Ảnh (URL)"
            rules={[{ required: true, message: "Vui lòng dán link ảnh!" }]}
          >
            <Input placeholder="https://..." />
          </Form.Item>

          <Form.Item name="description" label="Mô tả sản phẩm">
            <Input.TextArea
              rows={3}
              placeholder="Mô tả ngắn gọn về sản phẩm..."
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Button
              onClick={() => setIsModalOpen(false)}
              style={{ marginRight: 10 }}
            >
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              style={{ backgroundColor: "#c17a54" }}
            >
              {editingProduct ? "Lưu thay đổi" : "Thêm mới"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </AdminLayout>
  );
}
