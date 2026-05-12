import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Result",
    description: "See your final results in NitroQuiz — how did you rank on the track?",
};

export default function ResultLayout({ children }: { children: React.ReactNode }) {
    return children;
}
