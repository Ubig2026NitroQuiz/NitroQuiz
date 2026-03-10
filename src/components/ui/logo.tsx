'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

interface LogoProps {
    className?: string;
    width?: number;
    height?: number;
    withText?: boolean;
    animated?: boolean;
}

export function Logo({ className = "", width = 200, height = 60, withText = true, animated = true }: LogoProps) {
    const content = (
        <div className={`flex flex-col items-center justify-center ${className}`}>
            <Image
                src="/assets/logo/logo1.png"
                alt="NitroQuiz Logo"
                width={width}
                height={height}
                className="object-contain"
                priority
            />
            {withText && (
                <p className="text-gray-600 text-[10px] md:text-xs font-display tracking-[0.3em] uppercase mt-2">
                    Race · Learn · Dominate
                </p>
            )}
        </div>
    );

    if (animated) {
        return (
            <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {content}
            </motion.div>
        );
    }

    return content;
}
