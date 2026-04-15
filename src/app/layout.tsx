import type { Metadata, Viewport } from "next";
import { Inter, Orbitron, Rajdhani, Press_Start_2P } from "next/font/google";
import localFont from "next/font/local";
import NextTopLoader from 'nextjs-toploader';
import "./globals.css";
import ClientLayout from "./ClientLayout";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: '--font-inter',
});

const orbitron = Orbitron({
  subsets: ["latin"],
  display: "swap",
  variable: '--font-orbitron',
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ['400', '500', '600', '700'],
  display: "swap",
  variable: '--font-rajdhani',
});

const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ["latin"],
  display: "swap",
  variable: '--font-press-start-2p',
});

const lpmq = localFont({
  src: '../../public/assets/font/LPMQ_IsepMisbah.ttf',
  variable: '--font-lpmq',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "NitroQuiz",
    template: "%s | NitroQuiz"
  },
  description: "NitroQuiz is an exciting, high-speed multiplayer quiz game! Answer questions, ignite your nitro, and become the champion on the track of knowledge.",
  keywords: [
    "education", "game", "quiz", "racing", "learning", "nitro", "turbo", 
    "online quiz", "multiplayer quiz", "edtech", "educational racing game"
  ],
  authors: [{ name: "NitroQuiz Team" }],
  creator: "NitroQuiz Studio",
  publisher: "NitroQuiz Studio",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/assets/logo/faviconR.webp",
    shortcut: "/assets/logo/faviconR.webp",
    apple: "/assets/logo/faviconR.webp",
  },
  openGraph: {
    title: "NitroQuiz",
    description: "An exciting high-speed quiz game! Answer questions, ignite your nitro, and become the champion on the track of knowledge.",
    url: "/",
    siteName: "NitroQuiz",
    images: [
      {
        url: "/assets/logo/faviconR.web",
        width: 1200,
        height: 630,
        alt: "NitroQuiz Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NitroQuiz",
    description: "Test your knowledge in NitroQuiz! A thrilling and competitive racing-themed multiplayer quiz game.",
    images: ["/assets/logo/faviconR.webp"],
    creator: "@nitroquiz",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        {/* Fonts are loaded via next/font/google - no CDN links needed */}
      </head>
      <body className={`${inter.variable} ${orbitron.variable} ${rajdhani.variable} ${pressStart2P.variable} ${lpmq.variable}`}>
        <ClientLayout>
        <NextTopLoader
          color="#2d6af2"
          initialPosition={0.08}
          crawlSpeed={200}
          height={4}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #2d6af2,0 0 5px #2d6af2"
        />
        {children}
        </ClientLayout>
      </body>
    </html>
  );
}
