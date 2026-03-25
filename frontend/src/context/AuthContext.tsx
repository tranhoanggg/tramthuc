"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";

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
  token: string | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean; // Trạng thái đang check token
  loginContext: (token: string) => void;
  logoutContext: () => void;
  updateAvatarContext: (url: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const router = useRouter();

  const apiUrl =
    process.env.NEXT_PUBLIC_AUTH_API_URL ||
    "https://tramthuc-authservice.onrender.com";

  // Hàm gọi API lấy profile từ Backend
  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/auth/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Nhét Token vào Header để Spring Boot xác thực
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.data); // Lưu user vào Global State
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
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem("tramthuc_token");
      const loginAt = localStorage.getItem("tramthuc_login_at");
      const TWELVE_HOURS = 12 * 60 * 60 * 1000;

      if (savedToken && loginAt) {
        const isExpired =
          new Date().getTime() - parseInt(loginAt) > TWELVE_HOURS;

        if (isExpired) {
          logoutContext();
        } else {
          fetchUserProfile(savedToken);
        }
      } else {
        setIsLoadingAuth(false);
      }
    };

    initializeAuth();
  }, []);

  // Hàm kích hoạt khi người dùng đăng nhập thành công ở LoginPage
  const loginContext = (newToken: string) => {
    const now = new Date().getTime();
    localStorage.setItem("tramthuc_token", newToken);
    localStorage.setItem("tramthuc_login_at", String(now));
    setToken(newToken);
    setIsLoadingAuth(true);
    fetchUserProfile(newToken);
  };

  // Hàm kích hoạt khi bấm Đăng xuất
  const logoutContext = async () => {
    const token = localStorage.getItem("tramthuc_token");
    useCartStore.getState().clearLocalCartOnLogout();

    if (token) {
      try {
        await fetch(`${apiUrl}/api/auth/logout`, {
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
    localStorage.removeItem("tramthuc_login_at");
    setToken(null);
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
        token,
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
