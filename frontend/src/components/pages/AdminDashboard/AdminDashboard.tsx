"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout/AdminLayout";
import { Card, Col, Row, Statistic, Spin } from "antd";
import {
  DollarOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/context/AuthContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#c17a54", "#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function AdminDashboardPage() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    overview: {
      revenueToday: 0,
      revenueMonth: 0,
      pendingOrders: 0,
      totalUsers: 0,
    },
    charts: { revenueLast7Days: [], categorySales: [] },
  });

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "https://tramthuc-backend.onrender.com";

  useEffect(() => {
    const fetchStats = async () => {
      if (!user || !token) return;
      try {
        const res = await fetch(`${apiUrl}/api/admin/dashboard/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-User-Role": user.role || "",
          },
        });
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error("Lỗi lấy dữ liệu Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, token]);

  const formatVND = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);

  return (
    <AdminLayout>
      <h2 style={{ marginBottom: 24 }}>Tổng quan Hệ thống</h2>

      {loading ? (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* HÀNG 1: 4 THẺ THỐNG KÊ (CARDS) */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card
                bordered={false}
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
              >
                <Statistic
                  title="Doanh thu hôm nay"
                  value={stats.overview.revenueToday}
                  formatter={(val) => formatVND(Number(val))}
                  valueStyle={{ color: "#3f8600", fontWeight: "bold" }}
                  prefix={<DollarOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card
                bordered={false}
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
              >
                <Statistic
                  title="Đơn hàng chờ xử lý"
                  value={stats.overview.pendingOrders}
                  valueStyle={{
                    color:
                      stats.overview.pendingOrders > 0 ? "#cf1322" : "#333",
                    fontWeight: "bold",
                  }}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card
                bordered={false}
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
              >
                <Statistic
                  title="Tổng khách hàng"
                  value={stats.overview.totalUsers}
                  prefix={<UserOutlined />}
                  valueStyle={{ fontWeight: "bold" }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card
                bordered={false}
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
              >
                <Statistic
                  title="Doanh thu tháng này"
                  value={stats.overview.revenueMonth}
                  formatter={(val) => formatVND(Number(val))}
                  prefix={<ShoppingCartOutlined />}
                  valueStyle={{ color: "#096dd9", fontWeight: "bold" }}
                />
              </Card>
            </Col>
          </Row>

          {/* HÀNG 2: BIỂU ĐỒ */}
          <Row gutter={16}>
            <Col span={16}>
              <Card
                title="Doanh thu 7 ngày gần nhất"
                bordered={false}
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
              >
                <div style={{ height: 300, width: "100%" }}>
                  <ResponsiveContainer>
                    <LineChart
                      data={stats.charts.revenueLast7Days}
                      margin={{ top: 5, right: 20, bottom: 5, left: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={(val) => `${val / 1000}k`} />
                      <Tooltip
                        formatter={(val: any) => formatVND(Number(val || 0))}
                      />
                      <Line
                        type="monotone"
                        dataKey="daily_revenue"
                        name="Doanh thu"
                        stroke="#c17a54"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
            <Col span={8}>
              <Card
                title="Tỷ lệ món bán chạy"
                bordered={false}
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
              >
                <div style={{ height: 300, width: "100%" }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={stats.charts.categorySales}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.charts.categorySales.map(
                          (entry: any, index: number) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ),
                        )}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </AdminLayout>
  );
}
