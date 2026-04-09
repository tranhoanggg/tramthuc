"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./ProfilePage.module.css";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePageUI() {
  const router = useRouter();
  const {
    user,
    token,
    isAuthenticated,
    isLoadingAuth,
    updateAvatarContext,
    logoutContext,
  } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const CLOUD_NAME = "doipopjgo";
  const UPLOAD_PRESET = "tramthuc_avatar";
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_AUTH_API_URL ||
    "https://tramthuc-authservice.onrender.com";
  const GOONG_API_KEY = process.env.NEXT_PUBLIC_GOONG_API_KEY || "";

  // 1. STATE TRẠNG THÁI
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. STATE OTP BẢO MẬT
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [step, setStep] = useState<"SELECT_METHOD" | "ENTER_OTP">(
    "SELECT_METHOD",
  );
  const [sendMethod, setSendMethod] = useState<"email" | "phone" | null>(null);
  const [otp, setOtp] = useState("");
  const [isProcessingOtp, setIsProcessingOtp] = useState(false);

  // 3. STATE DỮ LIỆU CƠ BẢN
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
  });

  // 4. STATE ĐỊA CHỈ
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [defaultAddress, setDefaultAddress] = useState<any>(null);

  const [addressInput, setAddressInput] = useState("");
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [goongSuggestions, setGoongSuggestions] = useState<any[]>([]);

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );
  const [pendingNewAddress, setPendingNewAddress] = useState<any>(null);

  // 5. STATE MODAL SỬA ĐỊA CHỈ CON
  const [editModal, setEditModal] = useState({
    isOpen: false,
    id: null,
    receiverName: "",
    receiverPhone: "",
    fullAddress: "",
    lat: null,
    lng: null,
  });
  const [editModalSuggestions, setEditModalSuggestions] = useState<any[]>([]);
  const [showEditModalDropdown, setShowEditModalDropdown] = useState(false);

  const addressWrapperRef = useRef<HTMLDivElement>(null);

  const getSafeToken = () => {
    if (token) return token;
    if (typeof window !== "undefined")
      return localStorage.getItem("tramthuc_token") || "";
    return "";
  };

  // Bắt sự kiện click ra ngoài để đóng dropdown địa chỉ
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        addressWrapperRef.current &&
        !addressWrapperRef.current.contains(event.target as Node)
      ) {
        setShowAddressDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Khởi tạo
  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      router.push("/login");
    } else if (user) {
      setFormData({
        fullName: user.fullName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
      });
      fetchAddresses();
    }
  }, [isLoadingAuth, isAuthenticated, user, router]);

  // LẤY DANH SÁCH ĐỊA CHỈ (GET /api/addresses)
  const fetchAddresses = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/addresses`, {
        headers: { Authorization: `Bearer ${getSafeToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        const list = data.data || [];
        setSavedAddresses(list);
        const def = list.find((a: any) => a.isDefault) || list[0];
        setDefaultAddress(def);
        setAddressInput(def ? def.fullAddress : "");
      }
    } catch (err) {
      console.error("Lỗi lấy địa chỉ:", err);
    }
  };

  // XỬ LÝ ẢNH CLOUDINARY
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return alert("Dung lượng ảnh phải < 2MB!");

    setIsUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("upload_preset", UPLOAD_PRESET);

      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: uploadData },
      );
      if (!cloudinaryRes.ok) throw new Error("Cloudinary error");
      const secureUrl = (await cloudinaryRes.json()).secure_url;

      const backendRes = await fetch(`${API_BASE_URL}/api/auth/update-avatar`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getSafeToken()}`,
        },
        body: JSON.stringify({ avatarUrl: secureUrl }),
      });

      if (backendRes.ok) {
        updateAvatarContext(secureUrl);
        alert("Cập nhật ảnh đại diện thành công!");
      }
    } catch (error) {
      alert("Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ===== BẢO MẬT OTP =====
  const handleEditClick = () => {
    const verifiedStatus = sessionStorage.getItem("pwd_verified");
    if (verifiedStatus === "true") {
      setIsEditing(true);
    } else {
      setShowOtpPopup(true);
      if (user?.email && user?.phoneNumber) setSendMethod("email");
      else if (user?.email) setSendMethod("email");
      else if (user?.phoneNumber) setSendMethod("phone");
    }
  };

  const getIdentifier = () =>
    sendMethod === "email" ? user?.email : user?.phoneNumber;

  const handleSendOtp = async () => {
    setIsProcessingOtp(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: getIdentifier() }),
      });
      if (res.ok) setStep("ENTER_OTP");
    } finally {
      setIsProcessingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsProcessingOtp(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getSafeToken()}`,
        },
        body: JSON.stringify({ identifier: getIdentifier(), otp }),
      });
      if (res.ok) {
        sessionStorage.setItem("pwd_verified", "true");
        setShowOtpPopup(false);
        setIsEditing(true);
      } else {
        alert("Mã OTP không đúng!");
      }
    } finally {
      setIsProcessingOtp(false);
    }
  };

  // ===== GOONG AUTOCOMPLETE =====
  const fetchGoongSuggestions = async (text: string, isModal = false) => {
    if (text.length < 3) {
      isModal ? setEditModalSuggestions([]) : setGoongSuggestions([]);
      return;
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://rsapi.goong.io/Place/AutoComplete?api_key=${GOONG_API_KEY}&input=${encodeURIComponent(text)}`,
        );
        const data = await res.json();
        if (data.predictions) {
          isModal
            ? setEditModalSuggestions(data.predictions)
            : setGoongSuggestions(data.predictions);
        }
      } catch (err) {}
    }, 500);
  };

  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAddressInput(val);
    setShowAddressDropdown(true);
    setSelectedAddressId(null);
    setPendingNewAddress(null);
    fetchGoongSuggestions(val, false);
  };

  const handleSelectGoong = async (placeId: string, description: string) => {
    setAddressInput(description);
    setShowAddressDropdown(false);
    try {
      const res = await fetch(
        `https://rsapi.goong.io/Place/Detail?place_id=${placeId}&api_key=${GOONG_API_KEY}`,
      );
      const data = await res.json();
      if (data.result?.geometry) {
        setPendingNewAddress({
          fullAddress: description,
          lat: data.result.geometry.location.lat,
          lng: data.result.geometry.location.lng,
        });
      }
    } catch (err) {}
  };

  const handleSelectSaved = (addr: any) => {
    setAddressInput(addr.fullAddress);
    setSelectedAddressId(addr.id);
    setPendingNewAddress(null);
    setShowAddressDropdown(false);
  };

  // ===== MODAL SỬA ĐỊA CHỈ =====
  const openEditModal = (addr: any) => {
    setShowAddressDropdown(false);
    setEditModal({
      isOpen: true,
      id: addr.id,
      receiverName: addr.receiverName,
      receiverPhone: addr.receiverPhone,
      fullAddress: addr.fullAddress,
      lat: addr.latitude,
      lng: addr.longitude,
    });
  };

  const handleSaveModalAddress = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/addresses/${editModal.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getSafeToken()}`,
        },
        body: JSON.stringify({
          receiverName: editModal.receiverName,
          receiverPhone: editModal.receiverPhone,
          fullAddress: editModal.fullAddress,
          latitude: editModal.lat,
          longitude: editModal.lng,
          isDefault: defaultAddress?.id === editModal.id,
          default: defaultAddress?.id === editModal.id, // Sửa lỗi nhận diện của Spring Boot
        }),
      });
      alert("Đã cập nhật địa chỉ thành công!");
      setEditModal({ ...editModal, isOpen: false });
      fetchAddresses();
    } catch (err) {
      alert("Lỗi khi lưu địa chỉ!");
    }
  };

  // ===== LƯU TOÀN BỘ THÔNG TIN PROFILE =====
  const handleSaveProfile = async () => {
    // Đảm bảo người dùng phải click chọn địa chỉ nếu họ gõ cái mới
    const isAddressChanged =
      addressInput.trim() !== (defaultAddress?.fullAddress || "").trim();
    if (isAddressChanged && !pendingNewAddress && !selectedAddressId) {
      alert(
        "Vui lòng click chọn một địa chỉ cụ thể từ danh sách gợi ý bên dưới ô nhập!",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Lưu thông tin cơ bản
      const profileRes = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getSafeToken()}`,
        },
        body: JSON.stringify(formData),
      });

      // BẮT LỖI TẠI ĐÂY: Nếu Backend từ chối (VD: trùng SĐT/Email)
      if (!profileRes.ok) {
        const errorData = await profileRes.json();
        // Hiển thị lỗi từ Backend và DỪNG LUỒNG
        alert(
          errorData.message ||
            "Lỗi cập nhật: Email hoặc Số điện thoại đã tồn tại!",
        );
        setIsSubmitting(false);
        return; // KHÔNG chạy tiếp xuống dưới nữa
      }

      // 2. Xử lý lưu địa chỉ
      if (pendingNewAddress) {
        await fetch(`${API_BASE_URL}/api/addresses`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getSafeToken()}`,
          },
          body: JSON.stringify({
            receiverName: formData.fullName,
            receiverPhone: formData.phoneNumber || "000",
            fullAddress: pendingNewAddress.fullAddress,
            latitude: pendingNewAddress.lat,
            longitude: pendingNewAddress.lng,
            isDefault: true,
            default: true,
          }),
        });
      } else if (
        selectedAddressId &&
        selectedAddressId !== defaultAddress?.id
      ) {
        const addrToUpdate = savedAddresses.find(
          (a) => a.id === selectedAddressId,
        );
        if (addrToUpdate) {
          await fetch(`${API_BASE_URL}/api/addresses/${selectedAddressId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getSafeToken()}`,
            },
            body: JSON.stringify({
              ...addrToUpdate,
              isDefault: true,
              default: true,
            }),
          });
        }
      }

      // 3. Xử lý Đăng xuất (Chỉ chạy đến đây nếu API số 1 đã báo thành công)
      const emailChanged =
        (formData.email || "").trim() !== (user?.email || "").trim();
      const phoneChanged =
        (formData.phoneNumber || "").trim() !==
        (user?.phoneNumber || "").trim();

      if (emailChanged || phoneChanged) {
        alert("Thông tin đăng nhập đã thay đổi. Vui lòng đăng nhập lại!");
        logoutContext();
      } else {
        alert("Cập nhật thông tin thành công!");
        setIsEditing(false);
        fetchAddresses(); // Cập nhật lại UI địa chỉ
        window.location.reload();
      }
    } catch (err) {
      alert("Lỗi kết nối khi lưu thông tin!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user)
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>Đang tải...</div>
    );

  // CHUẨN HÓA LOGIC HIỂN THỊ DROPDOWN
  const showGoongList = goongSuggestions.length > 0;
  // Chỉ hiện danh sách đã lưu khi: Không có gợi ý Goong VÀ (ô input trống hoặc đang trùng khớp với địa chỉ đã lưu)
  const showSavedList =
    !showGoongList &&
    savedAddresses.length > 0 &&
    (addressInput.trim() === "" ||
      savedAddresses.some((a) => a.fullAddress === addressInput));

  return (
    <div className={styles["profile-wrapper"]}>
      <h1 className={styles["profile-title"]}>Thông tin tài khoản</h1>

      <div className={styles["profile-container"]}>
        {/* CỘT TRÁI - AVATAR */}
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
                {user.fullName?.charAt(0) || "U"}
              </div>
            )}
          </div>
          <button
            className={styles["upload-btn"]}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? "ĐANG XỬ LÝ..." : "ĐỔI ẢNH ĐẠI DIỆN"}
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </div>

        {/* CỘT PHẢI - THÔNG TIN */}
        <div className={styles["info-section"]}>
          <div className={styles["info-grid"]}>
            <div className={`${styles["input-group"]} ${styles["full-width"]}`}>
              <label>Họ và tên</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                disabled={!isEditing}
              />
            </div>

            <div className={styles["input-group"]}>
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                disabled={!isEditing}
              />
            </div>

            <div className={styles["input-group"]}>
              <label>Số điện thoại</label>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                disabled={!isEditing}
              />
            </div>

            {/* DROPDOWN QUẢN LÝ ĐỊA CHỈ */}
            <div className={`${styles["input-group"]} ${styles["full-width"]}`}>
              <label>Địa chỉ nhận hàng mặc định</label>
              <div
                className={styles["address-wrapper"]}
                ref={addressWrapperRef}
              >
                <input
                  type="text"
                  className={styles["address-input"]}
                  value={addressInput}
                  onChange={handleAddressInputChange}
                  onFocus={() => isEditing && setShowAddressDropdown(true)}
                  disabled={!isEditing}
                  placeholder={
                    defaultAddress
                      ? "Nhập để đổi địa chỉ..."
                      : "Bạn chưa có địa chỉ, gõ để thêm!"
                  }
                />

                {isEditing && showAddressDropdown && (
                  <>
                    {/* TRƯỜNG HỢP 1: GỢI Ý TỪ GOONG */}
                    {showGoongList ? (
                      <ul className={styles["address-dropdown"]}>
                        {goongSuggestions.map((sg) => (
                          <li
                            key={sg.place_id}
                            className={styles["address-item"]}
                            onClick={() =>
                              handleSelectGoong(sg.place_id, sg.description)
                            }
                          >
                            <span className={styles["address-text"]}>
                              📍 {sg.description}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      /* TRƯỜNG HỢP 2: DANH SÁCH ĐÃ LƯU */
                      showSavedList && (
                        <ul className={styles["address-dropdown"]}>
                          {savedAddresses.map((addr) => (
                            <li
                              key={addr.id}
                              className={styles["address-item"]}
                            >
                              <span
                                className={styles["address-text"]}
                                onClick={() => handleSelectSaved(addr)}
                              >
                                {addr.isDefault && "⭐ "} {addr.fullAddress}
                              </span>
                              <button
                                className={styles["btn-edit-addr"]}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(addr);
                                }}
                              >
                                Sửa
                              </button>
                            </li>
                          ))}
                        </ul>
                      )
                    )}
                  </>
                )}
              </div>
            </div>

            {/* NÚT ACTION */}
            <div className={styles["action-row"]}>
              {!isEditing ? (
                <button
                  className={styles["btn-update"]}
                  onClick={handleEditClick}
                >
                  Cập nhật thông tin
                </button>
              ) : (
                <>
                  <button
                    className={styles["btn-cancel"]}
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        fullName: user.fullName || "",
                        email: user.email || "",
                        phoneNumber: user.phoneNumber || "",
                      });
                      setAddressInput(defaultAddress?.fullAddress || "");
                      setGoongSuggestions([]); // Clear gợi ý khi hủy
                    }}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    className={styles["btn-update"]}
                    onClick={handleSaveProfile}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* POPUP BẢO MẬT OTP */}
      {showOtpPopup && (
        <div className={styles["overlay"]}>
          <div className={styles["modal"]}>
            <h2 className={styles["modal-title"]}>Xác minh danh tính</h2>
            <p style={{ textAlign: "center", marginBottom: 20 }}>
              Để bảo mật thông tin, vui lòng chọn phương thức nhận mã OTP.
            </p>
            {step === "SELECT_METHOD" ? (
              <>
                {/* --- ĐÃ THÊM LẠI KHỐI CHỌN RADIO NHƯ BÊN ĐỔI MẬT KHẨU --- */}
                <div className={styles["radio-group"]}>
                  {user.email && (
                    <label className={styles["radio-label"]}>
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
                    <label className={styles["radio-label"]}>
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

                <button className={styles["btn-full"]} onClick={handleSendOtp}>
                  {isProcessingOtp
                    ? "Đang gửi..."
                    : `GỬI MÃ QUA ${sendMethod?.toUpperCase()}`}
                </button>
              </>
            ) : (
              <>
                <input
                  className={styles["input-group"]}
                  style={{ width: "100%", padding: 12, textAlign: "center" }}
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Nhập mã 6 số..."
                  maxLength={6}
                />
                <button
                  className={styles["btn-full"]}
                  onClick={handleVerifyOtp}
                  disabled={isProcessingOtp || otp.length < 6}
                >
                  XÁC NHẬN
                </button>
              </>
            )}
            <button
              className={styles["btn-text-link"]}
              onClick={() => setShowOtpPopup(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* MODAL SỬA ĐỊA CHỈ CON */}
      {editModal.isOpen && (
        <div className={styles["overlay"]}>
          <div className={styles["modal"]}>
            <h2 className={styles["modal-title"]}>Sửa địa chỉ</h2>

            <div className={styles["input-group"]} style={{ marginBottom: 15 }}>
              <label>Tên người nhận</label>
              <input
                type="text"
                value={editModal.receiverName}
                onChange={(e) =>
                  setEditModal({ ...editModal, receiverName: e.target.value })
                }
              />
            </div>

            <div className={styles["input-group"]} style={{ marginBottom: 15 }}>
              <label>Số điện thoại</label>
              <input
                type="text"
                value={editModal.receiverPhone}
                onChange={(e) =>
                  setEditModal({ ...editModal, receiverPhone: e.target.value })
                }
              />
            </div>

            <div className={styles["input-group"]}>
              <label>Địa chỉ</label>
              <div className={styles["address-wrapper"]}>
                <input
                  type="text"
                  value={editModal.fullAddress}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditModal({ ...editModal, fullAddress: val });
                    setShowEditModalDropdown(true);
                    fetchGoongSuggestions(val, true);
                  }}
                />
                {showEditModalDropdown && editModalSuggestions.length > 0 && (
                  <ul className={styles["address-dropdown"]}>
                    {editModalSuggestions.map((sg) => (
                      <li
                        key={sg.place_id}
                        className={styles["address-item"]}
                        onClick={async () => {
                          setEditModal({
                            ...editModal,
                            fullAddress: sg.description,
                          });
                          setShowEditModalDropdown(false);
                          try {
                            const res = await fetch(
                              `https://rsapi.goong.io/Place/Detail?place_id=${sg.place_id}&api_key=${GOONG_API_KEY}`,
                            );
                            const data = await res.json();
                            if (data.result?.geometry)
                              setEditModal((prev) => ({
                                ...prev,
                                lat: data.result.geometry.location.lat,
                                lng: data.result.geometry.location.lng,
                              }));
                          } catch (err) {}
                        }}
                      >
                        📍 {sg.description}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <button
              className={styles["btn-full"]}
              onClick={handleSaveModalAddress}
            >
              CẬP NHẬT ĐỊA CHỈ
            </button>
            <button
              className={styles["btn-text-link"]}
              onClick={() => setEditModal({ ...editModal, isOpen: false })}
            >
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
