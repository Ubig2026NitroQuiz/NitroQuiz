import React from 'react';

// Helper: Generate initials from a name
const getInitials = (name: string): string => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
};

// Initials avatar colors based on nickname hash
const AVATAR_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#10b981', '#ec4899', '#06b6d4', '#f97316'];
const getAvatarColor = (name: string): string => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export const InitialsAvatar = ({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) => {
    const fontSize = size === 'lg' ? 'text-xl' : size === 'md' ? 'text-base' : 'text-[10px]';
    return (
        <div
            className={`w-full h-full rounded-full flex items-center justify-center ${fontSize} font-black text-white`}
            style={{ backgroundColor: getAvatarColor(name) }}
        >
            {getInitials(name)}
        </div>
    );
};
