/**
 * =============================================================
 * HOMEPAGE — SERVER COMPONENT
 * =============================================================
 * Shell statis yang memberikan:
 * - Metadata SEO yang optimal (title, og:image, twitter card)
 * - Bundle JS minimal yang dikirim ke browser
 * 
 * Semua interaktivitas (join, host, menu dropdown, dll)
 * ada di HomeClient.tsx sebagai Client Component.
 * =============================================================
 */

import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
    title: "NitroQuiz",
    description: "The ultimate high-speed multiplayer quiz game. Host live quiz battles, challenge your class or friends and race to the top of the leaderboard!",
    openGraph: {
        title: "NitroQuiz — Race. Learn. Dominate.",
        description: "The ultimate high-speed multiplayer quiz game. Host live quiz battles and race to the top!",
        images: [{ url: "/assets/logo/logo192.webp", width: 192, height: 192, alt: "NitroQuiz" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "NitroQuiz — Race. Learn. Dominate.",
        description: "The ultimate high-speed multiplayer quiz game. Host live quiz battles and race to the top!",
        images: ["/assets/logo/logo192.webp"],
    },
};

export default function Home() {
    return <HomeClient />;
}
