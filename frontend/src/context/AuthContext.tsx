"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

// Định nghĩa kiểu dữ liệu cho User trùng khớp với Backend
export interface User {
  id: number;
  fullName: string;
  email: string | null;
  phoneNumber: string | null;
  role: string;
  avatar: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean; // Trạng thái đang check token
  loginContext: (token: string) => void;
  logoutContext: () => void;
  updateAvatarContext: (url: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const router = useRouter();

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_AUTH_API_URL ||
    "https://tramthuc-authservice.onrender.com";

  // Hàm gọi API lấy profile từ Backend
  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Nhét Token vào Header để Spring Boot xác thực
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData); // Lưu user vào Global State
      } else {
        // Nếu Token hết hạn hoặc sai -> Xóa sạch
        localStorage.removeItem("tramthuc_token");
        setUser(null);
      }
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người dùng:", error);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // TỰ ĐỘNG CHẠY KHI MỞ TRANG WEB: Kiểm tra xem có token trong máy không
  useEffect(() => {
    const token = localStorage.getItem("tramthuc_token");
    if (token) {
      fetchUserProfile(token);
    } else {
      setIsLoadingAuth(false);
    }
  }, []);

  // Hàm kích hoạt khi người dùng đăng nhập thành công ở LoginPage
  const loginContext = (token: string) => {
    localStorage.setItem("tramthuc_token", token);
    setIsLoadingAuth(true);
    fetchUserProfile(token);
  };

  // Hàm kích hoạt khi bấm Đăng xuất
  const logoutContext = async () => {
    const token = localStorage.getItem("tramthuc_token");

    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error("Lỗi khi gọi API đăng xuất:", error);
      }
    }

    localStorage.removeItem("tramthuc_token");

    setUser(null);

    router.push("/");
  };

  const updateAvatarContext = (newAvatarUrl: string) => {
    if (user) {
      setUser({ ...user, avatar: newAvatarUrl });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoadingAuth,
        loginContext,
        logoutContext,
        updateAvatarContext,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook hỗ trợ lấy dữ liệu nhanh
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
