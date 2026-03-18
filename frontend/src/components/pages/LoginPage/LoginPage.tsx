"use client";

import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import styles from "./LoginPage.module.css";

export default function LoginPageUI() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_AUTH_API_URL ||
    "https://tramthuc-authservice.onrender.com";

  // LOGIC ĐĂNG NHẬP TRUYỀN THỐNG
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, password }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // Lưu token vào LocalStorage để dùng cho các API sau này
        localStorage.setItem("tramthuc_token", data.token);
        alert("Đăng nhập thành công!");
        router.push("/"); // Chuyển về trang chủ
      } else {
        setErrorMessage("Tài khoản hoặc mật khẩu không chính xác!");
      }
    } catch (error) {
      setErrorMessage("Lỗi kết nối máy chủ!");
    } finally {
      setIsLoading(false);
    }
  };

  // LOGIC ĐĂNG NHẬP GOOGLE
  const handleGoogleSuccess = async (credentialResponse: any) => {
    setErrorMessage("");
    setIsLoading(true);

    const idToken = credentialResponse.credential;

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      // Đọc response dạng text trước để dễ bóc tách lỗi
      const textData = await response.text();

      if (response.ok) {
        const data = JSON.parse(textData);
        localStorage.setItem("tramthuc_token", data.token);
        alert("Đăng nhập bằng Google thành công!");
        router.push("/");
      } else {
        let errorMsg = textData;
        try {
          // Thử bóc tách JSON xem Backend có bọc lỗi vào object không
          const parsedData = JSON.parse(textData);
          if (parsedData && parsedData.message) {
            errorMsg = parsedData.message; // Trích xuất đúng cái lõi
          } else if (typeof parsedData === "string") {
            errorMsg = parsedData; // Nếu là JSON String thì bước này sẽ lột sạch ngoặc kép dư thừa
          }
        } catch (e) {
          // Nếu không phải JSON (là Text thuần) thì cứ giữ nguyên textData
        }

        // KIỂM TRA CỜ BÁO LỖI TỪ BACKEND
        if (errorMsg.includes("GOOGLE_NOT_REGISTERED")) {
          // Tách chuỗi: [0]=CỜ, [1]=Email, [2]=Tên
          const parts = errorMsg.split("|");
          const extractedEmail = parts[1] || "";

          // VŨ KHÍ HẠNG NẶNG: Lột sạch tuyệt đối mọi dấu ngoặc kép (") và ngoặc nhọn (})
          const extractedName = (parts[2] || "").replace(/["}]+/g, "");

          // Đẩy sang trang đăng ký, truyền cả email và name lên thanh URL
          router.push(
            `/register?email=${encodeURIComponent(extractedEmail)}&name=${encodeURIComponent(extractedName)}`,
          );
        } else {
          setErrorMessage(errorMsg || "Xác thực Google thất bại trên máy chủ.");
        }
      }
    } catch (error) {
      setErrorMessage("Lỗi kết nối khi đăng nhập Google!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles["login-page-wrapper"]}>
      <div className={styles["login-container"]}>
        <h1 className={styles["login-title"]}>Đăng nhập</h1>

        {errorMessage && (
          <div
            style={{
              color: "red",
              backgroundColor: "#ffebee",
              padding: "10px",
              borderRadius: "4px",
              marginBottom: "15px",
              fontSize: "14px",
              textAlign: "center",
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Nút Đăng nhập Mạng xã hội / SĐT */}
        <div className={styles["social-buttons"]}>
          {/* NÚT GOOGLE CHÍNH CHỦ */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              marginBottom: "10px",
            }}
          >
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setErrorMessage("Đăng nhập Google thất bại!")}
              useOneTap // Bật tính năng tự động thả popup gợi ý tài khoản (cực xịn)
              width="400"
            />
          </div>

          <button
            className={`${styles["social-btn"]} ${styles["phone-btn"]}`}
            style={{ marginTop: "5px" }}
          >
            <div className={styles["icon-wrapper"]}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                <line x1="12" y1="18" x2="12.01" y2="18"></line>
              </svg>
            </div>
            <span>ĐĂNG NHẬP BẰNG SỐ ĐIỆN THOẠI</span>
          </button>
        </div>

        <div className={styles["divider"]}>
          <span>Hoặc đăng nhập bằng tài khoản của bạn</span>
        </div>

        <form className={styles["login-form"]} onSubmit={handleLogin}>
          {/* ... (Các thẻ input Email và Password giữ nguyên như cũ của bạn) ... */}
          <div className={styles["input-group"]}>
            <input
              type="text"
              placeholder="Email hoặc Số điện thoại"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles["input-group"]}>
            <input
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className={styles["form-options"]}>
            <label className={styles["remember-me"]}>
              <input type="checkbox" />
              <span>Lưu thông tin đăng nhập</span>
            </label>
            <a href="#" className={styles["forgot-password"]}>
              Quên mật khẩu?
            </a>
          </div>

          <button
            type="submit"
            className={styles["submit-btn"]}
            disabled={isLoading}
          >
            {isLoading ? "ĐANG XỬ LÝ..." : "ĐĂNG NHẬP"}
          </button>
        </form>

        <p className={styles["terms-text"]}>
          Bằng cách đăng nhập, bạn đồng ý với{" "}
          <a href="#">Chính sách quy định của Trạm Thức</a>
        </p>
      </div>
    </div>
  );
}
