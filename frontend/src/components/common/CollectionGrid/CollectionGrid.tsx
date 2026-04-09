"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./CollectionGrid.module.css";

interface Collection {
  id: number;
  title: string;
  subtitle: string;
  image_url: string;
  target_link: string;
}

const CollectionGrid = () => {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000";

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
    return <div className={styles["loading-text"]}>Đang tải bộ sưu tập...</div>;

  const visibleCollections = isExpanded ? collections : collections.slice(0, 4);

  return (
    <div className={styles["collection-container"]}>
      <div className={styles["collection-header"]}>
        <h2>Bộ sưu tập</h2>
        <div
          className={styles["view-all"]}
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span>{isExpanded ? "Ẩn bớt" : "Xem tất cả"}</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{
              transform: isExpanded ? "rotate(-90deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </div>

      <div className={styles["collection-grid"]}>
        {visibleCollections.map((item) => (
          <div
            key={item.id}
            className={styles["collection-card"]}
            onClick={() => {
              // Mã hóa tên Collection để truyền sang trang kia làm Tiêu đề
              const titleQuery = `collectionTitle=${encodeURIComponent(item.title)}`;

              if (item.target_link) {
                // Kiểm tra xem link có sẵn dấu ? chưa để nối chuỗi cho đúng
                const separator = item.target_link.includes("?") ? "&" : "?";
                router.push(`${item.target_link}${separator}${titleQuery}`);
              } else {
                // Dự phòng nếu không có target_link
                router.push(
                  `/search?q=${encodeURIComponent(item.title)}&${titleQuery}`,
                );
              }
            }}
            title={`Khám phá: ${item.title}`}
          >
            <div className={styles["collection-image-wrapper"]}>
              <img
                src={item.image_url}
                alt={item.title}
                className={styles["collection-image"]}
              />
            </div>
            <div className={styles["collection-info"]}>
              <h3 className={styles["collection-title"]}>{item.title}</h3>
              <p className={styles["collection-subtitle"]}>{item.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CollectionGrid;
