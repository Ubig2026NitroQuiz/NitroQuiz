import { HostGuard } from "@/components/HostGuard";

export default function HostRoomLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <HostGuard>{children}</HostGuard>;
}
