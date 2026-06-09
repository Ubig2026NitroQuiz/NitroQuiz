import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Quiz",
    description: "Answer the quiz questions in NitroQuiz and earn your nitro boost!",
};

export default function QuizLayout({ children }: { children: React.ReactNode }) {
    return children;
}
