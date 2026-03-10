const express = require("express");
const cors = require("cors");
const db = require("./src/config/db.js");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại port ${PORT}`);
});
