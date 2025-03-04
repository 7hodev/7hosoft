import { SiteHeader } from "@/components/home/site-header";
import { Geist } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

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
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <head>
        <link 
          rel="preload" 
          href="/_next/static/css/app/layout.css" 
          as="style"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className="text-foreground flex justify-center items-center min-h-screen p-0 m-0">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
