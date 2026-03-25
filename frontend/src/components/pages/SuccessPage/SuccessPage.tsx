"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./SuccessPage.module.css";

export default function OrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const status = searchParams.get("status");
  const orderId = searchParams.get("orderId");

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {status === "success" ? (
          <>
            <div className={styles.iconSuccess}>✔</div>
            <h1 className={styles.title}>Thanh toán thành công!</h1>
            <p className={styles.message}>
              Đơn hàng <strong>#{orderId}</strong> của bạn đã được ghi nhận.
              Trạm Thức sẽ sớm liên hệ để giao hàng cho bạn.
            </p>
          </>
        ) : (
          <>
            <div className={styles.iconError}>✘</div>
            <h1 className={styles.title}>Thanh toán thất bại</h1>
            <p className={styles.message}>
              Có lỗi xảy ra trong quá trình thanh toán. Vui lòng kiểm tra lại số
              dư hoặc thử lại sau.
            </p>
          </>
        )}

        <div className={styles.actionGroup}>
          <button onClick={() => router.push("/")} className={styles.btnHome}>
            Quay về trang chủ
          </button>
          {status !== "success" && (
            <button
              onClick={() => router.push("/checkout")}
              className={styles.btnRetry}
            >
              Thử lại
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
