"use client";

import React, { useState, useEffect } from "react";
import { Layout, Menu, Button, Dropdown, Avatar, theme, Spin } from "antd";
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./AdminLayout.module.css";

const { Header, Sider, Content } = Layout;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoadingAuth, logoutContext } = useAuth();

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // BẢO MẬT FRONTEND: Đá văng user nếu chưa đăng nhập hoặc không phải Admin
  useEffect(() => {
    if (!isLoadingAuth) {
      if (!isAuthenticated || user?.role !== "ROLE_ADMIN") {
        router.replace("/"); // Đuổi về trang chủ
      }
    }
  }, [isAuthenticated, isLoadingAuth, user, router]);

  if (isLoadingAuth || !user || user.role !== "ROLE_ADMIN") {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin size="large" tip="Đang kiểm tra quyền truy cập..." />
      </div>
    );
  }

  // Menu Sidebar
  const menuItems = [
    {
      key: "/admin/dashboard",
      icon: <DashboardOutlined />,
      label: "Tổng quan",
      onClick: () => router.push("/admin/dashboard"),
    },
    {
      key: "/admin/orders",
      icon: <ShoppingCartOutlined />,
      label: "Quản lý Đơn hàng",
      onClick: () => router.push("/admin/orders"),
    },
    {
      key: "/admin/products",
      icon: <AppstoreOutlined />,
      label: "Quản lý Sản phẩm",
      onClick: () => router.push("/admin/products"),
    },
  ];

  // Menu Dropdown của User ở góc phải trên
  const userMenuItems = [
    {
      key: "1",
      icon: <HomeOutlined />,
      label: "Về trang cửa hàng",
      onClick: () => router.push("/"),
    },
    {
      key: "2",
      danger: true,
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      onClick: () => logoutContext(),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* THANH MENU BÊN TRÁI */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="light"
        className={styles.sider}
      >
        <div className={styles.logo}>
          {collapsed ? "TT" : "TRẠM THỨC ADMIN"}
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[pathname]} // Tự động active menu dựa theo URL hiện tại
          items={menuItems}
        />
      </Sider>

      <Layout>
        {/* THANH HEADER TRÊN CÙNG */}
        <Header
          style={{
            padding: 0,
            background: colorBgContainer,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingRight: "24px",
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: "16px",
              width: 64,
              height: 64,
            }}
          />

          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            arrow
          >
            <div
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Avatar
                src={user.avatar}
                icon={!user.avatar && <UserOutlined />}
              />
              <span style={{ fontWeight: 500 }}>{user.fullName}</span>
            </div>
          </Dropdown>
        </Header>

        {/* NỘI DUNG TRANG CON SẼ CHÈN VÀO ĐÂY */}
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: "initial",
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
