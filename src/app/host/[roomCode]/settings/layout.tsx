import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Room Settings",
    description: "Configure your NitroQuiz game room settings before starting the race.",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
