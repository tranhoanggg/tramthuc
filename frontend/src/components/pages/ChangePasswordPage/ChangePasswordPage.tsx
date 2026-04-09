"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./ChangePasswordPage.module.css";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuth();

  const apiUrl =
    process.env.NEXT_PUBLIC_AUTH_API_URL ||
    "https://tramthuc-authservice.onrender.com";

  // --- STATE BẢO MẬT & POPUP ---
  const [isVerified, setIsVerified] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [step, setStep] = useState<"SELECT_METHOD" | "ENTER_OTP">(
    "SELECT_METHOD",
  );
  const [sendMethod, setSendMethod] = useState<"email" | "phone" | null>(null);
  const [otp, setOtp] = useState("");
  const [isProcessingOtp, setIsProcessingOtp] = useState(false);

  // --- STATE FORM ĐỔI MẬT KHẨU ---
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // HÀM BẢO VỆ: Vét token từ LocalStorage nếu Context bị trễ
  const getSafeToken = () => {
    if (token) return token;
    if (typeof window !== "undefined") {
      return localStorage.getItem("tramthuc_token") || "";
    }
    return "";
  };

  useEffect(() => {
    if (isAuthenticated === false) {
      router.push("/");
      return;
    }

    const verifiedStatus = sessionStorage.getItem("pwd_verified");
    if (verifiedStatus === "true") {
      setIsVerified(true);
    } else if (user) {
      setShowPopup(true);
      if (user.email && user.phoneNumber) {
        setSendMethod("email");
      } else if (user.email) {
        setSendMethod("email");
      } else if (user.phoneNumber) {
        setSendMethod("phone");
      }
    }
  }, [user, isAuthenticated, router]);

  const getIdentifier = () => {
    return sendMethod === "email" ? user?.email : user?.phoneNumber;
  };

  const handleSendOtp = async () => {
    const identifier = getIdentifier();
    if (!identifier) return;

    setIsProcessingOtp(true);
    try {
      const res = await fetch(`${apiUrl}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep("ENTER_OTP");
        alert(data.message || "Đã gửi mã xác nhận!");
      } else {
        alert(data.message || "Lỗi gửi mã. Vui lòng thử lại!");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ!");
    } finally {
      setIsProcessingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return;
    setIsProcessingOtp(true);
    try {
      const res = await fetch(`${apiUrl}/api/auth/verify-otp-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // SỬ DỤNG GETSAFETOKEN() Ở ĐÂY
          Authorization: `Bearer ${getSafeToken()}`,
        },
        body: JSON.stringify({ identifier: getIdentifier(), otp }),
      });
      const data = await res.json();

      if (res.ok) {
        sessionStorage.setItem("pwd_verified", "true");
        setIsVerified(true);
        setShowPopup(false);
      } else {
        alert(data.message || "Mã OTP không đúng!");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ!");
    } finally {
      setIsProcessingOtp(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (passwords.newPassword.length < 6) {
      return setErrorMsg("Mật khẩu mới phải có ít nhất 6 ký tự!");
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      return setErrorMsg("Mật khẩu xác nhận không khớp!");
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          // SỬ DỤNG GETSAFETOKEN() Ở ĐÂY
          Authorization: `Bearer ${getSafeToken()}`,
        },
        body: JSON.stringify({
          oldPassword: passwords.oldPassword,
          newPassword: passwords.newPassword,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        alert("Đổi mật khẩu thành công!");
        router.push("/profile");
      } else {
        setErrorMsg(data.message || "Lỗi đổi mật khẩu!");
      }
    } catch (error) {
      setErrorMsg("Lỗi kết nối máy chủ!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... (Phần return JSX giữ nguyên như cũ)
  // (Chỉ copy lại đầy đủ để bạn dễ paste)
  if (!user) return <div className={styles.container}>Đang tải...</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Đổi mật khẩu bảo mật</h1>

      {isVerified && (
        <div className={styles.card}>
          <form onSubmit={handleChangePassword}>
            {errorMsg && <span className={styles.errorText}>* {errorMsg}</span>}

            <div className={styles.formGroup}>
              <label>Mật khẩu hiện tại</label>
              <input
                type="password"
                className={styles.input}
                placeholder="Nhập mật khẩu đang dùng"
                value={passwords.oldPassword}
                onChange={(e) =>
                  setPasswords({ ...passwords, oldPassword: e.target.value })
                }
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Mật khẩu mới</label>
              <input
                type="password"
                className={styles.input}
                placeholder="Ít nhất 6 ký tự"
                value={passwords.newPassword}
                onChange={(e) =>
                  setPasswords({ ...passwords, newPassword: e.target.value })
                }
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Xác nhận mật khẩu mới</label>
              <input
                type="password"
                className={styles.input}
                placeholder="Nhập lại mật khẩu mới"
                value={passwords.confirmPassword}
                onChange={(e) =>
                  setPasswords({
                    ...passwords,
                    confirmPassword: e.target.value,
                  })
                }
                required
              />
            </div>

            <button
              type="submit"
              className={styles.btnSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "ĐANG XỬ LÝ..." : "CẬP NHẬT MẬT KHẨU"}
            </button>
          </form>
        </div>
      )}

      {showPopup && (
        <div className={styles.overlay}>
          <div className={styles.popup}>
            <h2 className={styles.popupTitle}>Xác minh danh tính</h2>

            {step === "SELECT_METHOD" ? (
              <>
                <p className={styles.popupDesc}>
                  Để đảm bảo an toàn, vui lòng chọn phương thức nhận mã xác nhận
                  (OTP) trước khi đổi mật khẩu.
                </p>

                <div className={styles.radioGroup}>
                  {user.email && (
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        checked={sendMethod === "email"}
                        onChange={() => setSendMethod("email")}
                        disabled={!user.email || !user.phoneNumber}
                      />
                      Gửi qua Email ({user.email})
                    </label>
                  )}
                  {user.phoneNumber && (
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        checked={sendMethod === "phone"}
                        onChange={() => setSendMethod("phone")}
                        disabled={!user.email || !user.phoneNumber}
                      />
                      Gửi qua SĐT ({user.phoneNumber})
                    </label>
                  )}
                </div>

                <button
                  className={styles.btnSendOtp}
                  onClick={handleSendOtp}
                  disabled={isProcessingOtp}
                >
                  {isProcessingOtp ? "Đang gửi..." : "GỬI MÃ XÁC NHẬN"}
                </button>
              </>
            ) : (
              <div className={styles.otpInputGroup}>
                <p className={styles.popupDesc}>
                  Mã xác nhận gồm 6 chữ số đã được gửi tới{" "}
                  <strong>{getIdentifier()}</strong>.
                </p>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Nhập mã OTP..."
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  style={{
                    textAlign: "center",
                    fontSize: "18px",
                    letterSpacing: "5px",
                  }}
                />
                <button
                  className={styles.btnSubmit}
                  onClick={handleVerifyOtp}
                  disabled={isProcessingOtp || otp.length < 6}
                >
                  {isProcessingOtp ? "Đang kiểm tra..." : "XÁC NHẬN"}
                </button>
              </div>
            )}

            <button className={styles.cancelBtn} onClick={() => router.back()}>
              Hủy và Quay lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
