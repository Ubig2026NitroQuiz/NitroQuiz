import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Join Game",
    description: "Join a NitroQuiz game room and compete in a live quiz battle.",
};

export default function JoinLayout({ children }: { children: React.ReactNode }) {
    return children;
}
