'use client';
/**
 * =====================================================
 * HALAMAN UTAMA GAME - NitroQuiz Racing Game
 * =====================================================
 * File ini adalah entry point (orchestrator) yang
 * menggabungkan semua modul: engine, hooks, dan komponen.
 * Logika berat sudah dipindahkan ke modul terpisah.
 * =====================================================
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { getI18nInstance } from '@/lib/i18n';
import { ASSET_LIST, TRACK_ASSETS } from '@/lib/gameAssets';
import { syncServerTime } from '@/lib/serverTime';
import { useBgm } from '@/contexts/BgmContext';
import { supabaseGame } from '@/lib/supabase/game-client';

// --- Modul Internal Game ---
import type { GameLoopState, GameState, ViewMode, MobileOrientation, GameStats } from './_types';
import { SEGMENT_LENGTH, LANES, DRAW_DISTANCE, ROAD_WIDTH, COLORS, QUESTIONS_PER_ROUND } from './_constants';
import { getDifficultyConfig } from './_constants';
import { Util } from './_utils';
import { findSegment, resetRoad } from './_engine/road';
import { renderSegment, renderSprite, renderPlayer } from './_engine/renderer';
import { updateGame } from './_engine/physics';
import { drawMiniMap } from './_engine/minimap';

// --- Komponen UI ---
import { MainLoadingOverlay } from './_components/LoadingOverlay';
import { OrientationPicker } from './_components/OrientationPicker';
import { GameHUD } from './_components/GameHUD';
import { FinishOverlay } from './_components/FinishOverlay';

// --- Hooks ---
import { useViewport } from './_hooks/useViewport';
import { useGameTimer } from './_hooks/useGameTimer';
import { useGameGuards } from './_hooks/useGameGuards';
import { useQuizQuestions } from './_hooks/useQuizQuestions';
import { useGameControls } from './_hooks/useGameControls';

getI18nInstance(); // Inisialisasi i18n

// ==========================================
// Komponen Utama
// ==========================================
export default function GameSpeedPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const params = useParams();
    const { isMuted, toggleMute } = useBgm();
    const roomCode = (params?.roomCode as string)?.toUpperCase();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const miniMapRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>(0);

    // --- State Permainan ---
    const [gameState, setGameState] = useState<GameState>('preparation');
    const [stats, setStats] = useState<GameStats>({ speed: 0, nos: 100, lap: 1, totalLaps: 1 });
    const isFinishingRef = useRef(false);
    const [isFinishingOverlay, setIsFinishingOverlay] = useState(false);
    const [assetsLoaded, setAssetsLoaded] = useState(false);
    const [lapRace, setLapRace] = useState(0);

    // --- State UI ---
    const [viewMode, setViewMode] = useState<ViewMode>('third');
    const [miniMapMinimized, setMiniMapMinimized] = useState(false);
    const [isBraking, setIsBraking] = useState(false);
    const [isBoosting, setIsBoosting] = useState(false);
    const [mobileOrientationChoice, setMobileOrientationChoice] = useState<MobileOrientation>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('nitroquiz_orientation');
            if (saved === 'portrait' || saved === 'landscape') return saved;
        }
        return null;
    });

    // --- Viewport Hook ---
    const { isMobile, aspectRatio, mounted, setSize, usePCLayout, isMobileLandscape, isMobilePortrait } = useViewport(mobileOrientationChoice);

    // --- Game Loop State (Ref untuk menghindari stale closure) ---
    const state = useRef<GameLoopState>({
        segments: [], cars: [], position: 0, playerX: 0, playerZ: 0, speed: 0, trackLength: 0,
        sprites: { car: null, bg: null, obstacle: null },
        keyLeft: false, keyRight: false, keyFaster: false, keySlower: false, keyBoost: false,
        nos: 100, currentLap: 1, totalLaps: 1, countdown: 5,
        cameraDepth: 1 / Math.tan((100 / 2) * Math.PI / 180),
        viewMode: 'third', bgOffset: 0, analogSteer: 0,
        nosPhase: 'idle', nosFrame: 0, nosFrameTimer: 0, nosWasPressed: false,
        revvingFrame: 0, revvingTimer: 0, mcFrame: 0, mcTimer: 0,
        allQuizQuestions: [], quizQuestionIndex: 0, totalQuizScore: 0,
        hasFinishedLine: false,
    });

    // Inisialisasi flag finish line
    useEffect(() => { if (state.current) state.current.hasFinishedLine = false; }, []);

    // --- Helper: Update status peserta ke Supabase ---
    const updateParticipantStatus = useCallback(async (updates: Record<string, any>) => {
        const participantId = typeof window !== 'undefined' ? localStorage.getItem('nitroquiz_game_participantId') : null;
        if (participantId) {
            try { await supabaseGame.from('participants').update(updates).eq('id', participantId); }
            catch (error) { console.error('Failed to sync participant status:', error); }
        }
    }, []);

    // --- Fungsi Akhir Permainan ---
    const hasEndedRef = useRef(false);
    const endGame = useCallback(async () => {
        if (hasEndedRef.current) return;
        hasEndedRef.current = true;
        const participantId = typeof window !== 'undefined' ? localStorage.getItem('nitroquiz_game_participantId') : null;
        if (participantId) {
            try { await supabaseGame.from('participants').update({ finished_at: new Date().toISOString() }).eq('id', participantId); }
            catch (e) { console.error("Failed to update participant finish state:", e); }
        }
        try {
            if (screen.orientation && (screen.orientation as any).unlock) (screen.orientation as any).unlock();
            if (document.exitFullscreen && document.fullscreenElement) document.exitFullscreen().catch(() => { });
        } catch (e) { console.error("Failed to unlock orientation:", e); }
        localStorage.removeItem('nitroquiz_game_questions');
        localStorage.removeItem('nitroquiz_game_questionIndex');
        localStorage.removeItem('nitroquiz_game_score');
        localStorage.removeItem('nitroquiz_game_roomCode');
        localStorage.removeItem('nitroquiz_game_sessionId');
        localStorage.removeItem('nitroquiz_game_quizId');
        localStorage.removeItem('nitroquiz_game_difficulty');
        if (roomCode) router.push(`/player/${roomCode}/result`);
        else router.push('/');
    }, [roomCode, router]);

    // --- Hooks Eksternal ---
    const { globalTimeLeft, isTimerReady } = useGameTimer(endGame, setGameState);
    useGameGuards(roomCode, setLapRace);
    useQuizQuestions(roomCode, state, setLapRace);
    useGameControls(state, setViewMode, isMobile, mobileOrientationChoice);

    // --- Auto-selesai saat finished ---
    useEffect(() => { if (gameState === 'finished') endGame(); }, [gameState, endGame]);

    // --- Loading Aset ---
    useEffect(() => {
        const difficulty = localStorage.getItem('nitroquiz_game_difficulty') || 'easy';
        const diffConfig = getDifficultyConfig(difficulty);
        state.current.cameraDepth = 1 / Math.tan((diffConfig.fieldOfView / 2) * Math.PI / 180);
        router.prefetch(`/player/${roomCode}/quiz`);
        state.current.sprites = { ...state.current.sprites };

        const loadAssets = async () => {
            console.log("[NitroQuiz] Starting asset load logic...");
            const globalStore = (typeof window !== 'undefined') ? (window as any).__nitroquiz_asset_store : null;
            if (globalStore) console.log("[NitroQuiz] Found global asset store, adopting preloaded assets...");
            let selectedCharId = 'rico';
            const promises: Promise<void>[] = [];
            const obstacles = (difficulty === 'normal' || difficulty === 'medium' || difficulty === 'hard') ? [
                { name: 'obstacle1', src: '/assets/material/pembatas_jalan/1penghalang.webp' },
                { name: 'obstacle2', src: '/assets/material/pembatas_jalan/1roadbarrier.webp' }
            ] : [];

            [...ASSET_LIST, ...obstacles].forEach(item => {
                promises.push(new Promise<void>((resolve) => {
                    if (!item.src) { resolve(); return; }
                    let srcPath = item.src;
                    if (srcPath.includes('/characters/rico/')) srcPath = srcPath.replace('/characters/rico/', `/characters/${selectedCharId}/`);
                    if (globalStore && (globalStore[item.name] || globalStore[srcPath])) {
                        const existing = globalStore[item.name] || globalStore[srcPath];
                        if (existing.complete && existing.naturalWidth > 0) {
                            if (!(existing as any).assetName) (existing as any).assetName = item.name;
                            state.current.sprites[item.name] = existing; resolve(); return;
                        }
                        existing.onload = () => { if (!(existing as any).assetName) (existing as any).assetName = item.name; state.current.sprites[item.name] = existing; resolve(); };
                        existing.onerror = () => resolve(); return;
                    }
                    const img = new Image();
                    img.onload = () => { (img as any).assetName = item.name; state.current.sprites[item.name] = img; resolve(); };
                    img.onerror = () => {
                        const cvs = document.createElement('canvas'); cvs.width = 128; cvs.height = 128;
                        const ctx = cvs.getContext('2d'); if (ctx) { ctx.fillStyle = '#444'; ctx.fillRect(0, 0, 128, 128); }
                        (cvs as any).assetName = item.name; state.current.sprites[item.name] = cvs; resolve();
                    };
                    img.src = srcPath;
                }));
            });

            const uniqueSources = Array.from(new Set(TRACK_ASSETS.map(item => item.src))).filter(Boolean);
            uniqueSources.forEach(src => {
                promises.push(new Promise<void>((resolve) => {
                    if (globalStore && globalStore[src]) {
                        const existing = globalStore[src];
                        if (existing.complete && existing.naturalWidth > 0) {
                            if (!(existing as any).assetName) (existing as any).assetName = src;
                            state.current.sprites[src] = existing; resolve(); return;
                        }
                        existing.onload = () => { if (!(existing as any).assetName) (existing as any).assetName = src; state.current.sprites[src] = existing; resolve(); };
                        existing.onerror = () => resolve(); return;
                    }
                    const img = new Image();
                    img.onload = () => { (img as any).assetName = src; state.current.sprites[src] = img; resolve(); };
                    img.onerror = () => { resolve(); };
                    img.src = src;
                }));
            });

            await Promise.all(promises);
            setSize();
            resetRoad(state.current);
            setAssetsLoaded(true);
        };
        loadAssets();
    }, []);

    // --- Trigger Mulai ---
    useEffect(() => {
        if (gameState === 'preparation' && assetsLoaded) {
            if (isMobile) { if (mobileOrientationChoice) setGameState('playing'); }
            else setGameState('playing');
        }
    }, [gameState, assetsLoaded, isMobile, mobileOrientationChoice]);

    // --- Game Loop Utama ---
    useEffect(() => {
        syncServerTime();
        const fetchServerState = async () => {
            const participantId = typeof window !== 'undefined' ? localStorage.getItem('nitroquiz_game_participantId') : null;
            const { data: sessionData } = await supabaseGame.from('sessions').select('status').eq('game_pin', roomCode).single();
            if (sessionData) {
                if (sessionData.status === 'waiting' || sessionData.status === 'lobby') { window.location.replace(`/player/${roomCode}/waiting`); return; }
                if (sessionData.status === 'finished' || sessionData.status === 'completed') { window.location.replace(`/player/${roomCode}/result`); return; }
            }
            if (!participantId) { window.location.replace(`/player/${roomCode}/waiting`); return; }
            const { data } = await supabaseGame.from('participants').select('minigame, finished_at, lap_race').eq('id', participantId).single();
            if (data) {
                if (data.minigame === false && !data.finished_at) { window.location.replace(`/player/${roomCode}/quiz`); return; }
                const dbLap = data.lap_race || 0; setLapRace(dbLap); localStorage.setItem('nitroquiz_game_lapRace', String(dbLap));
            }
        };
        fetchServerState();
        if (!assetsLoaded) return;

        const _initDiff = localStorage.getItem('nitroquiz_game_difficulty') || 'easy';
        const _initDiffCfg = getDifficultyConfig(_initDiff);
        state.current.playerZ = (_initDiffCfg.cameraHeight * state.current.cameraDepth);

        let lastTime = performance.now();
        let miniMapUpdateTime = 0;

        // --- Fungsi Render (menggunakan modul engine) ---
        const renderFrame = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.imageSmoothingEnabled = false;
            const width = canvas.width;
            const height = canvas.height;
            const { segments, position, playerZ, playerX, speed, sprites } = state.current;
            if (!segments || segments.length === 0) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height); return; }

            ctx.fillStyle = COLORS.SKY; ctx.fillRect(0, 0, width, height);
            const baseSegment = findSegment(state.current, position);
            const basePercent = Util.percentRemaining(position, SEGMENT_LENGTH);
            const playerSegment = findSegment(state.current, position + playerZ);
            const playerPercent = Util.percentRemaining(position + playerZ, SEGMENT_LENGTH);
            const playerY = Util.interpolate(playerSegment.p1.world.y, playerSegment.p2.world.y, playerPercent);
            const speedPercent = speed / (SEGMENT_LENGTH / (1 / 60));

            // Latar belakang parallax
            const bgAsset = isMobile && sprites.bg_mobile ? sprites.bg_mobile : sprites.bg;
            if (bgAsset) {
                const bg = bgAsset; const bgW = bg.width; const bgH = bg.height;
                const extraParallax = isMobile ? 1.5 : 1.3;
                const scaleX = (width / bgW) * extraParallax; const scaleY = (height / bgH);
                const layerScale = Math.max(scaleX, scaleY);
                const scaledW = bgW * layerScale; const scaledH = bgH * layerScale;
                state.current.bgOffset = state.current.bgOffset || 0;
                const maxOverflowX = (scaledW - width) / 2; const maxAllowedFactor = maxOverflowX / scaledW;
                state.current.bgOffset = Util.limit(state.current.bgOffset, -maxAllowedFactor, maxAllowedFactor);
                const finalScrollX = ((width - scaledW) / 2) - (state.current.bgOffset * scaledW);
                const finalScrollY = (height - scaledH) / 2;
                ctx.save(); ctx.drawImage(bg, finalScrollX, finalScrollY, scaledW, scaledH); ctx.restore();
            }

            let maxy = height; let x = 0; let dx = -(baseSegment.curve * basePercent);
            const _diff = localStorage.getItem('nitroquiz_game_difficulty') || 'easy';
            const _diffCfg = getDifficultyConfig(_diff);
            const currentCameraHeight = state.current.viewMode === 'first' ? 850 : _diffCfg.cameraHeight;

            // Render segmen jalan
            for (let n = 0; n < DRAW_DISTANCE; n++) {
                const segment = segments[(baseSegment.index + n) % segments.length];
                segment.looped = segment.index < baseSegment.index;
                segment.fog = Util.exponentialFog(n / DRAW_DISTANCE, _diffCfg.fogDensity);
                segment.clip = maxy;
                Util.project(segment.p1, (playerX * ROAD_WIDTH) - x, playerY + currentCameraHeight, position - (segment.looped ? state.current.trackLength : 0), state.current.cameraDepth, width, height, ROAD_WIDTH);
                Util.project(segment.p2, (playerX * ROAD_WIDTH) - x - dx, playerY + currentCameraHeight, position - (segment.looped ? state.current.trackLength : 0), state.current.cameraDepth, width, height, ROAD_WIDTH);
                x = x + dx; dx = dx + segment.curve;
                if ((segment.p1.camera.z <= state.current.cameraDepth) || (segment.p2.screen.y >= segment.p1.screen.y) || (segment.p2.screen.y >= maxy)) continue;
                renderSegment(ctx, width, LANES, segment.p1.screen.x, segment.p1.screen.y, segment.p1.screen.w, segment.p2.screen.x, segment.p2.screen.y, segment.p2.screen.w, segment.fog, segment.color, segment.zebra || false);
                maxy = segment.p1.screen.y;
            }

            // Render sprite, NPC, dan pemain
            for (let n = (DRAW_DISTANCE - 1); n > 0; n--) {
                const segment = segments[(baseSegment.index + n) % segments.length];
                for (let i = 0; i < segment.sprites.length; i++) {
                    const sprite = segment.sprites[i];
                    if (segment.p1.screen.scale > 0.00001) renderSprite(ctx, width, height, height / 480, ROAD_WIDTH, sprite.source, segment.p1.screen.scale, segment.p1.screen.x + (segment.p1.screen.scale * sprite.offset * ROAD_WIDTH * width / 2), segment.p1.screen.y, (sprite.offset < 0 ? -1 : 0), (sprite.offsetY || -1), segment.clip);
                }
                for (let i = 0; i < segment.cars.length; i++) {
                    const car = segment.cars[i];
                    const spriteScale = Util.interpolate(segment.p1.screen.scale, segment.p2.screen.scale, car.percent);
                    const spriteX = Util.interpolate(segment.p1.screen.x, segment.p2.screen.x, car.percent) + (spriteScale * car.offset * ROAD_WIDTH * width / 2);
                    const spriteY = Util.interpolate(segment.p1.screen.y, segment.p2.screen.y, car.percent);
                    if (spriteScale > 0.00001) renderSprite(ctx, width, height, height / 480, ROAD_WIDTH, car.sprite, spriteScale, spriteX, spriteY, (car.offset < 0 ? -1 : 0), -1, segment.clip);
                }
                if (segment == playerSegment && state.current.viewMode === 'third') {
                    renderPlayer(ctx, width, height, height / 480, ROAD_WIDTH, speed / (SEGMENT_LENGTH / (1 / 60)), state.current.cameraDepth / playerZ, width / 2, height / 2, (state.current.keyLeft ? -1 : state.current.keyRight ? 1 : 0), playerSegment.p2.world.y - playerSegment.p1.world.y, 'third', state.current, gameState);
                }
            }
            if (state.current.viewMode === 'first') {
                renderPlayer(ctx, width, height, height / 480, ROAD_WIDTH, speed / (SEGMENT_LENGTH / (1 / 60)), 1, width / 2, height / 2, (state.current.keyLeft ? -1 : state.current.keyRight ? 1 : 0), 0, 'first', state.current, gameState);
            }
        };

        // --- Logika Cek Garis Finish ---
        const checkFinishLine = () => {
            const { position: pos, trackLength, playerZ: pZ } = state.current;
            if (pos > trackLength - pZ && gameState !== 'finished' && !state.current.hasFinishedLine) {
                const questions = state.current.allQuizQuestions;
                const hasQuizRemaining = questions.length > 0 && state.current.quizQuestionIndex < questions.length;
                if (questions.length === 0) { console.warn("[NitroQuiz] Finish line hit but no questions loaded yet."); state.current.speed = 0; return; }
                state.current.hasFinishedLine = true;
                isFinishingRef.current = true; setIsFinishingOverlay(true); state.current.speed = 0;
                const currentRound = lapRace + 1;
                if (hasQuizRemaining) {
                    (async () => {
                        const participantId = localStorage.getItem('nitroquiz_game_participantId');
                        if (participantId) {
                            try {
                                const { data: pData } = await supabaseGame.from('participants').select('lap_race').eq('id', participantId).single();
                                const newLap = (pData?.lap_race || 0) + 1;
                                const { error } = await supabaseGame.from('participants').update({ lap_race: newLap, minigame: false }).eq('id', participantId);
                                if (!error) { localStorage.setItem('nitroquiz_game_lapRace', String(newLap)); setLapRace(newLap); }
                            } catch (e) { console.error("[NitroQuiz] Error updating minigame status:", e); }
                        }
                        localStorage.setItem('nitroquiz_game_questionIndex', state.current.quizQuestionIndex.toString());
                        localStorage.setItem('nitroquiz_game_score', state.current.totalQuizScore.toString());
                        setTimeout(() => { router.push(`/player/${roomCode}/quiz`); }, 500);
                    })();
                } else {
                    const participantId = localStorage.getItem('nitroquiz_game_participantId');
                    if (participantId) supabaseGame.from('participants').update({ lap_race: currentRound }).eq('id', participantId).then();
                    setGameState('finished'); endGame();
                }
            }
        };

        // --- Game Loop ---
        const loop = (time: number) => {
            if (gameState === 'playing' && !isFinishingRef.current) {
                const dt = Math.min(1, (time - lastTime) / 1000);
                updateGame(state.current, dt, { gameState, isMobile, mobileOrientationChoice, aspectRatio, lapRace, setStats });
                checkFinishLine();
            }
            renderFrame();
            if (time - miniMapUpdateTime > 100) { drawMiniMap(miniMapRef.current, state.current); miniMapUpdateTime = time; }
            lastTime = time;
            animationFrameRef.current = requestAnimationFrame(loop);
        };
        animationFrameRef.current = requestAnimationFrame(loop);
        return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
    }, [assetsLoaded, gameState === 'playing']);

    // --- Resize & Orientasi ---
    useEffect(() => {
        const handleResize = () => setSize(canvasRef);
        window.addEventListener('resize', handleResize);
        if (mounted) setSize(canvasRef);
        if (isMobile && mobileOrientationChoice === 'landscape' && aspectRatio < 1) {
            if (screen.orientation && (screen.orientation as any).lock) (screen.orientation as any).lock('landscape').catch(() => { });
        }
        return () => window.removeEventListener('resize', handleResize);
    }, [mounted, isMobile, mobileOrientationChoice, aspectRatio, setSize]);

    // --- Mobile auto-gas ---
    useEffect(() => { if (isMobile && gameState === 'playing') state.current.keyFaster = true; }, [isMobile, gameState]);

    // --- Handler pilihan orientasi ---
    const handleOrientationSelect = (orientation: 'portrait' | 'landscape') => {
        setMobileOrientationChoice(orientation);
        localStorage.setItem('nitroquiz_orientation', orientation);
    };

    // ==========================================
    // RENDER JSX
    // ==========================================
    return (
        <div dir="ltr" style={{
            width: '100%', height: '100%', background: '#020617', overflow: 'hidden',
            fontFamily: 'var(--font-rajdhani)', userSelect: 'none', touchAction: 'none',
            WebkitUserSelect: 'none', textAlign: 'left',
            filter: (stats.speed > 150 ? `blur(${((stats.speed - 150) / 60) + (state.current.keyBoost && stats.nos > 0 ? 2 : 0)}px) ` : (state.current.keyBoost && stats.nos > 0 ? 'blur(2px) ' : '')) + 'contrast(1.05) brightness(1) saturate(1.1)',
            transition: 'filter 0.4s ease'
        }}>
            {/* Canvas Game Utama */}
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />

            {/* Overlay Pilihan Orientasi Mobile */}
            {mounted && isMobile && assetsLoaded && !mobileOrientationChoice && (
                <OrientationPicker onSelect={handleOrientationSelect} />
            )}

            {/* HUD Game (Overlay UI) */}
            {mounted && assetsLoaded && (isMobile ? !!mobileOrientationChoice : true) && (
                <GameHUD
                    stateRef={state} stats={stats} globalTimeLeft={globalTimeLeft}
                    viewMode={viewMode} setViewMode={setViewMode}
                    isMuted={isMuted} toggleMute={toggleMute}
                    isMobile={isMobile} usePCLayout={usePCLayout}
                    isMobilePortrait={isMobilePortrait} isMobileLandscape={isMobileLandscape}
                    miniMapRef={miniMapRef} miniMapMinimized={miniMapMinimized}
                    setMiniMapMinimized={setMiniMapMinimized}
                    lapRace={lapRace}
                    isBraking={isBraking} setIsBraking={setIsBraking}
                    isBoosting={isBoosting} setIsBoosting={setIsBoosting}
                />
            )}

            <style jsx global>{`@keyframes countdown-scale { 0% { transform: scale(0.8); opacity: 0; } 50% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }`}</style>

            {/* Overlay Loading Utama */}
            {mounted && (!assetsLoaded || !isTimerReady) && <MainLoadingOverlay />}

            {/* Overlay Selesai / Redirect */}
            {(isFinishingOverlay || gameState === 'finished' || gameState === 'gameover') && (
                <FinishOverlay gameState={gameState} isMobile={isMobile} />
            )}

            <style>{`@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }`}</style>
        </div>
    );
}