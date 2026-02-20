import type { Metadata } from "next";
import { Inter, Orbitron, Rajdhani, Press_Start_2P } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "NitroQuiz - Balap Cerdas Adrenalin Tinggi",
  description: "Game kuis seru berkecepatan tinggi! Jawab pertanyaan, nyalakan nitro, dan jadilah juara di NitroQuiz.",
  keywords: ["edukasi", "game", "quiz", "balapan", "racing", "belajar", "nitro", "turbo"],
  authors: [{ name: "NitroQuiz Team" }],
  openGraph: {
    title: "NitroQuiz - Balap Cerdas Adrenalin Tinggi",
    description: "Game kuis seru berkecepatan tinggi! Jawab pertanyaan, nyalakan nitro, dan jadilah juara.",
    type: "website",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Rajdhani:ital,wght@0,400;0,600;0,700;1,700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} ${orbitron.variable} ${rajdhani.variable} ${pressStart2P.variable}`}>
        {children}
      </body>
    </html>
  );
}
