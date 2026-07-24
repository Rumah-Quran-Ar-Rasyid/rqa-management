import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Rumah Qur’an Ar-Rasyid",
    template: "%s | Rumah Qur’an Ar-Rasyid",
  },
  description: "Sistem pencatatan dan monitoring hafalan santri.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
