"use client";

import React, { useState, useEffect, useRef } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import styles from "./LoginPage.module.css";

import { useAuth } from "@/context/AuthContext";
import { useCartStore } from "@/store/useCartStore";

export default function LoginPageUI() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // STATE: LƯU THÔNG TIN ĐĂNG NHẬP (REMEMBER ME)
  const [rememberMe, setRememberMe] = useState(false);

  // STATE: POPUP ĐĂNG NHẬP BẰNG SĐT
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneStep, setPhoneStep] = useState(1);
  const [phoneError, setPhoneError] = useState("");

  // STATE: POPUP QUÊN MẬT KHẨU (ĐÃ TÁCH LÀM 3 BƯỚC)
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Nhập Email/SĐT | 2: Nhập OTP | 3: Đặt Mật khẩu mới
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotError, setForgotError] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const [googleBtnWidth, setGoogleBtnWidth] = useState("400");
  const { loginContext } = useAuth();

  const apiUrl =
    process.env.NEXT_PUBLIC_AUTH_API_URL ||
    "https://tramthuc-authservice.onrender.com";

  // TỰ ĐỘNG ĐIỀN THÔNG TIN NẾU LẦN TRƯỚC CÓ TÍCH "LƯU THÔNG TIN"
  useEffect(() => {
    const savedIdentifier = localStorage.getItem("tramthuc_remembered_id");
    if (savedIdentifier) {
      setEmail(savedIdentifier);
      setRememberMe(true);
    }
  }, []);

  // --- LOGIC ĐĂNG NHẬP TRUYỀN THỐNG ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, password }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        loginContext(data.data.token);

        // LOGIC REMEMBER ME: Lưu hoặc Xóa id dựa vào Checkbox
        if (rememberMe) {
          localStorage.setItem("tramthuc_remembered_id", email);
        } else {
          localStorage.removeItem("tramthuc_remembered_id");
        }

        console.log("Bắt đầu đồng bộ giỏ hàng lên Server...");
        await useCartStore.getState().syncWithServer();

        alert("Đăng nhập thành công!");
        router.push("/");
      } else {
        setErrorMessage("Tài khoản hoặc mật khẩu không chính xác!");
      }
    } catch (error) {
      setErrorMessage("Lỗi kết nối máy chủ!");
    } finally {
      setIsLoading(false);
    }
  };

  // --- LOGIC ĐĂNG NHẬP GOOGLE ---
  const handleGoogleSuccess = async (credentialResponse: any) => {
    setErrorMessage("");
    setIsLoading(true);
    const idToken = credentialResponse.credential;

    try {
      const response = await fetch(`${apiUrl}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const textData = await response.text();

      if (response.ok) {
        const data = JSON.parse(textData);
        loginContext(data.data.token);

        console.log("Bắt đầu đồng bộ giỏ hàng lên Server...");
        await useCartStore.getState().syncWithServer();

        alert("Đăng nhập bằng Google thành công!");
        router.push("/");
      } else {
        let errorMsg = textData;
        try {
          const parsedData = JSON.parse(textData);
          if (parsedData && parsedData.message) errorMsg = parsedData.message;
          else if (typeof parsedData === "string") errorMsg = parsedData;
        } catch (e) {}

        if (errorMsg.includes("GOOGLE_NOT_REGISTERED")) {
          const parts = errorMsg.split("|");
          const extractedEmail = parts[1] || "";
          const extractedName = (parts[2] || "").replace(/["}]+/g, "");
          router.push(
            `/register?email=${encodeURIComponent(extractedEmail)}&name=${encodeURIComponent(extractedName)}`,
          );
        } else {
          setErrorMessage(errorMsg || "Xác thực Google thất bại.");
        }
      }
    } catch (error) {
      setErrorMessage("Lỗi kết nối khi đăng nhập Google!");
    } finally {
      setIsLoading(false);
    }
  };

  // --- LOGIC ĐĂNG NHẬP SĐT (OTP) ---
  const handleSendPhoneOtp = async () => {
    setPhoneError("");
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: phoneInput }),
      });
      if (response.ok) {
        setPhoneStep(2);
      } else {
        setPhoneError((await response.text()) || "Lỗi gửi mã OTP.");
      }
    } catch (error) {
      setPhoneError("Lỗi kết nối máy chủ.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    setPhoneError("");
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/auth/login-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: phoneInput, otp: phoneOtp }),
      });
      const textData = await response.text();

      if (response.ok) {
        const data = JSON.parse(textData);
        loginContext(data.data.token);

        console.log("Bắt đầu đồng bộ giỏ hàng lên Server...");
        await useCartStore.getState().syncWithServer();

        alert("Đăng nhập thành công!");
        router.push("/");
      } else {
        if (textData.includes("PHONE_NOT_REGISTERED")) {
          router.push(`/register?phone=${encodeURIComponent(phoneInput)}`);
        } else {
          setPhoneError(textData || "Mã OTP không hợp lệ.");
        }
      }
    } catch (error) {
      setPhoneError("Lỗi kết nối máy chủ.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- LOGIC QUÊN MẬT KHẨU ---
  // Bước 1: Kiểm tra tài khoản & Gửi OTP
  const handleForgotSendOtp = async () => {
    setForgotError("");
    setIsLoading(true);
    try {
      const verifyRes = await fetch(`${apiUrl}/api/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: forgotIdentifier }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyData.exists) {
        setForgotError("Tài khoản không tồn tại trên hệ thống!");
        setIsLoading(false);
        return;
      }

      const otpRes = await fetch(`${apiUrl}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: forgotIdentifier }),
      });

      if (otpRes.ok) {
        setForgotStep(2); // Chuyển sang màn hình Nhập OTP
      } else {
        setForgotError((await otpRes.text()) || "Lỗi gửi mã OTP.");
      }
    } catch (error) {
      setForgotError("Lỗi kết nối máy chủ.");
    } finally {
      setIsLoading(false);
    }
  };

  // Bước 3: Đổi mật khẩu
  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setForgotError("Mật khẩu xác nhận không khớp!");
      return;
    }
    setForgotError("");
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: forgotIdentifier,
          otp: forgotOtp,
          newPassword: newPassword,
        }),
      });

      if (response.ok) {
        alert("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
        setShowForgotModal(false);
        setEmail(forgotIdentifier);
        setPassword("");
      } else {
        const errorText = await response.text();
        setForgotError(errorText || "Mã OTP không hợp lệ!");
        // Nếu Backend báo lỗi OTP sai, đẩy lùi về Bước 2 để nhập lại OTP
        if (errorText.includes("OTP")) {
          setForgotStep(2);
        }
      }
    } catch (error) {
      setForgotError("Lỗi kết nối máy chủ.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const currentWidth = containerRef.current.offsetWidth;
        const finalWidth = currentWidth > 400 ? 400 : currentWidth;
        setGoogleBtnWidth(String(finalWidth));
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

        <div className={styles["social-buttons"]} ref={containerRef}>
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
              useOneTap
              width={googleBtnWidth}
            />
          </div>

          <button
            type="button"
            className={`${styles["social-btn"]} ${styles["phone-btn"]}`}
            style={{ marginTop: "5px", width: "100%", maxWidth: "400px" }}
            onClick={() => {
              setShowPhoneModal(true);
              setPhoneStep(1);
              setPhoneOtp("");
              setPhoneError("");
            }}
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
              {/* LIÊN KẾT STATE VỚI CHECKBOX REMEMBER ME */}
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Lưu thông tin đăng nhập</span>
            </label>
            <span
              className={styles["forgot-password"]}
              style={{
                cursor: "pointer",
                color: "#0f83c9",
                fontWeight: "bold",
              }}
              onClick={() => {
                setShowForgotModal(true);
                setForgotStep(1);
                setForgotIdentifier("");
                setForgotError("");
              }}
            >
              Quên mật khẩu?
            </span>
          </div>
          <button
            type="submit"
            className={styles["submit-btn"]}
            disabled={isLoading}
          >
            {isLoading ? "ĐANG XỬ LÝ..." : "ĐĂNG NHẬP"}
          </button>
        </form>
      </div>

      {/* --- POPUP ĐĂNG NHẬP BẰNG SĐT --- */}
      {showPhoneModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "10px",
              width: "400px",
              maxWidth: "90%",
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowPhoneModal(false)}
              style={{
                position: "absolute",
                top: "10px",
                right: "15px",
                background: "none",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
            <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
              Đăng nhập OTP
            </h2>
            {phoneError && (
              <p
                style={{
                  color: "red",
                  textAlign: "center",
                  fontSize: "14px",
                  marginBottom: "10px",
                }}
              >
                {phoneError}
              </p>
            )}
            {phoneStep === 1 ? (
              <>
                <input
                  type="text"
                  placeholder="Nhập số điện thoại của bạn"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    marginBottom: "15px",
                  }}
                />
                <button
                  onClick={handleSendPhoneOtp}
                  disabled={isLoading || !phoneInput}
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: "#0f83c9",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {isLoading ? "ĐANG GỬI..." : "GỬI MÃ OTP"}
                </button>
              </>
            ) : (
              <>
                <p
                  style={{
                    textAlign: "center",
                    fontSize: "14px",
                    marginBottom: "15px",
                  }}
                >
                  Mã đã được gửi đến <strong>{phoneInput}</strong>
                </p>
                <input
                  type="text"
                  placeholder="Nhập mã 6 số"
                  maxLength={6}
                  value={phoneOtp}
                  onChange={(e) => setPhoneOtp(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    marginBottom: "15px",
                    textAlign: "center",
                    fontSize: "18px",
                    letterSpacing: "2px",
                  }}
                />
                <button
                  onClick={handleVerifyPhoneOtp}
                  disabled={isLoading || phoneOtp.length !== 6}
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: "#0f83c9",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {isLoading ? "ĐANG XÁC THỰC..." : "XÁC NHẬN"}
                </button>
                <p
                  style={{
                    textAlign: "center",
                    marginTop: "15px",
                    fontSize: "14px",
                    color: "#0f83c9",
                    cursor: "pointer",
                  }}
                  onClick={() => setPhoneStep(1)}
                >
                  Sửa số điện thoại
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* --- POPUP QUÊN MẬT KHẨU (3 BƯỚC MƯỢT MÀ) --- */}
      {showForgotModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "10px",
              width: "400px",
              maxWidth: "90%",
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowForgotModal(false)}
              style={{
                position: "absolute",
                top: "10px",
                right: "15px",
                background: "none",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
            <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
              Khôi phục mật khẩu
            </h2>

            {forgotError && (
              <p
                style={{
                  color: "red",
                  textAlign: "center",
                  fontSize: "14px",
                  marginBottom: "15px",
                }}
              >
                {forgotError}
              </p>
            )}

            {forgotStep === 1 && (
              <>
                <p
                  style={{
                    fontSize: "14px",
                    marginBottom: "10px",
                    color: "#555",
                  }}
                >
                  Vui lòng nhập Email hoặc Số điện thoại đã đăng ký để nhận mã
                  xác nhận.
                </p>
                <input
                  type="text"
                  placeholder="Email hoặc Số điện thoại"
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    marginBottom: "15px",
                  }}
                />
                <button
                  onClick={handleForgotSendOtp}
                  disabled={isLoading || !forgotIdentifier}
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: "#0f83c9",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {isLoading ? "ĐANG TÌM KIẾM..." : "TIẾP TỤC"}
                </button>
              </>
            )}

            {forgotStep === 2 && (
              <>
                <p
                  style={{
                    fontSize: "14px",
                    marginBottom: "15px",
                    textAlign: "center",
                  }}
                >
                  Mã xác nhận đã được gửi đến{" "}
                  <strong>{forgotIdentifier}</strong>
                </p>
                <input
                  type="text"
                  placeholder="Nhập mã OTP 6 số"
                  maxLength={6}
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    marginBottom: "15px",
                    textAlign: "center",
                    fontSize: "18px",
                    letterSpacing: "2px",
                  }}
                  autoFocus
                />

                <button
                  onClick={() => setForgotStep(3)}
                  disabled={forgotOtp.length !== 6}
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: "#0f83c9",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  XÁC NHẬN MÃ
                </button>

                {/* --- ĐÃ NÂNG CẤP: TÁCH LÀM 2 DÒNG RIÊNG BIỆT --- */}
                <div
                  style={{
                    textAlign: "center",
                    marginTop: "20px",
                    fontSize: "14px",
                  }}
                >
                  <p
                    style={{
                      color: "#0f83c9",
                      cursor: "pointer",
                      marginBottom: "10px",
                      fontWeight: "500",
                    }}
                    onClick={handleForgotSendOtp}
                  >
                    {isLoading ? "ĐANG GỬI LẠI..." : "Gửi lại mã xác nhận"}
                  </p>

                  <p
                    style={{
                      color: "#666",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                    onClick={() => setForgotStep(1)}
                  >
                    Đổi{" "}
                    {forgotIdentifier.includes("@") ? "Email" : "Số điện thoại"}
                  </p>
                </div>
              </>
            )}

            {forgotStep === 3 && (
              <>
                <p
                  style={{
                    fontSize: "14px",
                    marginBottom: "15px",
                    textAlign: "center",
                    color: "#28a745",
                    fontWeight: "bold",
                  }}
                >
                  Mã hợp lệ! Vui lòng đặt mật khẩu mới.
                </p>
                <input
                  type="password"
                  placeholder="Mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    marginBottom: "10px",
                  }}
                  autoFocus
                />
                <input
                  type="password"
                  placeholder="Xác nhận mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    marginBottom: "15px",
                  }}
                />

                {/* BƯỚC NÀY MỚI GỌI API ĐỂ ĐỔI MẬT KHẨU THỰC SỰ */}
                <button
                  onClick={handleResetPassword}
                  disabled={isLoading || !newPassword || !confirmPassword}
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: "#0f83c9",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {isLoading ? "ĐANG XỬ LÝ..." : "HOÀN TẤT ĐỔI MẬT KHẨU"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
