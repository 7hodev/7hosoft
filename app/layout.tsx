import { SiteHeader } from "@/components/home/site-header";
import { Geist } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import GoogleOneTap from "@/components/auth/google-one-tap";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "7hoSoft",
  description: "Gestiona tu negocio de manera inteligente",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/_next/static/css/app/layout.css"
          as="style"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </head>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
