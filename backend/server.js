const express = require("express");
const cors = require("cors");
const db = require("./src/config/db.js");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

const queryAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

const isAdmin = (req, res, next) => {
  const userRole = req.headers["x-user-role"];

  if (userRole === "ROLE_ADMIN") {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Truy cập bị từ chối! Bạn không có quyền Quản trị viên.",
    });
  }
};

app.get("/api/collections", (req, res) => {
  const sql =
    "SELECT * FROM collections WHERE is_active = TRUE ORDER BY id DESC";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Lỗi khi lấy collections:", err);
      return res.status(500).json({ error: "Lỗi Server khi truy vấn dữ liệu" });
    }
    res.json(results);
  });
});

app.get("/api/products/best-sellers", (req, res) => {
  const sql =
    "SELECT * FROM products WHERE is_active = TRUE AND is_best_seller = TRUE ORDER BY sold_count DESC LIMIT 8";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Lỗi khi lấy best sellers:", err);
      return res
        .status(500)
        .json({ error: "Lỗi Server khi truy vấn dữ liệu sản phẩm" });
    }
    res.json(results);
  });
});

app.get("/api/products/category/:categoryName", (req, res) => {
  const categoryName = req.params.categoryName;
  const decodedCategory = decodeURIComponent(categoryName);

  const search = req.query.search;
  const sort = req.query.sort;

  let sql = "SELECT * FROM products WHERE is_active = TRUE AND category = ?";
  let params = [decodedCategory];

  if (search) {
    sql += " AND name LIKE ?";
    params.push(`%${search}%`);
  }

  if (sort === "price_asc") {
    sql += " ORDER BY price ASC";
  } else if (sort === "price_desc") {
    sql += " ORDER BY price DESC";
  } else if (sort === "best_selling") {
    sql += " ORDER BY sold_count DESC";
  } else {
    sql += " ORDER BY created_at DESC";
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("❌ Lỗi khi lấy sản phẩm theo danh mục:", err);
      return res
        .status(500)
        .json({ error: "Lỗi Server khi truy vấn danh mục" });
    }
    res.json(results);
  });
});

app.get("/api/products", (req, res) => {
  const search = req.query.search;
  const sort = req.query.sort;

  let sql = "SELECT * FROM products WHERE is_active = TRUE";
  let params = [];

  if (search) {
    sql += " AND name LIKE ?";
    params.push(`%${search}%`);
  }

  if (sort === "price_asc") {
    sql += " ORDER BY price ASC";
  } else if (sort === "price_desc") {
    sql += " ORDER BY price DESC";
  } else if (sort === "best_selling") {
    sql += " ORDER BY sold_count DESC";
  } else {
    sql += " ORDER BY created_at DESC";
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("❌ Lỗi khi lấy tất cả sản phẩm:", err);
      return res
        .status(500)
        .json({ error: "Lỗi Server khi truy vấn dữ liệu sản phẩm" });
    }
    res.json(results);
  });
});

app.get("/api/admin/dashboard/stats", isAdmin, async (req, res) => {
  try {
    // Chạy đồng thời 6 câu truy vấn để tối ưu tốc độ tối đa
    const [
      revenueTodayResult,
      revenueMonthResult,
      pendingOrdersResult,
      totalUsersResult,
      lineChartResult,
      pieChartResult,
    ] = await Promise.all([
      // 1. Doanh thu hôm nay (Chỉ tính đơn Đã thanh toán hoặc Đã giao xong)
      queryAsync(`
        SELECT SUM(total_amount) as total 
        FROM orders 
        WHERE (payment_status = 'PAID' OR delivery_status = 'COMPLETED') 
        AND DATE(created_at) = CURDATE()
      `),

      // 2. Doanh thu tháng này
      queryAsync(`
        SELECT SUM(total_amount) as total 
        FROM orders 
        WHERE (payment_status = 'PAID' OR delivery_status = 'COMPLETED') 
        AND MONTH(created_at) = MONTH(CURDATE()) 
        AND YEAR(created_at) = YEAR(CURDATE())
      `),

      // 3. Số đơn hàng chờ xử lý (Chữ đỏ báo động)
      queryAsync(`
        SELECT COUNT(*) as count 
        FROM orders 
        WHERE delivery_status = 'CREATED'
      `),

      // 4. Tổng số khách hàng (Lấy từ bảng users)
      queryAsync(`
        SELECT COUNT(*) as count 
        FROM users 
        WHERE role = 'ROLE_USER'
      `),

      // 5. DATA BIỂU ĐỒ ĐƯỜNG: Doanh thu 7 ngày gần nhất
      queryAsync(`
        SELECT DATE_FORMAT(created_at, '%d/%m') as date, SUM(total_amount) as daily_revenue
        FROM orders
        WHERE (payment_status = 'PAID' OR delivery_status = 'COMPLETED')
          AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) ASC
      `),

      // 6. DATA BIỂU ĐỒ TRÒN: Tỷ lệ món bán chạy theo Category
      // Tận dụng luôn cột sold_count của bảng products cho chính xác và nhanh
      queryAsync(`
        SELECT category as name, SUM(sold_count) as value 
        FROM products 
        GROUP BY category
      `),
    ]);

    // Trả về dữ liệu đã được format gọn gàng cho Frontend
    res.json({
      success: true,
      data: {
        overview: {
          revenueToday: revenueTodayResult[0]?.total || 0,
          revenueMonth: revenueMonthResult[0]?.total || 0,
          pendingOrders: pendingOrdersResult[0]?.count || 0,
          totalUsers: totalUsersResult[0]?.count || 0,
        },
        charts: {
          revenueLast7Days: lineChartResult, // Array: [{date: "01/04", daily_revenue: 150000}, ...]
          categorySales: pieChartResult, // Array: [{name: "Cà phê", value: 120}, ...]
        },
      },
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy dữ liệu Dashboard:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi máy chủ khi tải thống kê" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại port ${PORT}`);
});
