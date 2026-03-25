import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

interface CartState {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateQuantity: (id: number, quantity: number) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  syncWithServer: () => Promise<void>;
  clearLocalCartOnLogout: () => void;
}

// Hàm tiện ích chạy ngầm: Tự động lưu lên Server nếu người dùng ĐÃ ĐĂNG NHẬP
const saveCartToServer = async (cart: CartItem[]) => {
  try {
    const token = localStorage.getItem("tramthuc_token");
    if (!token) return; // Nếu là khách vãng lai (Guest), chỉ lưu ở LocalStorage, hủy gọi API

    // Giải mã JWT Payload để lấy thông tin userId gửi xuống Backend
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userId = payload.id || payload.userId || 1; // Tùy thuộc vào cấu trúc JWT của bạn

    const apiUrl =
      process.env.NEXT_PUBLIC_PAYMENT_API_URL ||
      "https://tramthuc-paymentservice.onrender.com";
    await fetch(`${apiUrl}/api/cart/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-User-Id": userId.toString(), // Header cốt lõi mà CartController yêu cầu
      },
      body: JSON.stringify(cart),
    });
  } catch (error) {
    console.error("Lỗi khi lưu giỏ hàng lên server:", error);
  }
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],

      addToCart: (item) => {
        set((state) => {
          const existingItem = state.cart.find(
            (i) => i.productId === item.productId,
          );
          let newCart;
          if (existingItem) {
            newCart = state.cart.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i,
            );
          } else {
            newCart = [...state.cart, item];
          }

          saveCartToServer(newCart); // Gọi ngầm để backup lên Redis
          return { cart: newCart };
        });
      },

      updateQuantity: (id, quantity) => {
        set((state) => {
          const newCart = state.cart.map((i) =>
            i.productId === id ? { ...i, quantity: Math.max(1, quantity) } : i,
          );
          saveCartToServer(newCart);
          return { cart: newCart };
        });
      },

      removeFromCart: (id) => {
        set((state) => {
          const newCart = state.cart.filter((i) => i.productId !== id);
          saveCartToServer(newCart);
          return { cart: newCart };
        });
      },

      // Dùng khi khách chốt đơn thanh toán thành công
      clearCart: () => {
        set({ cart: [] });
      },

      // Dùng khi khách bấm Đăng xuất
      clearLocalCartOnLogout: () => {
        set({ cart: [] });
        sessionStorage.removeItem("tramthuc_cart");
      },

      // Dùng NGAY SAU KHI khách Đăng nhập thành công
      syncWithServer: async () => {
        try {
          const token = localStorage.getItem("tramthuc_token");
          if (!token) return;

          const payload = JSON.parse(atob(token.split(".")[1]));
          const userId = payload.id || payload.userId || 1;

          const localCart = get().cart;
          const apiUrl =
            process.env.NEXT_PUBLIC_PAYMENT_API_URL ||
            "https://tramthuc-paymentservice.onrender.com";

          // Gọi API gộp giỏ hàng Local và Redis
          const response = await fetch(`${apiUrl}/api/cart/sync`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "X-User-Id": userId.toString(),
            },
            body: JSON.stringify(localCart),
          });

          if (response.ok) {
            const resData = await response.json();
            if (resData.code === 200 && resData.data) {
              // Cập nhật lại LocalStorage bằng danh sách hoàn chỉnh từ Server trả về
              set({ cart: resData.data });
            }
          }
        } catch (error) {
          console.error("Lỗi đồng bộ giỏ hàng:", error);
        }
      },
    }),
    { name: "tramthuc_cart", storage: createJSONStorage(() => sessionStorage) },
  ),
);
