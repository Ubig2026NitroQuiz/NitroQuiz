/**
 * Hook untuk menangani input keyboard dan sentuh (touch/swipe).
 */
'use client';
import { useEffect, useRef } from 'react';
import type { GameLoopState, ViewMode } from '../_types';
import { Util } from '../_utils';

export function useGameControls(
    stateRef: React.MutableRefObject<GameLoopState>,
    setViewMode: (m: ViewMode) => void,
    isMobile: boolean,
    mobileOrientationChoice: 'portrait' | 'landscape' | null
) {
    const touchStartX = useRef<number | null>(null);
    const touchCurrentX = useRef<number | null>(null);
    const steeringTouchId = useRef<number | null>(null);

    // Keyboard controls
    useEffect(() => {
        const togglePOV = () => {
            const next = stateRef.current.viewMode === 'first' ? 'third' : 'first';
            stateRef.current.viewMode = next;
            setViewMode(next);
        };
        const handleDown = (e: KeyboardEvent) => {
            switch (e.key.toLowerCase()) {
                case 'arrowleft': case 'a': stateRef.current.keyLeft = true; break;
                case 'arrowright': case 'd': stateRef.current.keyRight = true; break;
                case 'arrowup': case 'w': stateRef.current.keyFaster = true; break;
                case 'arrowdown': case 's': stateRef.current.keySlower = true; break;
                case ' ': e.preventDefault(); stateRef.current.keyBoost = true; break;
                case 't': togglePOV(); break;
            }
        };
        const handleUp = (e: KeyboardEvent) => {
            switch (e.key.toLowerCase()) {
                case 'arrowleft': case 'a': stateRef.current.keyLeft = false; break;
                case 'arrowright': case 'd': stateRef.current.keyRight = false; break;
                case 'arrowup': case 'w': stateRef.current.keyFaster = false; break;
                case 'arrowdown': case 's': stateRef.current.keySlower = false; break;
                case ' ': e.preventDefault(); stateRef.current.keyBoost = false; break;
            }
        };
        window.addEventListener('keydown', handleDown);
        window.addEventListener('keyup', handleUp);
        return () => { window.removeEventListener('keydown', handleDown); window.removeEventListener('keyup', handleUp); };
    }, []);

    // Touch/Swipe + Anti-zoom
    useEffect(() => {
        const handleTouchStart = (e: TouchEvent) => {
            let hitsButton = false;
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                const target = touch.target as HTMLElement;
                if (target.tagName === 'BUTTON' || target.closest('button')) { hitsButton = true; }
                else if (!hitsButton && steeringTouchId.current === null) {
                    steeringTouchId.current = touch.identifier;
                    touchStartX.current = touch.clientX;
                    touchCurrentX.current = touch.clientX;
                }
            }
            if (e.touches.length > 1 && !hitsButton) e.preventDefault();
        };
        const handleTouchMove = (e: TouchEvent) => {
            if (e.cancelable) e.preventDefault();
            if (steeringTouchId.current === null) return;
            for (let i = 0; i < e.touches.length; i++) {
                const touch = e.touches[i];
                if (touch.identifier === steeringTouchId.current) {
                    touchCurrentX.current = touch.clientX;
                    const deltaX = touchCurrentX.current - (touchStartX.current || 0);
                    const maxRange = window.innerWidth / 3;
                    stateRef.current.analogSteer = Util.limit(deltaX / maxRange, -1, 1);
                    if (deltaX < -20) { stateRef.current.keyLeft = true; stateRef.current.keyRight = false; }
                    else if (deltaX > 20) { stateRef.current.keyRight = true; stateRef.current.keyLeft = false; }
                    else { stateRef.current.keyLeft = false; stateRef.current.keyRight = false; }
                    break;
                }
            }
        };
        const handleTouchEnd = (e: TouchEvent) => {
            if (steeringTouchId.current === null) return;
            let ended = false;
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === steeringTouchId.current) { ended = true; break; }
            }
            if (ended) {
                steeringTouchId.current = null; touchStartX.current = null; touchCurrentX.current = null;
                stateRef.current.analogSteer = 0; stateRef.current.keyLeft = false; stateRef.current.keyRight = false;
            }
        };

        if (isMobile && mobileOrientationChoice === 'portrait') {
            window.addEventListener('touchstart', handleTouchStart, { passive: false });
            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            window.addEventListener('touchend', handleTouchEnd, { passive: false });
            window.addEventListener('touchcancel', handleTouchEnd, { passive: false });
        }

        const preventZoom = (e: TouchEvent) => {
            const target = e.target as HTMLElement;
            if (e.touches.length > 1 && !(target.tagName === 'BUTTON' || target.closest('button'))) e.preventDefault();
        };
        let lastTouchEnd = 0;
        const preventDoubleTapZoom = (e: TouchEvent) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) e.preventDefault();
            lastTouchEnd = now;
        };
        if (isMobile) {
            window.addEventListener('touchstart', preventZoom, { passive: false });
            window.addEventListener('touchend', preventDoubleTapZoom, { passive: false });
            (window as any).addEventListener('gesturestart', (e: any) => e.preventDefault(), { passive: false });
        }

        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
            window.removeEventListener('touchcancel', handleTouchEnd);
            if (isMobile) { window.removeEventListener('touchstart', preventZoom); window.removeEventListener('touchend', preventDoubleTapZoom); }
        };
    }, [isMobile, mobileOrientationChoice]);
}
