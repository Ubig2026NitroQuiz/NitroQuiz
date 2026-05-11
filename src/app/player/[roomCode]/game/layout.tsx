import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Game",
    description: "Race through the questions in your NitroQuiz game. Boost your nitro to win!",
};

export default function GameLayout({ children }: { children: React.ReactNode }) {
    return children;
}
