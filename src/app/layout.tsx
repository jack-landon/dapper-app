import type React from "react";
import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
// import { Analytics } from "@vercel/analytics/next";
import { Providers } from "@/components/providers";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";

// const _geist = Geist({ subsets: ["latin"] });
// const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dapper - Instant Yield DeFi Protocol",
  description: "Stake crypto and receive your interest upfront",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased dark`}>
        <Toaster richColors />
        <Providers>
          <Navigation />
          {children}
          <Footer />
        </Providers>
        {/* <Analytics /> */}
      </body>
    </html>
  );
}
