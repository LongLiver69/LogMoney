import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "LogMoney - Quản lý chi tiêu & Chia tiền",
  description:
    "Ứng dụng quản lý chi tiêu và chia tiền thông minh cho nhóm bạn bè, gia đình. Theo dõi thu chi, chia tiền công bằng.",
  keywords: ["quản lý chi tiêu", "chia tiền", "expense tracker", "split bill"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={inter.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
