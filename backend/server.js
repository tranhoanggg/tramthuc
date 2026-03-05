const express = require("express");
const cors = require("cors");
const db = require("./src/config/db.js");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// API lấy toàn bộ danh sách bộ sưu tập đang active
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

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại port ${PORT}`);
});
