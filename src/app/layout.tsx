import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0f1117",
};

export const metadata: Metadata = {
  title: "Creazioni Staff",
  description: "Gestione presenze semplice ed efficiente",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Creazioni Staff",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var t = localStorage.getItem('presenzapp-theme');
            if (t) document.documentElement.setAttribute('data-theme', t);
            else if (window.matchMedia('(prefers-color-scheme: light)').matches)
              document.documentElement.setAttribute('data-theme', 'light');
          })();
        `}} />
      </head>
      <body className="h-full font-sans">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
