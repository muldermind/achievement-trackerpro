"use client";

import Script from "next/script";
import "../styles/globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Uploadcare widget */}
        <Script
          src="https://ucarecdn.com/libs/widget/3.x/uploadcare.full.min.js"
          strategy="beforeInteractive"
          charSet="utf-8"
        />
        {/* Confetti library */}
        <Script
          src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="bg-black text-white font-sans">{children}</body>
    </html>
  );
}
