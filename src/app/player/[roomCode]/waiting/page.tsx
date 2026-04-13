'use client';

/**
 * page.tsx — Halaman Waiting Room Pemain
 * ══════════════════════════════════════
 *
 * Halaman tempat pemain menunggu host memulai permainan.
 * Berfungsi sebagai lobby dari sisi pemain.
 *
 * Fitur utama:
 * 1. Tampilan daftar peserta secara real-time (Supabase Realtime)
 * 2. Pemilihan karakter/mobil (Character Selector)
 * 3. Countdown sinkron berbasis server time (3-2-1-GO!)
 * 4. Preload aset game saat idle (gambar, track, karakter)
 * 5. Auto-redirect ke game setelah countdown selesai
 * 6. Responsive: layout mobile (grid 2 kolom) & desktop (showroom)
 *
 * Status halaman:
 * - loading   : Sedang menghubungkan ke server
 * - waiting   : Menunggu host memulai permainan
 * - countdown : Hitung mundur 3-2-1
 * - go        : Tampilan "GO!" sebelum redirect ke game
 * - error     : Koneksi gagal
 *
 * Struktur komponen:
 * ├── StatusScreens (Loading/Error/Countdown/Go)
 * ├── InitialsAvatar
 * ├── LogoutConfirmDialog
 * └── (inline) Mobile & Desktop Waiting Layouts
 *     └── Character Selector
 *
 * Alur:
 * 1. Fetch session & participants dari database
 * 2. Subscribe ke Supabase Realtime
 * 3. Tampilkan daftar pemain & karakter yang dipilih
 * 4. Saat host mulai → countdown berbasis server time
 * 5. Preload aset game selama menunggu
 * 6. Saat countdown selesai → redirect ke /player/[roomCode]/game
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { syncServerTime, getSyncedServerTime } from '@/lib/serverTime';
import { Loader2, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from "react-i18next";
import { useAuth } from '@/contexts/AuthContext';
import { ASSET_LIST, TRACK_ASSETS } from '@/lib/gameAssets';

// ── Komponen waiting room ──
import {
  InitialsAvatar,
  LoadingScreen,
  ErrorScreen,
  CountdownScreen,
  GoScreen,
  PLAYER_CHARACTERS,
} from "@/components/waiting";
import type { WaitingStatus, WaitingParticipant } from "@/components/waiting";

// Re-export agar file lain yang import PLAYER_CHARACTERS dari sini tetap bekerja
export { PLAYER_CHARACTERS } from "@/components/waiting";

// ════════════════════════════════════════════════════════════════
// Komponen Utama: PlayerWaitingPage
// ════════════════════════════════════════════════════════════════
export default function PlayerWaitingPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const roomCode = (params.roomCode as string)?.toUpperCase();
  const { profile, loading: authLoading } = useAuth();

  // ── State utama ──
  const [status, setStatus] = useState<WaitingStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [assignedCarId, setAssignedCarId] = useState<string>("rico");
  const [isSelectingCharacter, setIsSelectingCharacter] = useState(false);
  const [pendingCharacterId, setPendingCharacterId] = useState<string>("rico");
  const [countdownValue, setCountdownValue] = useState(3);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState(1);
  const [username, setUsername] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [allParticipants, setAllParticipants] = useState<WaitingParticipant[]>([]);
  const [isExiting, setIsExiting] = useState(false);

  // ── Ref untuk status di dalam callback ──
  const statusRef = useRef(status);
  useEffect(() => { statusRef.current = status; }, [status]);

  // ════════════════════════════════════════════════════════════════
  // HOOKS: SINKRONISASI WAKTU SERVER
  // ════════════════════════════════════════════════════════════════

  /** Sinkronisasi waktu server saat komponen dimuat */
  useEffect(() => {
    const initSync = async () => { await syncServerTime(); };
    initSync();
  }, []);

  // ════════════════════════════════════════════════════════════════
  // FUNGSI: COUNTDOWN
  // ════════════════════════════════════════════════════════════════

  /**
   * Memulai countdown sinkron berbasis waktu server.
   * Menggunakan requestAnimationFrame untuk akurasi tinggi.
   * Juga memicu preload data kuis saat countdown dimulai.
   */
  const startCountdown = useCallback((startTime: number, sessId: string) => {
    if (statusRef.current === "countdown" || statusRef.current === "go") return;

    setStatus("countdown");
    statusRef.current = "countdown";
    preloadQuizData(sessId);

    const syncLoop = () => {
      const nowOnServer = getSyncedServerTime();
      const elapsed = nowOnServer - startTime;
      const remaining = Math.max(0, 3000 - elapsed);
      const displayVal = Math.min(3, Math.ceil(remaining / 1000));

      setCountdownValue(displayVal);

      if (remaining > 0 && statusRef.current === "countdown") {
        requestAnimationFrame(syncLoop);
      } else if (remaining <= 0 && statusRef.current === "countdown") {
        setStatus("go");
        setTimeout(() => { router.push(`/player/${roomCode}/game`); }, 800);
      }
    };
    requestAnimationFrame(syncLoop);
  }, [roomCode, router]);

  // ════════════════════════════════════════════════════════════════
  // HOOKS: FETCH DATA & REALTIME
  // ════════════════════════════════════════════════════════════════

  const channelRef = useRef<any>(null);

  /**
   * Hook utama: Fetch session, setup Supabase Realtime channel,
   * dan handle status transisi (waiting → countdown → game).
   */
  useEffect(() => {
    if (authLoading) return;
    let isMounted = true;

    const fetchSessionState = async () => {
      try {
        // Ambil data session berdasarkan kode room
        const { data: sessionData, error: sessionError } = await supabase
          .from("sessions").select("id, status, countdown_started_at, started_at, created_at").eq("game_pin", roomCode).single();

        if (sessionError || !sessionData || !isMounted) {
          if (sessionError) { setStatus("error"); setErrorMessage("Room not found or invalid."); }
          return;
        }

        // Redirect jika session sudah aktif atau selesai
        if (sessionData.status === "active") { router.push(`/player/${roomCode}/game`); return; }
        if (sessionData.status === "finished" || sessionData.status === "completed") { router.push(`/player/${roomCode}/result`); return; }

        // Jika countdown sudah mulai tapi session belum active
        if (sessionData.countdown_started_at && !sessionData.started_at) {
          const startTime = new Date(sessionData.countdown_started_at).getTime();
          const nowOnServer = getSyncedServerTime();
          const elapsed = nowOnServer - startTime;
          const remaining = Math.max(0, 3000 - elapsed);

          if (remaining > 0) {
            startCountdown(startTime, sessionData.id);
          } else {
            // Countdown sudah selesai, langsung redirect
            setStatus("go");
            router.push(`/player/${roomCode}/game`);
            return;
          }
        }

        // Status waiting jika countdown belum dimulai
        if (!sessionData.countdown_started_at) setStatus("waiting");
        setSessionId(sessionData.id);

        // Setup Supabase Realtime (hanya sekali)
        if (!channelRef.current) {
          const channel = supabase.channel(`player-session-${sessionData.id}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionData.id}` },
              () => { fetchSessionState(); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'participants', filter: `session_id=eq.${sessionData.id}` },
              async () => {
                const { data: pList, count } = await supabase.from("participants")
                  .select("id, nickname, car_character, avatar_url", { count: "exact" }).eq("session_id", sessionData.id);
                if (isMounted) {
                  if (count !== null) setParticipantCount(count);
                  if (pList) setAllParticipants(pList);
                }
              })
            .subscribe();
          channelRef.current = channel;
        }

        // Validasi participant dari localStorage
        const storedParticipantId = typeof window !== 'undefined' ? localStorage.getItem('nitroquiz_game_participantId') : null;
        const storedRoomCode = typeof window !== 'undefined' ? localStorage.getItem('nitroquiz_game_roomCode') : null;
        if (!storedParticipantId || storedRoomCode !== roomCode) { router.replace(`/join/${roomCode}`); return; }

        const storedCarCharacter = typeof window !== 'undefined' ? localStorage.getItem('nitroquiz_game_carCharacter') : null;
        const assignedCar = storedCarCharacter || "rico";

        setParticipantId(storedParticipantId);
        setAssignedCarId(assignedCar);
        setPendingCharacterId(assignedCar);

        // Ambil daftar peserta awal
        const { data: pList, count } = await supabase.from("participants")
          .select("id, nickname, car_character, avatar_url", { count: "exact" }).eq("session_id", sessionData.id);

        if (isMounted) {
          if (count !== null) setParticipantCount(count);
          if (pList) {
            setAllParticipants(pList);
            const me = pList.find(p => p.id === storedParticipantId);
            if (me) { setUsername(me.nickname); setUserAvatar(profile?.avatar_url || me.avatar_url || null); }
            else if (profile) { setUsername(profile.username || "Player"); setUserAvatar(profile.avatar_url || null); }
          }
        }
      } catch (err: any) {
        if (isMounted) { setStatus("error"); setErrorMessage(err.message || "Unknown error occurred."); }
      }
    };

    fetchSessionState();

    // Re-verify saat tab kembali aktif (handle missed realtime events)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("[NitroQuiz] Tab focused, re-verifying session state...");
        fetchSessionState();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [roomCode, router, startCountdown, authLoading, profile]);

  // ════════════════════════════════════════════════════════════════
  // FUNGSI: PRELOAD DATA KUIS
  // ════════════════════════════════════════════════════════════════

  /**
   * Preload data soal kuis ke localStorage saat countdown dimulai.
   * Juga prefetch route game page via link element.
   */
  const preloadQuizData = async (sessId: string) => {
    try {
      const { data } = await supabase.from("sessions")
        .select("current_questions, question_limit, quiz_id, difficulty").eq("id", sessId).single();
      if (data?.current_questions) {
        let questions = data.current_questions;
        if (typeof questions === 'string') { try { questions = JSON.parse(questions); } catch (e) { } }
        localStorage.setItem('nitroquiz_game_questions', JSON.stringify(questions));
        localStorage.setItem('nitroquiz_game_roomCode', roomCode);
        localStorage.setItem('nitroquiz_game_sessionId', sessId);
        localStorage.setItem('nitroquiz_game_difficulty', data.difficulty || 'easy');
        if (data.quiz_id) localStorage.setItem('nitroquiz_game_quizId', data.quiz_id);
        localStorage.removeItem('nitroquiz_game_score');
        localStorage.removeItem('nitroquiz_game_questionIndex');
      }

      const route = `/player/${roomCode}/game`;
      const link = document.createElement('link'); link.rel = 'prefetch'; link.href = route; document.head.appendChild(link);
    } catch (err) { console.error('Failed to preload quiz:', err); }
  };

  // ════════════════════════════════════════════════════════════════
  // HOOKS: PRELOAD ASET GAME
  // ════════════════════════════════════════════════════════════════

  /**
   * Hook: Preload aset game secara background saat idle (2 detik setelah mount).
   * Non-blocking: setiap Image di-load asinkron oleh browser.
   */
  useEffect(() => {
    const preloadAssets = () => {
      console.log("[NitroQuiz] Starting background asset preload...");
      if (typeof window === 'undefined') return;
      if (!(window as any).__nitroquiz_asset_store) { (window as any).__nitroquiz_asset_store = {}; }
      const store = (window as any).__nitroquiz_asset_store;
      let charId = 'rico'; // Forced to 'rico'
      let loaded = 0;
      let total = 0;

      const onDone = () => {
        loaded++;
        if (loaded === total) console.log(`[NitroQuiz] Preload complete: ${loaded}/${total} assets cached.`);
      };

      // 1. ASSET_LIST (karakter, UI, efek)
      ASSET_LIST.forEach(asset => {
        if (!asset.src) return;
        total++;
        let src = asset.src;
        if (src.includes('/characters/rico/')) src = src.replace('/characters/rico/', `/characters/${charId}/`);
        const img = new Image();
        img.onload = () => { (img as any).assetName = asset.name; store[asset.name] = img; onDone(); };
        img.onerror = () => onDone();
        img.src = src;
      });

      // 2. TRACK_ASSETS (jalan, landmark, obstacle)
      const uniqueTrackSources = Array.from(new Set(TRACK_ASSETS.map(item => item.src))).filter(Boolean);
      uniqueTrackSources.forEach(src => {
        if (store[src]) return;
        total++;
        const img = new Image();
        img.onload = () => { (img as any).assetName = src; store[src] = img; onDone(); };
        img.onerror = () => onDone();
        img.src = src;
      });

      // 3. Visual showroom karakter
      PLAYER_CHARACTERS.forEach(char => {
        [char.imageSrc, char.gifSrc].filter(Boolean).forEach(src => {
          if (!src || store[src]) return;
          total++;
          const img = new Image();
          img.onload = () => { store[src] = img; onDone(); };
          img.onerror = () => onDone();
          img.src = src;
        });
      });

      if (total === 0) console.log("[NitroQuiz] No assets to preload.");
    };

    // Tunda 2 detik agar UI waiting room ter-mount dulu
    const timeout = setTimeout(preloadAssets, 2000);
    return () => clearTimeout(timeout);
  }, [assignedCarId]);

  // ════════════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ════════════════════════════════════════════════════════════════

  /**
   * Handler pilih karakter: update ke database dan state lokal.
   */
  const handleSelectCharacter = async () => {
    if (participantId && sessionId && pendingCharacterId !== assignedCarId) {
      await supabase.from("participants").update({ car_character: pendingCharacterId }).eq("id", participantId);
    }
    setAssignedCarId(pendingCharacterId);
    setIsSelectingCharacter(false);
  };

  // ════════════════════════════════════════════════════════════════
  // DATA TURUNAN
  // ════════════════════════════════════════════════════════════════

  /** Karakter yang sedang dipakai pemain */
  const assignedChar = PLAYER_CHARACTERS.find(c => c.id === assignedCarId) || PLAYER_CHARACTERS[0];
  /** Visual karakter (gif jika ada, fallback ke image statis) */
  const displayVisual = assignedChar.gifSrc || assignedChar.imageSrc;
  /** Daftar peserta lain (bukan diri sendiri) */
  const otherParticipants = allParticipants.filter(p => p.nickname !== username);

  // ════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════

  return (
    <div className="bg-[#0b101a] text-white min-h-screen relative overflow-hidden font-body flex flex-col items-center justify-center p-4">
      {/* ── Background gradien ── */}
      <div className="fixed inset-0 z-0 bg-gradient-to-t from-[#0b101a] via-transparent to-[#2d6af2]/10 pointer-events-none" />
      <div className="fixed bottom-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#2d6af2]/10 via-[#0a101f]/50 to-[#0a101f] pointer-events-none z-0" />
      <div className="fixed bottom-0 w-full h-1/2 bg-[linear-gradient(transparent_0%,rgba(45,106,242,0.1)_1px,transparent_1px),linear-gradient(90deg,transparent_0%,rgba(45,106,242,0.1)_1px,transparent_1px)] bg-[length:60px_60px] [transform:perspective(500px)_rotateX(60deg)] origin-bottom z-0 pointer-events-none opacity-20" />

      <div className="relative z-20 w-full max-w-sm text-center">

        {/* ══════════════════════════════════════════ */}
        {/* STATUS: LOADING                            */}
        {/* ══════════════════════════════════════════ */}
        {status === "loading" && <LoadingScreen />}

        {/* ══════════════════════════════════════════ */}
        {/* STATUS: ERROR                              */}
        {/* ══════════════════════════════════════════ */}
        {status === "error" && <ErrorScreen message={errorMessage} onGoHome={() => router.push('/')} />}

        {/* ══════════════════════════════════════════ */}
        {/* STATUS: WAITING                            */}
        {/* ══════════════════════════════════════════ */}
        {status === "waiting" && (
          <>
            {/* ═══ MOBILE LAYOUT ═══ */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="md:hidden fixed inset-0 z-30 bg-[#0b101a] flex flex-col">

              {/* Bar atas: logo + status */}
              <div className="flex items-center justify-between px-4 pt-6 pb-3 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <img src="/assets/logo/logo1.png" alt="Logo" className="h-9 object-contain" />
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 text-gray-500 animate-spin" />
                  <span className="font-display text-[9px] text-gray-400 uppercase tracking-[0.2em]">{t("player_waiting.waiting_host")}</span>
                </div>
              </div>

              {/* Header jumlah pemain */}
              <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(80,110,180,0.15)' }}>
                <div className="grid grid-cols-3 gap-0.5 flex-shrink-0">
                  {Array.from({ length: 9 }).map((_, i) => (<div key={i} className="w-1 h-1 rounded-full bg-[#4a7cdc]" />))}
                </div>
                <span className="font-display text-white text-xs font-bold tracking-widest">
                  {t("player_waiting.player", { count: participantCount })}
                </span>
              </div>

              {/* Grid kartu pemain (scrollable) */}
              <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-3 auto-rows-max"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(45,106,242,0.25) transparent' }}>

                {/* Kartu ANDA */}
                <div className="relative rounded-xl overflow-hidden w-full"
                  style={{ background: 'linear-gradient(160deg, rgba(28,42,80,0.95), rgba(22,34,68,0.98))', border: '1.5px solid rgba(60,110,220,0.6)', boxShadow: 'inset 0 0 24px rgba(40,80,180,0.1)', aspectRatio: '1/1.1' }}>
                  <div className="absolute top-1.5 left-1.5 z-10 w-6 h-6 rounded-full border border-white/20 overflow-hidden bg-black/40">
                    {userAvatar ? <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" /> : <InitialsAvatar name={username} size="sm" />}
                  </div>
                  <div className="absolute top-1.5 right-1.5 z-10 font-display font-black text-[8px] tracking-widest px-1.5 py-0.5 rounded" style={{ background: '#00d4ff', color: '#000' }}>
                    {t("player_waiting.you")}
                  </div>
                  <div className="flex items-center justify-center px-4 py-3" style={{ minHeight: '100px' }}>
                    <img src={assignedChar.imageSrc} alt="car" className="w-full max-h-[80px] object-contain drop-shadow-[0_6px_20px_rgba(0,0,0,0.8)]" />
                  </div>
                  <div className="text-center pb-2 px-2">
                    <p className="font-display text-white text-[10px] font-bold tracking-[0.18em] truncate">{username}</p>
                    <p className="font-display text-[#00ff9d] text-[8px] tracking-widest mt-0.5 opacity-80">{assignedChar.name}</p>
                  </div>
                </div>

                {/* Kartu pemain lain */}
                {otherParticipants.map((p, i) => {
                  const charObj = PLAYER_CHARACTERS.find(c => c.id === p.car_character) || PLAYER_CHARACTERS[0];
                  return (
                    <div key={i} className="relative rounded-xl overflow-hidden w-full"
                      style={{ background: 'linear-gradient(160deg, rgba(24,34,62,0.92), rgba(18,26,50,0.95))', border: '1px solid rgba(50,80,160,0.45)', aspectRatio: '1/1.1' }}>
                      <div className="absolute top-1.5 left-1.5 z-10 w-6 h-6 rounded-full border border-white/20 overflow-hidden bg-black/40">
                        {p.avatar_url ? <img src={p.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : <InitialsAvatar name={p.nickname} size="sm" />}
                      </div>
                      <div className="flex items-center justify-center px-4 py-3" style={{ minHeight: '100px' }}>
                        <img src={charObj.imageSrc} alt="car" className="w-full max-h-[80px] object-contain drop-shadow-[0_6px_20px_rgba(0,0,0,0.8)]" />
                      </div>
                      <div className="text-center pb-2 px-2">
                        <p className="font-display text-white text-[10px] font-bold tracking-[0.18em] truncate">{p.nickname}</p>
                        <p className="font-display text-[#00d4ff] text-[8px] tracking-widest mt-0.5 opacity-80">{charObj.name}</p>
                      </div>
                    </div>
                  );
                })}

                {/* Slot kosong (menunggu pemain) */}
                <div className="relative rounded-xl overflow-hidden w-full flex flex-col items-center justify-center"
                  style={{ background: 'rgba(18,26,50,0.5)', border: '1px dashed rgba(50,80,160,0.3)', aspectRatio: '1/1.1' }}>
                  <svg viewBox="0 0 180 80" className="w-[80px] h-[35px] opacity-15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="8" y="28" width="164" height="34" rx="12" stroke="#7090cc" strokeWidth="2" />
                    <rect x="42" y="12" width="96" height="28" rx="9" stroke="#7090cc" strokeWidth="2" />
                    <circle cx="42" cy="66" r="11" stroke="#7090cc" strokeWidth="2" />
                    <circle cx="138" cy="66" r="11" stroke="#7090cc" strokeWidth="2" />
                  </svg>
                  <p className="text-[8px] uppercase tracking-widest font-mono mt-1" style={{ color: 'rgba(120,140,180,0.45)' }}>
                    {t("player_waiting.waiting_player")}
                  </p>
                </div>
              </div>

              {/* Bar bawah: tombol keluar & pilih karakter */}
              <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(14,18,30,0.8)' }}>
                <button onClick={() => router.push('/')} className="w-11 h-11 flex items-center justify-center rounded-xl bg-[#1a0a12] border border-red-500/50 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all flex-shrink-0">
                  <LogOut className="w-4 h-4" />
                </button>
                <button onClick={() => setIsSelectingCharacter(true)} className="flex-1 h-11 flex items-center justify-center rounded-xl border border-[#00ff9d]/60 text-[#00ff9d] font-display text-xs uppercase tracking-widest hover:bg-[#00ff9d]/10 active:scale-95 transition-all">
                  {t("player_waiting.choose_character")}
                </button>
              </div>
            </motion.div>

            {/* ═══ DESKTOP LAYOUT — Racing Lobby Showroom ═══ */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="hidden md:block fixed inset-0 z-30"
              style={{ background: 'linear-gradient(180deg, #1a1f2e 0%, #1c2235 40%, #161c2c 100%)' }}>

              {/* Background showroom */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-[38%] w-[1px] h-[40%] bg-gradient-to-b from-white/20 to-transparent" />
                <div className="absolute top-0 left-[52%] w-[1px] h-[50%] bg-gradient-to-b from-white/14 to-transparent" />
                <div className="absolute top-0 left-[66%] w-[1px] h-[40%] bg-gradient-to-b from-white/18 to-transparent" />
                <div className="absolute top-0 left-[80%] w-[1px] h-[35%] bg-gradient-to-b from-white/12 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 h-[35%] bg-gradient-to-t from-[#10141f] to-transparent" />
                <div className="absolute bottom-[22%] left-[62%] w-[380px] h-[50px] -translate-x-1/2 bg-[#3060c0]/10 blur-3xl rounded-full" />
              </div>

              {/* Bar atas desktop */}
              <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-6 py-3"
                style={{ background: 'rgba(14,18,30,0.75)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex flex-col leading-none"><img src="/assets/logo/logo1.png" alt="Logo" className="h-10 object-contain" /></div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-[11px] text-gray-300 uppercase tracking-[0.22em]">{t("player_waiting.waiting_host_desktop")}</span>
                  <Loader2 className="w-3.5 h-3.5 text-gray-500 animate-spin" />
                </div>
                <div className="flex flex-col leading-none"><img src="/assets/logo/logo2.png" alt="NitroQuiz" className="h-10 object-contain" /></div>
              </div>

              {/* ── Panel kiri: daftar pemain ── */}
              <div className="absolute top-[85px] left-6 bottom-[85px] z-10 flex flex-col min-h-0 w-[320px] lg:w-[480px] xl:w-[680px]">
                <div className="flex-1 flex flex-col min-h-0 rounded-2xl overflow-hidden shadow-2xl"
                  style={{ background: 'rgba(30,38,62,0.72)', border: '1px solid rgba(80,110,180,0.3)', backdropFilter: 'blur(16px)', boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}>

                  {/* Header panel */}
                  <div className="flex items-center gap-2.5 px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(80,110,180,0.2)' }}>
                    <div className="grid grid-cols-3 gap-0.5 flex-shrink-0">
                      {Array.from({ length: 9 }).map((_, i) => (<div key={i} className="w-1.5 h-1.5 rounded-full bg-[#4a7cdc]" />))}
                    </div>
                    <div className="flex flex-col text-left justify-center">
                      <span className="font-display text-white text-sm font-bold tracking-widest leading-none block">{t("player_waiting.player", { count: participantCount })}</span>
                    </div>
                  </div>

                  {/* Grid kartu pemain (scrollable) */}
                  <div className="flex-1 overflow-y-auto p-4 md:p-5 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-max"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(45,106,242,0.25) transparent' }}>

                    {/* Kartu ANDA (desktop) */}
                    <div className="relative rounded-xl overflow-hidden h-[190px] w-full"
                      style={{ background: 'linear-gradient(160deg, rgba(28,42,80,0.95), rgba(22,34,68,0.98))', border: '1.5px solid rgba(60,110,220,0.6)', boxShadow: 'inset 0 0 24px rgba(40,80,180,0.1)' }}>
                      <div className="absolute top-2 left-2 z-10 w-8 h-8 rounded-full border border-white/20 overflow-hidden bg-black/40">
                        {userAvatar ? <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" /> : <InitialsAvatar name={username} size="sm" />}
                      </div>
                      <div className="absolute top-2 right-2 z-10 font-display font-black text-[10px] tracking-widest px-2 py-0.5 rounded" style={{ background: '#00d4ff', color: '#000' }}>{t("player_waiting.you")}</div>
                      <div className="flex items-center justify-center px-6 py-5" style={{ minHeight: '150px' }}>
                        <img src={assignedChar.imageSrc} alt="car" className="w-full max-h-[110px] object-contain drop-shadow-[0_6px_20px_rgba(0,0,0,0.8)]" />
                      </div>
                      <div className="text-center pb-3 px-3">
                        <p className="font-display text-white text-xs font-bold tracking-[0.18em] truncate" title={username}>{username}</p>
                        <p className="font-display text-[#00ff9d] text-[9px] tracking-widest mt-1 opacity-80">{assignedChar.name}</p>
                      </div>
                    </div>

                    {/* Kartu pemain lain (desktop) */}
                    {otherParticipants.map((p, i) => {
                      const charObj = PLAYER_CHARACTERS.find(c => c.id === p.car_character) || PLAYER_CHARACTERS[0];
                      return (
                        <div key={i} className="relative rounded-xl overflow-hidden h-[190px] w-full"
                          style={{ background: 'linear-gradient(160deg, rgba(24,34,62,0.92), rgba(18,26,50,0.95))', border: '1px solid rgba(50,80,160,0.45)' }}>
                          <div className="absolute top-2 left-2 z-10 w-8 h-8 rounded-full border border-white/20 overflow-hidden bg-black/40">
                            {p.avatar_url ? <img src={p.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : <InitialsAvatar name={p.nickname} size="sm" />}
                          </div>
                          <div className="flex items-center justify-center px-6 py-5" style={{ minHeight: '150px' }}>
                            <img src={charObj.imageSrc} alt="car" className="w-full max-h-[110px] object-contain drop-shadow-[0_6px_20px_rgba(0,0,0,0.8)]" />
                          </div>
                          <div className="text-center pb-3 px-3">
                            <p className="font-display text-white text-xs font-bold tracking-[0.18em] truncate" title={p.nickname}>{p.nickname}</p>
                            <p className="font-display text-[#00d4ff] text-[9px] tracking-widest mt-1 opacity-80">{charObj.name}</p>
                          </div>
                        </div>
                      );
                    })}

                    {/* Slot kosong (desktop) */}
                    <div className="relative rounded-xl overflow-hidden h-[190px] w-full"
                      style={{ background: 'rgba(18,26,50,0.5)', border: '1px dashed rgba(50,80,160,0.3)' }}>
                      <div className="flex items-center justify-center px-6 py-5" style={{ minHeight: '150px' }}>
                        <svg viewBox="0 0 180 80" className="w-[160px] h-[70px] opacity-15" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="8" y="28" width="164" height="34" rx="12" stroke="#7090cc" strokeWidth="2" />
                          <rect x="42" y="12" width="96" height="28" rx="9" stroke="#7090cc" strokeWidth="2" />
                          <circle cx="42" cy="66" r="11" stroke="#7090cc" strokeWidth="2" />
                          <circle cx="138" cy="66" r="11" stroke="#7090cc" strokeWidth="2" />
                          <line x1="8" y1="42" x2="172" y2="42" stroke="#7090cc" strokeWidth="1" strokeDasharray="6 4" />
                        </svg>
                      </div>
                      <div className="text-center pb-3 px-3">
                        <p className="text-[10px] uppercase tracking-widest font-mono" style={{ color: 'rgba(120,140,180,0.45)' }}>{t("player_waiting.waiting_player")}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Panel kanan: showroom / character selector ── */}
              {isSelectingCharacter ? (
                /* Mode: Pilih karakter */
                <div className="absolute z-10 flex flex-col items-center justify-center right-0 md:left-[340px] lg:left-[500px] xl:left-[700px]" style={{ top: '60px', bottom: '64px', right: '20px' }}>
                  <h2 className="font-display text-2xl font-black text-white uppercase tracking-wider mb-8 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                    {t("player_waiting.choose_racer")}
                  </h2>
                  <div className="flex items-center gap-6 w-full justify-center px-4 overflow-hidden relative">
                    <button className="z-20 w-10 h-10 flex items-center justify-center bg-[#151f38] rounded-xl hover:bg-[#1c294a] transition-colors shadow-lg flex-shrink-0">
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <div className="flex justify-center gap-5 items-center overflow-x-auto no-scrollbar py-6 px-4">
                      {PLAYER_CHARACTERS.map((c) => {
                        const isSel = pendingCharacterId === c.id;
                        return (
                          <div key={c.id} onClick={() => setPendingCharacterId(c.id)}
                            className={`relative flex flex-col items-center justify-center p-4 rounded-[16px] transition-all cursor-pointer ${isSel ? 'bg-[#182136] border-2 border-[#e6fdff]' : 'bg-[#111726] border border-[#2d4060]'}`}
                            style={{ width: '240px', height: '240px', boxShadow: isSel ? '0 0 25px rgba(120,240,255,0.4), inset 0 0 20px rgba(120,240,255,0.15)' : 'none' }}>
                            <div className="w-full mb-3 relative flex items-center justify-center" style={{ height: '120px' }}>
                              <img src={c.imageSrc} alt={c.name} className="w-full h-full object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.8)]" />
                            </div>
                            <h3 className="font-display text-[15px] font-bold text-white uppercase tracking-[0.1em] text-center mt-auto mb-2">{c.name}</h3>
                          </div>
                        );
                      })}
                    </div>
                    <button className="z-20 w-10 h-10 flex items-center justify-center bg-[#151f38] rounded-xl hover:bg-[#1c294a] transition-colors shadow-lg flex-shrink-0">
                      <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  <div className="flex gap-6 mt-8">
                    <button onClick={() => { setIsSelectingCharacter(false); setPendingCharacterId(assignedCarId); }}
                      className="w-[160px] py-3.5 rounded-full font-display text-[14px] font-bold uppercase tracking-widest text-white bg-[#22b7ca] hover:bg-[#1fa1b2] transition-colors shadow-[0_4px_15px_rgba(34,183,202,0.4)]">
                      {t("player_waiting.back")}
                    </button>
                    <button onClick={handleSelectCharacter}
                      className="w-[160px] py-3.5 rounded-full font-display text-[14px] font-bold uppercase tracking-widest text-white bg-[#22b7ca] hover:bg-[#1fa1b2] transition-colors shadow-[0_4px_15px_rgba(34,183,202,0.4)]">
                      {t("player_waiting.select")}
                    </button>
                  </div>
                </div>
              ) : (
                /* Mode: Showroom (tampilkan mobil terpilih) */
                <>
                  <div className="absolute z-10 text-left md:left-[360px] lg:left-[520px] xl:left-[720px]" style={{ top: '85px' }}>
                    <h2 className="font-display text-2xl font-black text-white uppercase tracking-wider leading-none">{assignedChar.name}</h2>
                  </div>
                  <div className="absolute z-10 flex flex-col gap-6 items-center justify-center right-0 md:left-[340px] lg:left-[500px] xl:left-[700px]"
                    style={{ top: '60px', bottom: '64px' }}>
                    <motion.div className="relative flex items-center justify-center"
                      style={{ width: 'clamp(300px, 45vw, 560px)', height: '52vh' }}
                      animate={{ y: [0, -14, 0] }}
                      transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}>
                      <img src={displayVisual} alt="Your Car"
                        className="object-contain drop-shadow-[0_28px_60px_rgba(40,70,200,0.22)] relative z-10"
                        style={{ width: '100%', maxHeight: '100%' }} />
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-3/4 h-3 bg-black/40 blur-xl rounded-full" />
                    </motion.div>
                    <button onClick={() => { setPendingCharacterId(assignedCarId); setIsSelectingCharacter(true); }}
                      className="flex items-center gap-2 px-10 py-3 rounded-full font-display text-[13px] font-bold uppercase tracking-[0.2em] text-white active:scale-95 transition-all outline-none"
                      style={{ background: 'linear-gradient(135deg, #0fa8c4, #0880b8)', boxShadow: '0 0 22px rgba(15,168,196,0.4)', border: '1px solid rgba(0,255,255,0.2)' }}>
                      {t("player_waiting.choose_character")}
                    </button>
                  </div>
                </>
              )}

              {/* Bar bawah desktop */}
              <div className="absolute bottom-0 inset-x-0 z-20 flex items-center px-6 py-3"
                style={{ background: 'rgba(14,18,30,0.8)', backdropFilter: 'blur(14px)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button onClick={() => router.push('/')}
                  className="w-11 h-11 flex items-center justify-center rounded-xl active:scale-95 transition-all flex-shrink-0"
                  style={{ background: 'rgba(180,30,50,0.15)', border: '1px solid rgba(200,40,60,0.35)', color: '#f87171' }}>
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </>
        )}

        {/* ══════════════════════════════════════════ */}
        {/* MOBILE CHARACTER SELECTOR OVERLAY          */}
        {/* ══════════════════════════════════════════ */}
        {isSelectingCharacter && status === "waiting" && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-[100] bg-[#070d1c]/98 backdrop-blur-md flex flex-col items-center justify-center p-4">
            <h2 className="font-display text-lg font-black text-white uppercase tracking-wider mb-6 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
              {t("player_waiting.choose_racer")}
            </h2>
            <div className="flex gap-3 w-full max-w-[380px] justify-center">
              {PLAYER_CHARACTERS.map((c) => {
                const isSel = pendingCharacterId === c.id;
                return (
                  <div key={c.id} onClick={() => setPendingCharacterId(c.id)}
                    className={`relative flex flex-col items-center justify-center p-3 rounded-xl transition-all cursor-pointer flex-1 ${isSel ? 'bg-[#182136] border-2 border-[#e6fdff]' : 'bg-[#111726] border border-[#2d4060]'}`}
                    style={{ boxShadow: isSel ? '0 0 20px rgba(120,240,255,0.3), inset 0 0 15px rgba(120,240,255,0.1)' : 'none' }}>
                    <div className="w-full mb-2 relative flex items-center justify-center" style={{ height: '80px' }}>
                      <img src={c.imageSrc} alt={c.name} className="w-full h-full object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]" />
                    </div>
                    <h3 className="font-display text-[10px] font-bold text-white uppercase tracking-[0.1em] text-center">{c.name}</h3>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-6 w-full max-w-[320px]">
              <button onClick={() => { setIsSelectingCharacter(false); setPendingCharacterId(assignedCarId); }}
                className="flex-1 py-3 rounded-xl font-display text-xs font-bold uppercase tracking-widest text-white bg-white/10 border border-white/20 hover:bg-white/20 transition-colors">
                {t("player_waiting.back")}
              </button>
              <button onClick={handleSelectCharacter}
                className="flex-1 py-3 rounded-xl font-display text-xs font-bold uppercase tracking-widest text-white bg-[#0fa8c4] hover:bg-[#0880b8] transition-colors shadow-[0_0_15px_rgba(15,168,196,0.4)]">
                {t("player_waiting.select")}
              </button>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════ */}
        {/* STATUS: COUNTDOWN                          */}
        {/* ══════════════════════════════════════════ */}
        {status === "countdown" && <CountdownScreen value={countdownValue} />}

        {/* ══════════════════════════════════════════ */}
        {/* STATUS: GO!                                */}
        {/* ══════════════════════════════════════════ */}
        {status === "go" && <GoScreen />}
      </div>
    </div>
  );
}