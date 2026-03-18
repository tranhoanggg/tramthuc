"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./ProfilePage.module.css";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePageUI() {
  const router = useRouter();
  const { user, isAuthenticated, isLoadingAuth, updateAvatarContext } =
    useAuth();

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ===== CẤU HÌNH CLOUDINARY (THAY THÔNG TIN CỦA BẠN VÀO ĐÂY) =====
  // 1. Xem "Cloud Name" ở góc phải trên cùng Dashboard Cloudinary
  // 2. Tên Upload Preset (loại Unsigned) bạn vừa tạo ở mục Settings -> Upload
  const CLOUD_NAME = "doipopjgo";
  const UPLOAD_PRESET = "tramthuc_avatar";

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_AUTH_API_URL ||
    "https://tramthuc-authservice.onrender.com";

  // Bảo vệ route: Nếu chưa đăng nhập thì đẩy về trang login
  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoadingAuth, isAuthenticated, router]);

  // Hàm xử lý khi người dùng chọn file ảnh
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate dung lượng ảnh (< 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Vui lòng chọn ảnh có dung lượng nhỏ hơn 2MB!");
      return;
    }

    setIsUploading(true);
    try {
      // 1. ĐÓNG GÓI HÀNG & GỬI THẲNG LÊN CLOUDINARY
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!cloudinaryRes.ok) {
        throw new Error("Lỗi tải ảnh lên Cloudinary");
      }

      const cloudinaryData = await cloudinaryRes.json();
      const secureUrl = cloudinaryData.secure_url; // Đã lấy được link tuyệt mật!

      // 2. GỬI LINK ĐÓ XUỐNG SPRING BOOT ĐỂ LƯU VÀO DATABASE
      const token = localStorage.getItem("tramthuc_token");
      const backendRes = await fetch(`${API_BASE_URL}/api/auth/update-avatar`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatarUrl: secureUrl }),
      });

      if (backendRes.ok) {
        // 3. CẬP NHẬT GIAO DIỆN NAVBAR NGAY LẬP TỨC
        updateAvatarContext(secureUrl);
        alert("Tuyệt vời! Ảnh đại diện của bạn đã được cập nhật.");
      } else {
        alert("Lỗi khi lưu ảnh vào hệ thống Trạm Thức!");
      }
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra trong quá trình tải ảnh. Vui lòng thử lại!");
    } finally {
      setIsUploading(false);
      // Reset input để có thể chọn lại cùng 1 file
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    const words = name.trim().split(" ");
    return words[words.length - 1].charAt(0).toUpperCase();
  };

  if (isLoadingAuth || !user) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        Đang tải dữ liệu...
      </div>
    );
  }

  return (
    <div className={styles["profile-wrapper"]}>
      <h1 className={styles["profile-title"]}>Thông tin tài khoản</h1>

      <div className={styles["profile-container"]}>
        {/* CỘT TRÁI - KHU VỰC AVATAR & UPLOAD CLOUDINARY */}
        <div className={styles["avatar-section"]}>
          <div className={styles["avatar-wrapper"]}>
            {user.avatar ? (
              <img
                src={user.avatar}
                alt="Avatar"
                className={styles["avatar-img"]}
              />
            ) : (
              <div className={styles["avatar-fallback"]}>
                {getInitials(user.fullName)}
              </div>
            )}
          </div>

          {/* Nút giả lập để click mở cửa sổ chọn file */}
          <button
            className={styles["upload-btn"]}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? "ĐANG XỬ LÝ..." : "ĐỔI ẢNH ĐẠI DIỆN"}
          </button>

          {/* Thẻ input file ẩn đi */}
          <input
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          {isUploading && (
            <div className={styles["loading-text"]}>
              Đang tải ảnh lên hệ thống...
            </div>
          )}
        </div>

        {/* CỘT PHẢI - THÔNG TIN CHI TIẾT */}
        <div className={styles["info-section"]}>
          <div className={styles["info-grid"]}>
            <div className={`${styles["input-group"]} ${styles["full-width"]}`}>
              <label>Họ và tên</label>
              <input type="text" value={user.fullName || ""} disabled />
            </div>

            <div className={styles["input-group"]}>
              <label>Email</label>
              <input
                type="email"
                value={user.email || "Chưa cập nhật"}
                disabled
              />
            </div>

            <div className={styles["input-group"]}>
              <label>Số điện thoại</label>
              <input
                type="text"
                value={user.phoneNumber || "Chưa cập nhật"}
                disabled
              />
            </div>

            <div className={`${styles["input-group"]} ${styles["full-width"]}`}>
              <label>Vai trò hệ thống</label>
              <input
                type="text"
                value={
                  user.role === "ROLE_USER"
                    ? "Khách hàng thành viên"
                    : user.role
                }
                disabled
              />
            </div>

            <p
              style={{
                fontSize: "13px",
                color: "#888",
                gridColumn: "span 2",
                marginTop: "10px",
              }}
            >
              * Hiện tại thông tin cá nhân đang bị khóa. Nếu bạn muốn thay đổi
              thông tin, vui lòng liên hệ quản trị viên.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
