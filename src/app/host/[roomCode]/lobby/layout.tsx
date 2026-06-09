import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Lobby Host",
    description: "Waiting in the lobby — players are joining your NitroQuiz room.",
};

export default function LobbyLayout({ children }: { children: React.ReactNode }) {
    return children;
}
