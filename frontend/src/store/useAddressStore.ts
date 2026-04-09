import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AddressData {
  id?: number;
  receiverName: string;
  receiverPhone: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
}

interface AddressState {
  selectedAddress: AddressData | null;
  setSelectedAddress: (address: AddressData) => void;
  clearSelectedAddress: () => void;
}

export const useAddressStore = create<AddressState>()(
  persist(
    (set) => ({
      selectedAddress: null,
      setSelectedAddress: (address) => set({ selectedAddress: address }),
      clearSelectedAddress: () => set({ selectedAddress: null }),
    }),
    { name: "tramthuc_selected_address" },
  ),
);
