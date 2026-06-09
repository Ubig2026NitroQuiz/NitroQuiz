import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Waiting Room",
    description: "Waiting for the host to start the NitroQuiz game. Get ready to race!",
};

export default function WaitingLayout({ children }: { children: React.ReactNode }) {
    return children;
}
