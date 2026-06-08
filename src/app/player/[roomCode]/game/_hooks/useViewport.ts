/**
 * Hook untuk mendeteksi viewport, orientasi, dan perangkat mobile.
 */
'use client';
import { useState, useCallback, useEffect } from 'react';

export function useViewport(mobileOrientationChoice: 'portrait' | 'landscape' | null) {
    const [isMobile, setIsMobile] = useState(false);
    const [aspectRatio, setAspectRatio] = useState(1);
    const [mounted, setMounted] = useState(false);

    const setSize = useCallback((canvasRef?: React.RefObject<HTMLCanvasElement | null>) => {
        if (canvasRef?.current) {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
        }
        const w = window.innerWidth;
        const h = window.innerHeight;
        const ratio = w / h;
        setAspectRatio(ratio);
        const hasTouchSupport = (typeof window !== 'undefined') && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
        const isPortrait = ratio < 1;
        // Gunakan Math.min agar saat dilandscape (w > 768 tapi h < 768) tetap terdeteksi sebagai mobile
        const isSmallScreen = Math.min(w, h) < 768; 
        const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        setIsMobile((isSmallScreen && hasTouchSupport) || isMobileUserAgent);
    }, [mobileOrientationChoice]);

    useEffect(() => { setMounted(true); }, []);

    // Kalkulasi layout
    const usePCLayout = !isMobile || mobileOrientationChoice === 'landscape';
    const isMobileLandscape = isMobile && mobileOrientationChoice === 'landscape';
    const isMobilePortrait = isMobile && mobileOrientationChoice === 'portrait';

    return { isMobile, aspectRatio, mounted, setSize, usePCLayout, isMobileLandscape, isMobilePortrait };
}
