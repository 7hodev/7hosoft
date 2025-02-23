
import { SiteHeader } from "@/components/home/site-header"
import { Geist } from "next/font/google";
import "./globals.css";
import { useState } from "react";
import { type Language, translations } from "@/lib/i18n/translations";
import AppWrapper from "./AppWrapper";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Develop",
  description: "The fastest way to build apps with Next.js and Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppWrapper>{children}</AppWrapper>;
}
