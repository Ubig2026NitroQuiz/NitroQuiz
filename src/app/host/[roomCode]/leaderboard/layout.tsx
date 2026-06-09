import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Leaderboard",
    description: "See the final NitroQuiz leaderboard — who crossed the finish line first?",
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
    return children;
}
