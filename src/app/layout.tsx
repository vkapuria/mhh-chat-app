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
  title: {
    default: "MyHomeworkHelp - Student & Expert Portal",
    template: "%s | MyHomeworkHelp"
  },
  description: "Secure portal for MyHomeworkHelp students and experts. Manage orders, communicate, and get support.",
  keywords: ["myhomeworkhelp", "homework help", "student portal", "expert portal", "academic support"],
  authors: [{ name: "MyHomeworkHelp" }],
  creator: "MyHomeworkHelp",
  publisher: "MyHomeworkHelp",
  
  // Open Graph (for link sharing)
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://chat.myhomeworkhelp.com",
    siteName: "MyHomeworkHelp",
    title: "MyHomeworkHelp - Student & Expert Portal",
    description: "Secure portal for MyHomeworkHelp students and experts",
    images: [
      {
        url: "/icons/mhh-logo.png",
        width: 1200,
        height: 630,
        alt: "MyHomeworkHelp Logo"
      }
    ]
  },

  // Twitter Card
  twitter: {
    card: "summary",
    title: "MyHomeworkHelp - Student & Expert Portal",
    description: "Secure portal for MyHomeworkHelp students and experts",
    images: ["/icons/mhh-logo.png"],
  },

  // Icons
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.ico", sizes: "32x32" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  },

  // Manifest for PWA
  manifest: "/manifest.json",

  // Robots
  robots: {
    index: false, // Don't index the app (it's behind login)
    follow: false,
    nocache: true,
  },

  // Viewport
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },

  // Theme color
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4F46E5" },
    { media: "(prefers-color-scheme: dark)", color: "#4F46E5" }
  ],

  // Verification (add if you ever need Google Search Console)
  // verification: {
  //   google: "your-google-verification-code",
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Additional meta tags */}
        <meta name="application-name" content="Homework Hub" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Homework Hub" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="canonical" href="https://chat.myhomeworkhelp.com" />
      </head>
      <body className={inter.className}>
        <AuthInitializer />
        <OpenPanelProvider />
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}