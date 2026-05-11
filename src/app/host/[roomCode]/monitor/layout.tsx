import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Game Monitor",
    description: "Monitor the live NitroQuiz game in progress — track players and questions.",
};

export default function MonitorLayout({ children }: { children: React.ReactNode }) {
    return children;
}
