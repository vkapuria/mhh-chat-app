import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import { OpenPanelProvider } from '@/lib/openpanel';
import { AuthInitializer } from '@/components/AuthInitializer';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chat App - Orders & Messages",
  description: "Communicate with experts and customers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthInitializer />
        <OpenPanelProvider />
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}