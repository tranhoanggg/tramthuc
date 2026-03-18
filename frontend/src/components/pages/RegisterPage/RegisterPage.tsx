"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./RegisterPage.module.css";

export default function RegisterPageUI() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State dữ liệu Form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Nam");

  // LƯU TRỮ SỐ ĐIỆN THOẠI ĐÃ XÁC THỰC TỪ BÊN TRANG LOGIN
  const [verifiedPhone, setVerifiedPhone] = useState("");

  // State quản lý Popup và Trạng thái
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_AUTH_API_URL ||
    "https://tramthuc-authservice.onrender.com";

  useEffect(() => {
    const emailFromUrl = searchParams.get("email");
    const nameFromUrl = searchParams.get("name");
    const phoneFromUrl = searchParams.get("phone");

    if (emailFromUrl) {
      setEmail(emailFromUrl);
      setErrorMessage(
        "Tài khoản Google của bạn chưa được đăng ký. Vui lòng hoàn tất thông tin bên dưới!",
      );
    }
    if (nameFromUrl) {
      setFullName(nameFromUrl);
    }
    // HỨNG SĐT TỪ TRANG ĐĂNG NHẬP CHUYỂN QUA
    if (phoneFromUrl) {
      setPhoneNumber(phoneFromUrl);
      setVerifiedPhone(phoneFromUrl); // Đánh dấu đây là số "đã kiểm duyệt"
      setErrorMessage(
        "Số điện thoại của bạn chưa được đăng ký. Vui lòng hoàn tất thông tin bên dưới!",
      );
    }
  }, [searchParams]);

  // HÀM TIẾN HÀNH ĐĂNG KÝ TRỰC TIẾP (BỎ QUA POPUP OTP)
  const handleDirectRegister = async () => {
    setIsLoading(true);
    const payload = {
      fullName,
      dob,
      gender,
      password,
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      otp: "", // Bỏ trống OTP vì đã xác thực ở trang Login rồi
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.text();

      if (response.ok) {
        setSuccessMessage(
          "Đăng ký thành công! Đang chuyển hướng đến Đăng nhập...",
        );
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setErrorMessage(data || "Đăng ký thất bại. Vui lòng thử lại!");
      }
    } catch (error) {
      setErrorMessage("Lỗi kết nối máy chủ khi đăng ký!");
    } finally {
      setIsLoading(false);
    }
  };

  // XỬ LÝ KHI BẤM NÚT "ĐĂNG KÝ" TẠI FORM NGOÀI
  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email.trim() && !phoneNumber.trim()) {
      setErrorMessage("Vui lòng điền Email hoặc Số điện thoại để đăng ký!");
      return;
    }

    // LOGIC THÔNG MINH: KIỂM TRA XEM NGƯỜI DÙNG CÓ SỬA SĐT KHÔNG
    if (phoneNumber.trim() !== "" && phoneNumber.trim() === verifiedPhone) {
      // Nếu số hiện tại KHỚP với số đã xác nhận bên Login -> Cho qua luôn!
      handleDirectRegister();
      return;
    }

    // NẾU NGƯỜI DÙNG SỬA SĐT, HOẶC DÙNG EMAIL -> BẮT XÁC THỰC OTP NHƯ BÌNH THƯỜNG
    setIsLoading(true);
    const identifier = email.trim() ? email.trim() : phoneNumber.trim();

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const data = await response.text();
      if (response.ok) {
        setShowOtpModal(true); // Mở Popup yêu cầu OTP
      } else {
        setErrorMessage(data || "Lỗi gửi mã xác nhận. Vui lòng kiểm tra lại!");
      }
    } catch (error) {
      setErrorMessage("Lỗi kết nối máy chủ.");
    } finally {
      setIsLoading(false);
    }
  };

  // XỬ LÝ KHI BẤM "XÁC NHẬN" TRONG POPUP OTP (DÀNH CHO SĐT MỚI HOẶC EMAIL)
  const handleVerifyAndRegister = async () => {
    if (otp.length < 6) {
      alert("Vui lòng nhập đủ 6 số OTP!");
      return;
    }

    setIsLoading(true);
    const payload = {
      fullName,
      dob,
      gender,
      password,
      otp,
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.text();

      if (response.ok) {
        setShowOtpModal(false);
        setSuccessMessage("Đăng ký thành công! Đang chuyển hướng...");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        alert(data || "Mã xác nhận không đúng!");
      }
    } catch (error) {
      alert("Lỗi kết nối máy chủ!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles["register-page-wrapper"]}>
      <div className={styles["register-container"]}>
        <h1 className={styles["register-title"]}>Tạo tài khoản mới</h1>

        {errorMessage && (
          <div className={styles["error-alert"]}>{errorMessage}</div>
        )}
        {successMessage && (
          <div className={styles["success-alert"]}>{successMessage}</div>
        )}

        <form
          className={`${styles["register-form"]} ${showOtpModal ? styles["form-blurred"] : ""}`}
          onSubmit={handleInitialSubmit}
        >
          <div className={styles["input-group"]}>
            <input
              type="text"
              placeholder="Họ và tên"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={showOtpModal}
            />
          </div>

          <div className={styles["row-group"]}>
            <div className={styles["input-group"]} style={{ flex: 1 }}>
              <input
                type="date"
                title="Ngày sinh"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
                disabled={showOtpModal}
              />
            </div>
            <div className={styles["input-group"]} style={{ width: "120px" }}>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                disabled={showOtpModal}
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
          </div>

          <div className={styles["input-group"]}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={showOtpModal}
            />
          </div>

          <div className={styles["input-group"]}>
            {/* Người dùng vẫn có thể sửa SĐT ở đây */}
            <input
              type="tel"
              placeholder="Số điện thoại"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={showOtpModal}
            />
          </div>

          <div className={styles["input-group"]}>
            <input
              type="password"
              placeholder="Tạo mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={showOtpModal}
            />
          </div>

          <button
            type="submit"
            className={styles["submit-btn"]}
            disabled={isLoading || showOtpModal}
          >
            {isLoading && !showOtpModal ? "ĐANG XỬ LÝ..." : "ĐĂNG KÝ"}
          </button>
        </form>

        <div className={styles["login-redirect"]}>
          <span>Bạn đã có tài khoản? </span>
          <Link href="/login" className={styles["login-link"]}>
            Đăng nhập ngay
          </Link>
        </div>
      </div>

      {/* POPUP XÁC THỰC OTP (CHỈ HIỆN KHI NGƯỜI DÙNG DÙNG EMAIL HOẶC ĐỔI SĐT MỚI) */}
      {showOtpModal && (
        <div className={styles["modal-overlay"]}>
          <div className={styles["modal-content"]}>
            <button
              className={styles["close-modal-btn"]}
              onClick={() => setShowOtpModal(false)}
            >
              ✕
            </button>
            <div className={styles["modal-icon"]}>
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0f83c9"
                strokeWidth="1.5"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>
            <h2 className={styles["modal-title"]}>Xác thực tài khoản</h2>
            <p className={styles["modal-desc"]}>
              Chúng tôi vừa gửi một mã gồm 6 chữ số đến <br />
              <strong>{email.trim() ? email : phoneNumber}</strong>. <br />
              Vui lòng kiểm tra và nhập mã.
            </p>
            <input
              type="text"
              className={styles["otp-input-large"]}
              placeholder="Nhập mã 6 số"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              autoFocus
            />
            <button
              className={styles["verify-btn"]}
              onClick={handleVerifyAndRegister}
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? "ĐANG XÁC THỰC..." : "XÁC NHẬN"}
            </button>
            <p className={styles["resend-text"]}>
              Không nhận được mã?{" "}
              <span onClick={handleInitialSubmit}>Gửi lại</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
