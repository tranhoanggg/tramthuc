"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import "./CollectionGrid.css";

// Định nghĩa kiểu dữ liệu cho Bộ sưu tập
interface Collection {
  id: number;
  title: string;
  subtitle: string;
  image_url: string;
  target_link: string;
}

const CollectionGrid = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    fetch(`${apiUrl}/api/collections`)
      .then((res) => res.json())
      .then((data) => {
        setCollections(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Lỗi fetch data:", err);
        setLoading(false);
      });
  }, []);

  if (loading)
    return <div className="loading-text">Đang tải bộ sưu tập...</div>;

  return (
    <div className="collection-container">
      {/* Header của cột phải */}
      <div className="collection-header">
        <h2>Bộ sưu tập</h2>
        <a href="#" className="view-all">
          Xem tất cả
        </a>
      </div>

      {/* Lưới chứa 4 ảnh */}
      <div className="collection-grid">
        {collections.map((item) => (
          <div key={item.id} className="collection-card">
            <div className="collection-image-wrapper">
              {/* Dùng thẻ img thường để dễ nhận link ảnh ngoài như Unsplash */}
              <img
                src={item.image_url}
                alt={item.title}
                className="collection-image"
              />
            </div>
            <div className="collection-info">
              <h3 className="collection-title">{item.title}</h3>
              <p className="collection-subtitle">{item.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CollectionGrid;
