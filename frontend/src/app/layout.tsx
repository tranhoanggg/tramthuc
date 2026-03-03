import type { Metadata } from "next";
import "./globals.css";

import Navbar from "../components/layout/Navbar/Navbar";

export const metadata: Metadata = {
  title: "Trạm Thức - Đặt đồ uống online",
  description: "Cà phê, Trà, Đồ ăn vặt và Quà tặng",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body suppressHydrationWarning={true}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
