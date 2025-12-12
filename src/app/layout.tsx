import type { Metadata } from "next";

import { Manrope } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "MicroAI Mock Onboarding",
  description: "Mock onboarding flow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${manrope.variable} ${GeistMono.variable}`}>
      <body className="subpixel-antialiased">{children}</body>
    </html>
  );
}
