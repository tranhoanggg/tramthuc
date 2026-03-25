"use client";

import React from "react";
import { useCartStore } from "@/store/useCartStore";

interface AddToCartButtonProps {
  product: {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
  };
  quantity?: number;
  className?: string;
  children: React.ReactNode;
}

export default function AddToCartButton({
  product,
  quantity = 1,
  className,
  children,
}: AddToCartButtonProps) {
  const addToCart = useCartStore((state) => state.addToCart);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      imageUrl: product.imageUrl,
    });

    alert(`Đã thêm món ${product.name} vào giỏ hàng!`);
  };

  return (
    <div
      onClick={handleAddToCart}
      className={className}
      role="button"
      title="Thêm vào giỏ"
    >
      {children}
    </div>
  );
}
