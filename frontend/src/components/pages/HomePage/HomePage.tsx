"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./HomePage.module.css";
import { useAuth } from "@/context/AuthContext";
import { useCartStore } from "@/store/useCartStore";
import CollectionGrid from "@/components/common/CollectionGrid/CollectionGrid";
import BestSellers from "@/components/common/BestSellers/BestSellers";
import BackToTop from "@/components/common/BackToTop/BackToTop";

const fallbackSuggestions = [
  {
    productId: 1,
    name: "Cà phê Muối",
    price: 35000,
    imageUrl:
      "https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=400",
  },
  {
    productId: 2,
    name: "Trà Oolong Sen Vàng",
    price: 45000,
    imageUrl:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=400",
  },
  {
    productId: 3,
    name: "Bánh Tiramisu",
    price: 45000,
    imageUrl:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=400",
  },
  {
    productId: 4,
    name: "Bánh Tráng Trộn",
    price: 25000,
    imageUrl:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=400",
  },
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { addToCart } = useCartStore();
  const [aiSuggestions, setAiSuggestions] =
    useState<any[]>(fallbackSuggestions);
  const [timeLabel, setTimeLabel] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Slider state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Logic tính toán tiêu đề theo giờ
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) setTimeLabel("buổi sáng tỉnh táo");
    else if (hour >= 11 && hour < 13) setTimeLabel("buổi trưa nhẹ nhàng");
    else if (hour >= 13 && hour < 18) setTimeLabel("buổi chiều năng động");
    else if (hour >= 18 && hour < 24) setTimeLabel("buổi tối thảnh thơi");
    else setTimeLabel("");
  }, []);

  // 2. Gọi AI gợi ý 4 món
  useEffect(() => {
    const fetchHomeSuggestions = async () => {
      if (!timeLabel) return;
      setIsLoadingAI(true);
      try {
        const response = await fetch("/api/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ context: "home", timeLabel }),
        });
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            setAiSuggestions(data.slice(0, 4));
          }
        }
      } catch (error) {
        console.error("Lỗi AI gợi ý:", error);
      } finally {
        setIsLoadingAI(false);
      }
    };
    fetchHomeSuggestions();
  }, [timeLabel]);

  const brandSlides = [
    {
      id: 1,
      img: "https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=600",
      title: "Đánh thức năng lượng của bạn...",
    },
    {
      id: 2,
      img: "https://simexcodl.com.vn/wp-content/uploads/2023/11/ca-phe-rang-xay-loai-nao-ngon-8.jpg",
      title: "Hương vị rang xay mộc mạc...",
    },
    {
      id: 3,
      img: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600",
      title: "Góc nhỏ yên bình giữa phố thị...",
    },
    {
      id: 4,
      img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=600",
      title: "Kết nối tâm hồn đồng điệu...",
    },
  ];

  // 3. Auto-play slider
  const goToSlide = (index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const nextSlide = () => {
    goToSlide((currentSlide + 1) % brandSlides.length);
  };

  useEffect(() => {
    autoPlayRef.current = setInterval(nextSlide, 4000);
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [currentSlide, isAnimating]);

  return (
    <main className={styles["home-wrapper"]}>
      <div className={styles["home-background"]}></div>

      <div className={styles["home-container"]}>
        {/* CỘT TRÁI */}
        <div className={styles["left-column"]}>
          {/* 1. Tiêu đề: Xin chào */}
          <h1 className={styles["left-title"]}>
            Xin chào
            {isAuthenticated && user?.fullName ? `, ${user.fullName}` : ""}!
          </h1>

          <div className={`${styles.mobile} ${styles["address-delivery"]}`}>
            <span>Chọn địa chỉ giao hàng</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>

          <div className={styles["search-box"]}>
            <input type="text" placeholder="Tìm đồ uống, món ăn nhẹ..." />
            <button>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </div>

          {/* 2. Gợi ý thông minh (2x2) */}
          {timeLabel && (
            <div className={styles["ai-section"]}>
              <h2 className={styles["ai-title"]}>
                Gợi ý cho{" "}
                <span className={styles["highlight"]}>{timeLabel}</span>
              </h2>
              <div className={styles["ai-grid"]}>
                {isLoadingAI ? (
                  <div className={styles["loading-text"]}>Đang chọn món...</div>
                ) : (
                  aiSuggestions.map((item, idx) => (
                    <div key={idx} className={styles["ai-item"]}>
                      <img src={item.imageUrl} alt={item.name} />
                      <div className={styles["ai-info"]}>
                        <p className={styles["ai-name"]}>{item.name}</p>
                        <p className={styles["ai-price"]}>
                          {item.price.toLocaleString()} ₫
                        </p>
                      </div>
                      <button
                        onClick={() => addToCart({ ...item, quantity: 1 })}
                      >
                        +
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 3. Brand Slider */}
          <div className={styles["brand-slider"]}>
            <div className={styles["slider-track"]}>
              {brandSlides.map((slide, idx) => (
                <div
                  key={slide.id}
                  className={`${styles["slide-box"]} ${
                    idx === currentSlide ? styles["slide-active"] : ""
                  }`}
                >
                  <img src={slide.img} alt={slide.title} />
                  <div className={styles["slide-overlay"]}>
                    <p>{slide.title}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Dot indicators */}
            <div className={styles["slider-dots"]}>
              {brandSlides.map((_, idx) => (
                <button
                  key={idx}
                  className={`${styles["dot"]} ${
                    idx === currentSlide ? styles["dot-active"] : ""
                  }`}
                  onClick={() => goToSlide(idx)}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI */}
        <div className={styles["right-column"]}>
          <div className={styles["address-delivery"]}>
            <span>Chọn địa chỉ giao hàng</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
          <CollectionGrid />
          <BestSellers />
        </div>
      </div>
      <BackToTop />
    </main>
  );
}
