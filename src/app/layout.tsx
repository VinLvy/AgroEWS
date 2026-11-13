import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgroEWS - Sistem Peringatan Dini Agroklimat",
  description: "Sistem Peringatan Dini Agroklimat Terbuka untuk Mitigasi Wereng Batang Cokelat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased min-h-screen bg-surface-canvas text-content-primary font-sans">
        {children}
      </body>
    </html>
  );
}
