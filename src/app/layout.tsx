import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PersonaleStaff",
  description: "Dashboard per la gestione del personale",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className="h-full antialiased">
      <body className="h-full font-sans">{children}</body>
    </html>
  );
}
