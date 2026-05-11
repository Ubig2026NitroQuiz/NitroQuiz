"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, Play, LogOut, Copy, Check, Maximize2, Minimize2,
  Volume2, VolumeX, X, UserPlus, Users2, Bot, Search
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import Image from "next/image";
import { syncServerTime, getSyncedServerTime } from '@/lib/serverTime';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogOverlay,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useBgm } from "@/contexts/BgmContext";
import { FloatingHostActions } from "@/components/FloatingHostActions";
import { createGFSClient } from "@/lib/supabase/gfs-client";
import { supabaseGame } from "@/lib/supabase/game-client";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

// Helper: Generate initials from a name
const getInitials = (name: string): string => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};


const AVATAR_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#10b981', '#ec4899', '#06b6d4', '#f97316'];
const getAvatarColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const InitialsAvatar = ({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) => {
  const fontSize = size === 'lg' ? 'text-[20px]' : size === 'md' ? 'text-[16px]' : 'text-[10px]';
  return (
    <div
      className="w-full h-full rounded-full flex items-center justify-center font-black text-white"
      style={{ backgroundColor: getAvatarColor(name), fontSize }}
    >
      {getInitials(name)}
    </div>
  );
};



export default function HostLobby() {
  const supabaseCentral = createGFSClient();
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { isMuted, toggleMute } = useBgm();
  const roomCode = params.roomCode as string;

  const [participants, setParticipants] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [joinLink, setJoinLink] = useState("");
  const [copiedRoom, setCopiedRoom] = useState(false);
  const [copiedJoin, setCopiedJoin] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [inviteFriendOpen, setInviteFriendOpen] = useState(false);
  const [inviteGroupOpen, setInviteGroupOpen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [kickDialogOpen, setKickDialogOpen] = useState(false);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [searchGroupQuery, setSearchGroupQuery] = useState("");
  const [invitedGroups, setInvitedGroups] = useState<string[]>([]);
  const [inviteToastVisible, setInviteToastVisible] = useState(false);
  const [searchFriendQuery, setSearchFriendQuery] = useState("");
  const [invitedFriends, setInvitedFriends] = useState<string[]>([]);
  const [mutualFriends, setMutualFriends] = useState<any[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  // Fetch mutual friends (saling follow — kedua arah harus ada) when dialog opens
  useEffect(() => {
    if (!inviteFriendOpen || !profile?.id) return;
    const fetchMutualFriends = async () => {
      setLoadingFriends(true);
      try {
        // Get users that I follow (I am the requester)
        const { data: iFollow, error: e1 } = await supabaseCentral
          .from('friendships')
          .select('addressee_id')
          .eq('requester_id', profile.id)
          .eq('status', 'accepted');

        // Get users that follow me (I am the addressee)
        const { data: followMe, error: e2 } = await supabaseCentral
          .from('friendships')
          .select('requester_id')
          .eq('addressee_id', profile.id)
          .eq('status', 'accepted');

        if (e1 || e2) {
          console.error('Error fetching friendships:', e1 || e2);
          setLoadingFriends(false);
          return;
        }

        // Mutual = intersection (users I follow AND who follow me back)
        const iFollowIds = new Set((iFollow || []).map((f: any) => f.addressee_id));
        const followMeIds = new Set((followMe || []).map((f: any) => f.requester_id));
        const mutualIds = [...iFollowIds].filter(id => followMeIds.has(id));

        if (mutualIds.length === 0) {
          setMutualFriends([]);
          setLoadingFriends(false);
          return;
        }

        // Fetch profiles for mutual friend IDs
        const { data: profiles, error: profileError } = await supabaseCentral
          .from('profiles')
          .select('id, username, nickname, fullname, avatar_url')
          .in('id', mutualIds);

        if (profileError) {
          console.error('Error fetching friend profiles:', profileError);
          setLoadingFriends(false);
          return;
        }

        setMutualFriends(profiles || []);
      } catch (e) {
        console.error('Failed to fetch mutual friends:', e);
      } finally {
        setLoadingFriends(false);
      }
    };
    fetchMutualFriends();
  }, [inviteFriendOpen, profile?.id]);

  const filteredFriends = mutualFriends.filter(f => {
    const q = searchFriendQuery.toLowerCase();
    return (f.username || '').toLowerCase().includes(q) ||
      (f.nickname || '').toLowerCase().includes(q) ||
      (f.fullname || '').toLowerCase().includes(q);
  });

  const handleInviteFriend = async (friendId: string) => {
    setInvitedFriends(prev => [...prev, friendId]);
    setInviteToastVisible(true);
    setTimeout(() => {
      setInviteToastVisible(false);
    }, 3000);

    // Insert notification for the invited friend
    if (profile?.id && sessionId) {
      try {
        await supabaseCentral.from('notifications').insert({
          user_id: friendId,        // yang diundang
          actor_id: profile.id,     // pengundang
          type: 'sessionFriend',
          entity_type: 'session',
          entity_id: sessionId,
        });
      } catch (e) {
        console.error('Failed to send invite notification:', e);
      }
    }
  };

  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Fetch groups where user is a member when dialog opens
  useEffect(() => {
    if (!inviteGroupOpen || !profile?.id) return;
    const fetchGroups = async () => {
      setLoadingGroups(true);
      try {
        const { data, error } = await supabaseCentral
          .from('groups')
          .select('id, name, members, creator_id')
          .is('deleted_at', null);

        if (error) {
          console.error('Error fetching groups:', error);
          setLoadingGroups(false);
          return;
        }

        // Filter groups where the user is a member and determine their role
        const myGroups = (data || []).reduce((acc: any[], group: any) => {
          const members = Array.isArray(group.members) ? group.members : [];
          const member = members.find(
            (m: any) => (m.user_id === profile.id || m.id === profile.id)
          );
          if (member) {
            // Determine role: creator is always owner
            let role = member.role || 'member';
            if (group.creator_id === profile.id) role = 'owner';
            acc.push({
              id: group.id,
              name: group.name,
              membersCount: members.length,
              members,
              role,
            });
          }
          return acc;
        }, []);

        setUserGroups(myGroups);
      } catch (e) {
        console.error('Failed to fetch groups:', e);
      } finally {
        setLoadingGroups(false);
      }
    };
    fetchGroups();
  }, [inviteGroupOpen, profile?.id]);

  const filteredGroups = userGroups.filter(g => g.name.toLowerCase().includes(searchGroupQuery.toLowerCase()));

  const handleInviteGroup = async (groupId: string) => {
    // Find group data from state
    const group = userGroups.find(g => g.id === groupId);
    if (!group) return;

    // Filter members: exclude the inviter
    const members = Array.isArray(group.members) ? group.members : [];
    const recipientIds = members
      .map((m: any) => m.user_id || m.id)
      .filter((id: string) => id && id !== profile?.id);

    // Build notification rows (content left as DB default)
    const notifications = recipientIds.map((userId: string) => ({
      user_id: userId,
      actor_id: profile?.id,
      type: 'sessionGroup',
      entity_type: 'session',
      entity_id: sessionId,
      from_group_id: groupId,
    }));

    // Insert to central DB
    if (notifications.length > 0) {
      const { error } = await supabaseCentral
        .from('notifications')
        .insert(notifications);

      if (error) {
        console.error('Failed to send group notifications:', error);
      }
    }

    // Update UI
    setInvitedGroups(prev => [...prev, groupId]);
    setInviteToastVisible(true);
    setTimeout(() => setInviteToastVisible(false), 3000);
  };

  const [sessionId, setSessionId] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    await syncServerTime(); // Ensure offset is ready before logic
    const { data, error } = await supabaseGame
      .from("sessions")
      .select("*")
      .eq("game_pin", roomCode)
      .single();
    if (error || !data) return;
    setSession(data);
    setSessionId(data.id);

    // Resume countdown if it started but not finished
    if (data.countdown_started_at && data.status !== "active" && data.status !== "finished") {
      const now = getSyncedServerTime();
      const diff = Math.floor((now - new Date(data.countdown_started_at).getTime()) / 1000);
      const remaining = Math.max(0, Math.min(3, 3 - diff));
      if (remaining > 0) {
        setCountdown(remaining);
      } else if (remaining <= 0) {
        const startSessionFallback = async () => {
          await supabaseGame
            .from("sessions")
            .update({
              status: "active",
              started_at: new Date(getSyncedServerTime()).toISOString(),
              countdown_started_at: null
            })
            .eq("id", data.id);
          router.push(`/host/${roomCode}/monitor`);
        };
        startSessionFallback();
      }
    }

    const { data: pData } = await supabaseGame
      .from("participants")
      .select("*")
      .eq("session_id", data.id);
    if (pData) setParticipants(pData);
  }, [roomCode, router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setJoinLink(`${window.location.origin}/join/${roomCode}`);
    }
    loadSession();
  }, [roomCode, loadSession]);

  useEffect(() => {
    if (!sessionId) return;

    const handleStartedOrFinished = (status: string) => {
      if (status === "active") router.push(`/host/${roomCode}/monitor`);
      else if (status === "finished" || status === "completed") router.push(`/host/${roomCode}/leaderboard`);
    };

    const channel = supabaseGame
      .channel(`lobby-${roomCode}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "participants", filter: `session_id=eq.${sessionId}` },
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            setParticipants(prev => {
              if (prev.some(p => p.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
          } else if (payload.eventType === "UPDATE") {
            setParticipants(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
          } else if (payload.eventType === "DELETE") {
            setParticipants(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${sessionId}` },
        (payload: any) => {
          setSession(payload.new);
          // Trigger countdown when server confirms it started
          if (payload.new.countdown_started_at && !payload.new.started_at) {
            setCountdown(prev => prev === null ? 3 : prev);
          }
          handleStartedOrFinished(payload.new.status);
        }
      )
      .subscribe();

    return () => {
      supabaseGame.removeChannel(channel);
    };
  }, [sessionId, roomCode, router]);

  const copyToClipboard = (text: string, setCopied: any) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startGame = async () => {
    if (!session || participants.length === 0) return;
    await syncServerTime(); // Ensure offset is ready before logic
    const nowServer = getSyncedServerTime();
    const isoTime = new Date(nowServer).toISOString();

    // Trigger local state immediately to avoid realtime delays
    setSession((prev: any) => ({ ...prev, countdown_started_at: isoTime }));
    setCountdown(3);

    await supabaseGame
      .from("sessions")
      .update({
        countdown_started_at: isoTime
      })
      .eq("id", session.id);
  };

  useEffect(() => {
    if (countdown === null) return;
    const startTimeStr = session?.countdown_started_at;
    if (!startTimeStr) return;

    let active = true;
    const startTime = new Date(startTimeStr).getTime();

    const checkCountdown = () => {
      const now = getSyncedServerTime();
      const elapsed = Math.max(0, now - startTime);
      const totalCountdown = 3000;
      const remaining = Math.max(0, Math.min(totalCountdown, totalCountdown - elapsed));
      const displayVal = Math.ceil(remaining / 1000);

      setCountdown((prev) => (prev !== displayVal ? displayVal : prev));

      if (remaining <= 0 && active) {
        active = false; // Prevent multiple triggers

        // Trigger start immediately
        const startSession = async () => {
          // 1. Update session to active
          await supabaseGame
            .from("sessions")
            .update({
              status: "active",
              started_at: new Date(getSyncedServerTime()).toISOString(),
              countdown_started_at: null
            })
            .eq("id", session.id);

          router.push(`/host/${roomCode}/monitor`);
        };
        startSession();
        return true; // Finished
      }
      return false; // Ongoing
    };

    const syncLoop = () => {
      if (!active) return;
      const finished = checkCountdown();
      if (!finished) requestAnimationFrame(syncLoop);
    };

    // Secondary interval for background safety (browsers throttle RAF more aggressively than Interval)
    const backgroundInterval = setInterval(() => {
      if (active) checkCountdown();
    }, 1000);

    // Visibility listener to snap back immediately
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && active) {
        checkCountdown();
      }
    };

    requestAnimationFrame(syncLoop);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      active = false;
      clearInterval(backgroundInterval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [session?.countdown_started_at, roomCode]);

  const handleAddBot = async () => {
    if (!session) return;
    const botCount = participants.filter((p) => p.car_character?.endsWith("-bot")).length;
    const botNickname = `CPU_${botCount + 1}`;
    const botCharacters = ['rico-bot', 'roadhog-bot', 'gecho-bot'];
    const selectedChar = botCharacters[Math.floor(Math.random() * botCharacters.length)];

    try {
      await supabaseGame.from("participants").insert({
        session_id: session.id,
        nickname: botNickname,
        car_character: selectedChar,
        score: 0,
        current_question: 0
      });
    } catch (e) {
      console.error("Failed to add bot", e);
    }
  };

  const confirmKick = async () => {
    if (selectedPlayer) {
      await supabaseGame.from("participants").delete().eq("id", selectedPlayer.id);
    }
    setKickDialogOpen(false);
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f] text-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#2d6af2]/30 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-[#2d6af2] text-xl tracking-widest uppercase animate-pulse">{t('host_lobby.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={100}>
    <div className="min-h-screen bg-[#04060f] relative font-body text-white flex flex-col">
      {/* Racing Stripe at top */}
      <div className="racing-stripe z-0 pointer-events-none"></div>

      {/* Background Image matching HomePage */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: 'url("/assets/backgorund/homepage_bg.webp")',
          backgroundAttachment: 'fixed'
        }}
      ></div>

      {/* Overlays for readability mimicking HomePage */}
      <div className="fixed inset-0 z-0 bg-gradient-to-t from-[#04060f] via-[#04060f]/80 to-[#7C3AED]/20 pointer-events-none"></div>

      {/* Very subtle scanlines */}
      <div className="scanlines z-0"></div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col w-full max-w-[1400px] mx-auto px-3 sm:px-6 md:px-8 pt-1 sm:pt-2 pb-2 sm:pb-4 gap-2 sm:gap-3">

        {/* Header */}
        <div className="w-full flex items-center justify-between shrink-0 z-20 relative pt-1">
          <div className="flex items-center gap-2">
            <Logo width={120} height={35} withText={false} animated={false} />
          </div>
          <Image src="/assets/logo/logo2.png" alt="NitroQuiz" width={160} height={40}
            className="object-contain opacity-70 hover:opacity-100 transition-opacity duration-300 drop-shadow-[0_0_8px_rgba(169,141,197,0.4)]" />
        </div>

        {/* Main Layout */}
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">

          {/* ═══ LEFT CARD: Room Info ═══ */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full lg:w-[340px] xl:w-[390px] shrink-0 flex flex-col bg-[#111729]/95 backdrop-blur-xl rounded-xl border border-white/[0.08] shadow-[0_15px_40px_rgba(0,0,0,0.6)] overflow-hidden relative group"
          >
            {/* Animated Cyber Texture */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />
            <div className="absolute top-0 end-0 w-48 h-48 bg-gradient-to-bl from-[#2d6af2]/10 to-transparent rounded-bl-full pointer-events-none z-0"></div>

            {/* ═══ MOBILE / TABLET CONTENT (Below lg) ═══ */}
            <div className="lg:hidden flex flex-col overflow-hidden">
              {/* TOP ROW: Split Info & QR */}
              <div className="flex border-b border-white/5">
                {/* Left Side: Info (Code & Link) */}
                <div className="flex-1 flex flex-col p-2.5 md:p-8 gap-3 md:gap-6 border-r border-white/5 min-w-0">
                  <div
                    className="group/code cursor-pointer bg-white/5 rounded-xl md:rounded-2xl py-4 md:py-8 px-3 md:px-12 border border-white/10 hover:border-[#2d6af2]/50 transition-all flex items-center justify-center relative overflow-hidden"
                    onClick={() => copyToClipboard(roomCode, setCopiedRoom)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#2d6af2]/5 to-transparent opacity-0 group-hover/code:opacity-100 transition-opacity"></div>
                    <h1 className="font-display text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-wider sm:tracking-widest drop-shadow-[0_0_15px_rgba(45,106,242,0.3)] text-center">
                      {roomCode}
                    </h1>
                    <div className="absolute top-1/2 -translate-y-1/2 end-2 md:end-5 opacity-40 group-hover:opacity-100 transition-opacity">
                      {copiedRoom ? <Check size={16} className="md:size-5 text-[#00ff9d]" /> : <Copy size={16} className="md:size-5 text-white/20 group-hover/code:text-[#2d6af2]" />}
                    </div>
                  </div>

                  <div
                    className="flex items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 bg-white/5 rounded-lg md:rounded-xl border border-white/5 cursor-pointer group/link hover:border-[#2d6af2]/30 transition-all relative"
                    onClick={() => copyToClipboard(joinLink, setCopiedJoin)}
                  >
                    <p className="text-white text-[10px] md:text-xs font-mono truncate tracking-wide text-center max-w-[85%]">{joinLink}</p>
                    <div className="absolute top-1/2 -translate-y-1/2 end-2 md:end-4">
                      {copiedJoin ? <Check size={12} className="md:size-3.5 text-[#00ff9d] shrink-0" /> : <Copy size={12} className="md:size-3.5 text-white/20 group-hover/link:text-[#2d6af2] shrink-0" />}
                    </div>
                  </div>

                  {/* TABLET ONLY BUTTONS: Inside left column on md screens */}
                  <div className="hidden md:flex gap-3 mt-auto">
                    <button
                      onClick={() => setExitDialogOpen(true)}
                      className="group/btn bg-red-500/25 border border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] rounded-sm h-14 xl:h-16 px-6 font-display text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center shrink-0 transform -skew-x-[15deg] overflow-hidden relative"
                    >
                      <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
                      <div className="relative z-10 transform skew-x-[15deg]">
                        <LogOut size={22} className="rtl:rotate-180" />
                      </div>
                    </button>
                    <button
                      onClick={startGame}
                      disabled={participants.length === 0 || countdown !== null}
                      className="flex-1 bg-gradient-to-r from-[#2d6af2] to-[#1e40af] hover:from-[#3b7ff6] hover:to-[#2d6af2] text-white border border-[#2d6af2]/50 font-display font-black h-14 xl:h-16 rounded-sm shadow-[0_10px_25px_rgba(45,106,242,0.3)] tracking-[0.2em] uppercase text-lg transition-all disabled:opacity-50 active:scale-[0.98] group/btn overflow-hidden relative transform -skew-x-[15deg]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-1000 ease-in-out"></div>
                      <div className="relative z-10 flex items-center justify-center gap-3 transform skew-x-[15deg]">
                        <Play className="fill-current w-6 h-6" />
                        <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{countdown !== null ? t('host_lobby.starting') : t('host_lobby.start')}</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Right Side: QR Code Area */}
                <div
                  className="w-[100px] sm:w-[160px] md:w-[320px] lg:w-[360px] flex flex-col items-center justify-center p-2 sm:p-4 md:p-8 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors shrink-0"
                  onClick={() => setQrOpen(true)}
                >
                  <div className="bg-white p-1.5 sm:p-3 md:p-5 rounded-lg sm:rounded-xl md:rounded-[2rem] shadow-xl md:shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                    <div className="w-[65px] sm:w-[110px] md:w-[220px] lg:w-[260px] aspect-square">
                      <QRCode value={joinLink} style={{ height: 'auto', maxWidth: '100%', width: '100%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* MOBILE ONLY BUTTONS: Full width row ONLY for phones (< md) */}
              <div className="md:hidden p-4 flex gap-3">
                <button
                  onClick={() => setExitDialogOpen(true)}
                  className="group/btn bg-red-500/25 border border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] rounded-sm h-12 md:h-16 px-4 md:px-6 font-display text-xs md:text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center shrink-0 transform -skew-x-[15deg] overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
                  <div className="relative z-10 transform skew-x-[15deg]">
                    <LogOut size={20} className="md:size-6 rtl:rotate-180" />
                  </div>
                </button>
                <button
                  onClick={startGame}
                  disabled={participants.length === 0 || countdown !== null}
                  className="flex-1 bg-gradient-to-r from-[#2d6af2] to-[#1e40af] hover:from-[#3b7ff6] hover:to-[#2d6af2] text-white border border-[#2d6af2]/50 font-display font-black h-12 md:h-16 rounded-sm shadow-[0_10px_25px_rgba(45,106,242,0.3)] tracking-[0.2em] uppercase text-sm md:text-lg transition-all disabled:opacity-50 active:scale-[0.98] group/btn overflow-hidden relative transform -skew-x-[15deg]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-1000 ease-in-out"></div>
                  <div className="relative z-10 flex items-center justify-center gap-2 md:gap-3 transform skew-x-[15deg]">
                    <Play className="fill-current w-5 h-5 md:w-6 md:h-6" />
                    <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{countdown !== null ? t('host_lobby.starting') : t('host_lobby.start')}</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Hidden Space placeholder for mobile list padding */}
            <div className="lg:hidden h-2 shrink-0" />

            {/* DESKTOP: full vertical layout */}
            <div className="hidden lg:flex flex-col gap-3 p-4 relative z-10">
              {/* Room Code */}
              <div
                className="group/code cursor-pointer bg-white/5 rounded-xl py-3 border border-white/10 hover:border-[#2d6af2]/50 transition-all flex items-center justify-center relative overflow-hidden"
                onClick={() => copyToClipboard(roomCode, setCopiedRoom)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#2d6af2]/5 to-transparent opacity-0 group-hover/code:opacity-100 transition-opacity"></div>
                <h1 className="font-display text-5xl lg:text-6xl font-black text-white text-center drop-shadow-[0_0_15px_rgba(45,106,242,0.5)] tracking-widest">
                  {roomCode}
                </h1>
                <div className="absolute top-1/2 -translate-y-1/2 end-5">
                  {copiedRoom ? <Check size={20} className="text-[#00ff9d]" /> : <Copy size={20} className="text-white/20 group-hover/code:text-[#2d6af2]" />}
                </div>
              </div>

              {/* QR Code — full width */}
              <div
                className="group/qr cursor-pointer bg-white rounded-2xl p-2 shadow-[0_0_40px_rgba(255,255,255,0.08)] transition-all hover:shadow-[0_0_60px_rgba(255,255,255,0.15)] relative overflow-hidden flex items-center justify-center"
                onClick={() => setQrOpen(true)}
              >
                <QRCode value={joinLink} style={{ width: '100%', height: 'auto', maxWidth: 320 }} />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/qr:opacity-100 transition-opacity rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Maximize2 size={36} className="text-white" />
                </div>
              </div>

              {/* Join Link */}
              <div
                className="bg-white/5 rounded-xl py-3 px-4 border border-white/10 hover:border-[#2d6af2]/30 transition-all cursor-pointer group/link flex items-center gap-2"
                onClick={() => copyToClipboard(joinLink, setCopiedJoin)}
              >
                <p className="flex-1 text-white text-xs font-mono tracking-wide truncate">{joinLink}</p>
                <div className="shrink-0">
                  {copiedJoin ? <Check size={14} className="text-[#00ff9d]" /> : <Copy size={14} className="text-white/20 group-hover/link:text-[#2d6af2]" />}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="shrink-0 border-white/5 bg-gradient-to-t relative z-10">
                <div className="flex gap-2">
                  <button
                    onClick={() => setExitDialogOpen(true)}
                    className="bg-red-500/25 border border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] rounded-sm h-12 px-3 sm:px-4 font-display text-sm font-bold uppercase tracking-wider transition-all shrink-0 transform -skew-x-[15deg] group/btn overflow-hidden relative"
                  >
                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
                    <div className="relative z-10 transform skew-x-[15deg] flex items-center gap-1.5">
                      <LogOut size={16} className="rtl:rotate-180" />
                      <span className="hidden sm:inline text-[11px]">{t('host_lobby.exit')}</span>
                    </div>
                  </button>

                  <button
                    onClick={startGame}
                    disabled={participants.length === 0 || countdown !== null}
                    className="flex-1 bg-gradient-to-r from-[#2d6af2] to-[#1e40af] hover:from-[#3b7ff6] hover:to-[#2d6af2] text-white border border-[#2d6af2]/50 font-display font-black h-12 rounded-sm shadow-[0_10px_25px_rgba(45,106,242,0.3)] tracking-[0.15em] uppercase text-sm transition-all disabled:opacity-50 group/btn overflow-hidden relative transform -skew-x-[15deg]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-1000 ease-in-out"></div>
                    <div className="relative z-10 flex items-center justify-center transform skew-x-[15deg]">
                      <Play className="fill-current w-4 h-4 me-2" />
                      <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{countdown !== null ? t('host_lobby.starting') : t('host_lobby.start')}</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>


          </motion.div>

          {/* ═══ RIGHT CARD: Players List ═══ */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 flex flex-col bg-[#111729]/95 backdrop-blur-xl rounded-xl border border-white/[0.08] shadow-[0_15px_40px_rgba(0,0,0,0.6)] relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />
            <div className="absolute top-0 end-0 w-80 h-80 bg-gradient-to-bl from-[#00ff9d]/5 to-transparent rounded-bl-full pointer-events-none z-0"></div>

            {/* Players Header */}
            <div className="px-4 sm:px-5 py-4 flex items-center justify-between border-b border-white/5 shrink-0 relative z-10">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-2.5 bg-[#00ff9d]/10 rounded-xl">
                  <Users size={18} className="text-[#00ff9d] sm:size-5" />
                </div>
                <div className="flex flex-row items-baseline gap-1.5 sm:gap-3">
                  <h2 className="font-display text-xl sm:text-3xl font-bold text-white leading-none">{participants.length}</h2>
                  <p className="text-[#00ff9d] text-[9px] sm:text-[11px] font-bold uppercase font-display tracking-[0.2em]">
                    {participants.length === 1 ? 'PLAYER' : t('host_lobby.players')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Invite Friends */}
                <button
                  onClick={() => setInviteFriendOpen(true)}
                  className="group/hb h-9 px-4 rounded-sm border bg-[#2d6af2]/25 border-[#2d6af2]/60 text-white hover:bg-[#2d6af2]/40 hover:border-[#2d6af2]/80 hover:shadow-[0_0_15px_rgba(45,106,242,0.5)] transition-all font-display text-[10px] uppercase tracking-wider transform -skew-x-[15deg] overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/hb:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
                  <div className="relative z-10 transform skew-x-[15deg] flex items-center gap-1.5">
                    <UserPlus size={14} />
                    <span className="hidden sm:inline">{t('host_lobby.invite_friends') ?? 'Invite Friends'}</span>
                  </div>
                </button>

                {/* Invite Groups */}
                <button
                  onClick={() => setInviteGroupOpen(true)}
                  className="group/hg h-9 px-4 rounded-sm border bg-purple-500/25 border-purple-500/60 text-white hover:bg-purple-500/40 hover:border-purple-500/80 hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all font-display text-[10px] uppercase tracking-wider transform -skew-x-[15deg] overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/hg:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
                  <div className="relative z-10 transform skew-x-[15deg] flex items-center gap-1.5">
                    <Users2 size={14} />
                    <span className="hidden sm:inline">{t('host_lobby.invite_groups') ?? 'Invite Groups'}</span>
                  </div>
                </button>

                {/* Add Bot */}
                <button
                  onClick={handleAddBot}
                  className="group/ht h-9 px-4 rounded-sm border bg-yellow-500/25 border-yellow-500/60 text-white hover:bg-yellow-500/40 hover:border-yellow-500/80 hover:shadow-[0_0_15px_rgba(234,179,8,0.5)] transition-all font-display text-[10px] uppercase tracking-wider transform -skew-x-[15deg] overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/ht:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
                  <div className="relative z-10 transform skew-x-[15deg] flex items-center gap-1.5">
                    <Bot size={14} />
                    <span className="hidden sm:inline">Add Bot</span>
                  </div>
                </button>


              </div>
            </div>

            {/* Players Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 relative z-10">
              {participants.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 py-10">
                  <Users size={60} className="text-white mb-4 animate-pulse sm:size-24 sm:mb-6" />
                  <p className="font-display tracking-[0.2em] sm:tracking-[0.4em] text-[10px] sm:text-sm uppercase text-white">{t('host_lobby.waiting')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  <AnimatePresence>
                    {participants.map((player) => (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="group relative bg-gradient-to-b from-[#111625] to-[#0a0d14] border border-white/5 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center transition-all hover:border-[#2d6af2]/50 hover:shadow-[0_0_20px_rgba(45,106,242,0.2)] hover:-translate-y-1 overflow-hidden"
                      >
                        {/* Laser Edge Left Design */}
                        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#2d6af2] to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                        {/* Cyber glow background */}
                        <div className="absolute inset-0 bg-[#2d6af2]/[0.02] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border border-[#2d6af2]/30 bg-black/40 overflow-hidden mb-3 flex items-center justify-center shadow-inner relative group/avatar z-10 group-hover:border-[#2d6af2] transition-colors">
                          {player.avatar_url ? (
                            <img src={player.avatar_url} alt="Ava" className="w-full h-full object-cover" />
                          ) : (
                            <InitialsAvatar name={player.nickname} size="md" />
                          )}
                        </div>
                        <div className="bg-black/40 border border-white/5 rounded-md px-2 py-1 w-full text-center relative z-10 shadow-inner group-hover:bg-[#2d6af2]/10 transition-colors">
                          {player.nickname.length > 12 ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="font-display text-white text-[10px] sm:text-xs font-bold truncate tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] cursor-default">{player.nickname}</p>
                              </TooltipTrigger>
                              <TooltipContent side="top" sideOffset={8} className="bg-[#0c1020]/95 backdrop-blur-xl border border-[#7C3AED]/60 text-white font-display text-[10px] uppercase font-bold tracking-widest shadow-[0_0_25px_rgba(124,58,237,0.5)] z-[100] max-w-[280px] transform -skew-x-[12deg] rounded-none px-3 py-1.5">
                                <span className="block transform skew-x-[12deg] truncate">{player.nickname}</span>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <p className="font-display text-white text-[10px] sm:text-xs font-bold truncate tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{player.nickname}</p>
                          )}
                        </div>

                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedPlayer(player); setKickDialogOpen(true); }}
                          className="absolute top-2 end-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/20 text-red-500 p-2 rounded-full hover:bg-red-500 hover:text-white"
                        >
                          <X size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ═══ CUSTOM TOAST NOTIFICATION ═══ */}
      <AnimatePresence>
        {inviteToastVisible && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none"
          >
            <div className="flex items-center gap-4 bg-[#0a0f16] border border-[#00ff9d]/40 rounded-2xl px-6 py-4 shadow-[0_0_50px_rgba(0,255,157,0.15)] min-w-[280px]">
              <div className="w-8 h-8 rounded-full border border-[#00ff9d] flex items-center justify-center bg-[#00ff9d]/10 shrink-0">
                <Check size={16} className="text-[#00ff9d]" />
              </div>
              <span className="font-display font-bold uppercase tracking-[0.2em] text-white text-sm mt-0.5">
                Invited
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ KICK DIALOG ═══ */}
      <Dialog open={kickDialogOpen} onOpenChange={setKickDialogOpen}>
        <DialogOverlay className="bg-black/80 backdrop-blur-sm" />
        <DialogContent className="bg-[#0a0a0f] border-2 border-red-500/40 text-white p-8 max-w-sm rounded-none shadow-[0_0_50px_rgba(239,68,68,0.2)] transform -skew-x-[2deg]">
          <div className="transform skew-x-[2deg]">
            <DialogTitle className="text-2xl font-display font-black uppercase tracking-[0.10em] text-center mb-8 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
              {t('host_lobby.kick')} {selectedPlayer?.nickname}?
            </DialogTitle>
            <div className="flex gap-4">
              <button
                onClick={() => setKickDialogOpen(false)}
                className="group/btn flex-1 flex items-center justify-center border border-white/20 h-11 relative overflow-hidden transform -skew-x-[15deg] transition-all hover:bg-white/5"
              >
                <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                <span className="relative z-10 font-display font-black uppercase text-[10px] tracking-widest text-gray-400 group-hover/btn:text-white transform skew-x-[15deg]">
                  {t('host_lobby.cancel') ?? 'Cancel'}
                </span>
              </button>
              <button
                onClick={confirmKick}
                className="group/btn flex-1 flex items-center justify-center bg-red-600 border border-red-400/50 h-11 relative overflow-hidden transform -skew-x-[15deg] transition-all hover:bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              >
                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                <span className="relative z-10 font-display font-black uppercase text-[10px] tracking-widest text-white transform skew-x-[15deg]">
                  KICK
                </span>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ EXIT CONFIRMATION DIALOG ═══ */}
      <Dialog open={exitDialogOpen} onOpenChange={setExitDialogOpen}>
        <DialogOverlay className="bg-black/80 backdrop-blur-sm" />
        <DialogContent className="bg-[#0a0a0f] border-2 border-red-500/40 text-white p-8 max-w-sm rounded-none shadow-[0_0_50px_rgba(239,68,68,0.2)] transform -skew-x-[2deg]">
          <div className="transform skew-x-[2deg] flex flex-col items-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-sm flex items-center justify-center mb-6 border border-red-500/20 transform -skew-x-[15deg]">
              <div className="transform skew-x-[15deg]">
                <LogOut size={32} className="text-red-500" />
              </div>
            </div>

            <DialogTitle className="text-2xl font-display font-black uppercase tracking-[0.15em] text-center mb-2 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
              {t('host_lobby.exit_dialog_title')}
            </DialogTitle>

            <p className="text-white/60 text-xs text-center font-display tracking-widest mb-10 uppercase leading-relaxed">
              {t('host_lobby.exit_dialog_desc')}
            </p>

            <div className="flex gap-4 w-full">
              <button
                onClick={() => setExitDialogOpen(false)}
                className="group/btn flex-1 flex items-center justify-center border border-white/20 h-11 relative overflow-hidden transform -skew-x-[15deg] transition-all hover:bg-white/5"
              >
                <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                <span className="relative z-10 font-display font-black uppercase text-[10px] tracking-widest text-gray-400 group-hover/btn:text-white transform skew-x-[15deg]">
                  {t('host_lobby.cancel')}
                </span>
              </button>

              <button
                onClick={() => router.push("/host/select-quiz")}
                className="group/btn flex-1 flex items-center justify-center bg-red-600 border border-red-400/50 h-11 relative overflow-hidden transform -skew-x-[15deg] transition-all hover:bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              >
                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                <span className="relative z-10 font-display font-black uppercase text-[10px] tracking-widest text-white transform skew-x-[15deg]">
                  {t('host_lobby.confirm_exit')}
                </span>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ QR FULLSCREEN — klik luar untuk tutup ═══ */}
      {qrOpen && (
        <div
          className="fixed inset-0 z-[300] bg-black flex items-center justify-center cursor-pointer"
          onClick={() => setQrOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 shadow-[0_0_80px_rgba(255,255,255,0.15)] cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <QRCode value={joinLink} style={{ width: 'min(80vw, 80vh)', height: 'auto', maxWidth: 500 }} />
          </div>
        </div>
      )}

      {/* ═══ INVITE FRIENDS DIALOG ═══ */}
      <Dialog open={inviteFriendOpen} onOpenChange={setInviteFriendOpen}>
        <DialogOverlay className="bg-black/80 backdrop-blur-sm" />
        <DialogContent className="bg-[#0a0a0f] border-2 border-[#2d6af2]/40 text-white p-6 max-w-[480px] rounded-none shadow-[0_0_50px_rgba(45,106,242,0.15)] overflow-hidden transform -skew-x-[2deg]">
          <div className="transform skew-x-[2deg]">
            <button
              onClick={() => setInviteFriendOpen(false)}
              className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <DialogTitle className="sr-only">
              {t('host_lobby.invite_friends') ?? 'Invite Friends'}
            </DialogTitle>

            <div className="flex items-center gap-2.5 mb-7 mt-2">
              <div className="p-2 border border-[#2d6af2]/30 rounded-sm transform -skew-x-[12deg] bg-[#2d6af2]/5">
                <UserPlus className="text-[#2d6af2] w-6 h-6 transform skew-x-[12deg]" />
              </div>
              <h2 className="text-xl font-display font-black uppercase tracking-widest text-[#2d6af2] drop-shadow-[0_0_8px_rgba(45,106,242,0.4)]">
                INVITE FRIEND
              </h2>
            </div>

            {/* Search */}
            <div className="relative mb-6 transform -skew-x-[8deg]">
              <input
                type="text"
                placeholder="Find a friend..."
                value={searchFriendQuery}
                onChange={(e) => setSearchFriendQuery(e.target.value)}
                className="w-full bg-[#05070a] border border-white/10 rounded-none py-3.5 px-6 pr-12 text-sm font-display outline-none focus:border-[#2d6af2]/50 text-white placeholder:text-white/20 transition-all transform skew-x-[8deg]"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 transform skew-x-[8deg]">
                <Search size={18} />
              </div>
            </div>

            {/* Friends List */}
            <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto custom-scrollbar pr-1.5 pt-1">
              {loadingFriends ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-8 h-8 border-2 border-[#2d6af2]/20 border-t-[#2d6af2] rounded-full animate-spin mb-4"></div>
                  <p className="text-white/30 text-[10px] font-display tracking-[0.2em] uppercase">ACCESSING NETWORK...</p>
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <UserPlus size={40} className="text-white/5 mb-4" />
                  <p className="text-white/20 text-[10px] font-display tracking-[0.2em] uppercase">
                    {searchFriendQuery ? 'NO RESULTS' : 'NO FRIENDS'}
                  </p>
                </div>
              ) : (
                filteredFriends.map(friend => {
                  const displayName = friend.nickname || friend.fullname || friend.username || '?';
                  return (
                    <div key={friend.id} className="flex items-center justify-between bg-white/[0.02] border border-white/[0.04] rounded-sm p-4 hover:bg-[#2d6af2]/5 transition-colors group/friend transform -skew-x-[8deg] mb-1">
                      <div className="flex items-center gap-3 transform skew-x-[8deg]">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-sm border-2 border-[#2d6af2]/30 bg-[#0a0f18] overflow-hidden flex items-center justify-center shrink-0 group-hover/friend:border-[#2d6af2]/60 transition-all transform -skew-x-[12deg]">
                          <div className="transform skew-x-[12deg] w-full h-full">
                            {friend.avatar_url ? (
                              <img src={friend.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                            ) : (
                              <InitialsAvatar name={displayName} size="sm" />
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <h3 className="font-display font-bold text-[14px] text-white tracking-wide">{displayName}</h3>
                          <p className="text-white/30 text-[11px] font-mono leading-none mt-1">@{friend.username}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => !invitedFriends.includes(friend.id) && handleInviteFriend(friend.id)}
                        disabled={invitedFriends.includes(friend.id)}
                        className={`group/btn flex items-center justify-center h-10 px-8 relative overflow-hidden transform -skew-x-[12deg] transition-all disabled:opacity-100 ${invitedFriends.includes(friend.id)
                          ? 'bg-white/5 border border-white/10'
                          : 'bg-gradient-to-r from-[#2d6af2] to-[#1e40af] hover:from-[#3b7ff6] hover:to-[#2d6af2] border border-[#2d6af2]/40 shadow-[0_5px_15px_rgba(45,106,242,0.3)]'
                          }`}
                      >
                        <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                        <span className={`relative z-10 font-display font-black uppercase text-[10px] tracking-widest transform skew-x-[12deg] ${invitedFriends.includes(friend.id) ? 'text-white/30' : 'text-white'}`}>
                          {invitedFriends.includes(friend.id) ? 'INVITED' : 'INVITE'}
                        </span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ INVITE GROUPS DIALOG ═══ */}
      <Dialog open={inviteGroupOpen} onOpenChange={setInviteGroupOpen}>
        <DialogOverlay className="bg-black/80 backdrop-blur-sm" />
        <DialogContent className="bg-[#0a0a0f] border-2 border-[#00e5ff]/40 text-white p-6 max-w-[480px] rounded-none shadow-[0_0_50px_rgba(0,229,255,0.15)] overflow-hidden transform -skew-x-[2deg]">
          <div className="transform skew-x-[2deg]">
            <button
              onClick={() => setInviteGroupOpen(false)}
              className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <DialogTitle className="sr-only">
              {t('host_lobby.invite_groups') ?? 'Invite Group'}
            </DialogTitle>

            <div className="flex items-center gap-2.5 mb-7 mt-2">
              <div className="p-2 border border-[#00e5ff]/30 rounded-sm transform -skew-x-[12deg] bg-[#00e5ff]/5">
                <Users2 className="text-[#00e5ff] w-6 h-6 transform skew-x-[12deg]" />
              </div>
              <h2 className="text-xl font-display font-black uppercase tracking-widest text-[#00e5ff] drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]">
                INVITE GROUP
              </h2>
            </div>

            <div className="relative mb-6 transform -skew-x-[8deg]">
              <input
                type="text"
                placeholder="Find a group..."
                value={searchGroupQuery}
                onChange={(e) => setSearchGroupQuery(e.target.value)}
                className="w-full bg-[#05070a] border border-white/10 rounded-none py-3.5 px-6 pr-12 text-sm font-display outline-none focus:border-[#00e5ff]/50 text-white placeholder:text-white/20 transition-all transform skew-x-[8deg]"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 transform skew-x-[8deg]">
                <Search size={18} />
              </div>
            </div>

            <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto custom-scrollbar pr-1.5 pt-1">
              {loadingGroups ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-8 h-8 border-2 border-[#00e5ff]/20 border-t-[#00e5ff] rounded-full animate-spin mb-4"></div>
                  <p className="text-white/30 text-[10px] font-display tracking-[0.2em] uppercase">SYNCING GROUPS...</p>
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Users2 size={40} className="text-white/5 mb-4" />
                  <p className="text-white/20 text-[10px] font-display tracking-[0.2em] uppercase">
                    {searchGroupQuery ? 'NO RESULTS' : 'NO GROUPS'}
                  </p>
                </div>
              ) : (
                filteredGroups.map(group => (
                  <div key={group.id} className="flex items-center justify-between bg-white/[0.02] border border-white/[0.04] rounded-sm p-4 hover:bg-[#00e5ff]/5 transition-colors group/gr transform -skew-x-[8deg] mb-1">
                    <div className="flex flex-col gap-1.5 transform skew-x-[8deg]">
                      <h3 className="font-display font-bold text-[15px] text-white tracking-wide group-hover/gr:text-[#00e5ff] transition-colors">{group.name}</h3>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-[#00e5ff]/80 text-[11px] font-bold">
                          <Users size={14} />
                          <span className="font-mono">{group.membersCount}</span>
                        </div>
                        <div className={`text-[10px] font-black px-2.5 py-0.5 rounded-sm border-l-2 tracking-widest uppercase ${group.role.toLowerCase() === 'owner' ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' :
                          group.role.toLowerCase() === 'admin' ? 'bg-[#00e5ff]/10 border-[#00e5ff] text-[#00e5ff]' :
                            'bg-white/5 border-white/20 text-white/50'
                          }`}>
                          {group.role}
                        </div>
                      </div>
                    </div>
                    {(group.role.toLowerCase() === 'owner' || group.role.toLowerCase() === 'admin') && (
                      <button
                        onClick={() => !invitedGroups.includes(group.id) && handleInviteGroup(group.id)}
                        disabled={invitedGroups.includes(group.id)}
                        className={`group/btn flex items-center justify-center h-10 px-8 relative overflow-hidden transform -skew-x-[12deg] transition-all disabled:opacity-100 ${invitedGroups.includes(group.id)
                          ? 'bg-white/5 border border-white/10'
                          : 'bg-gradient-to-r from-[#00e5ff] to-[#0089ff] hover:from-[#00f2ff] hover:to-[#00e5ff] border border-[#00e5ff]/40 shadow-[0_5px_15px_rgba(0,229,255,0.3)]'
                          }`}
                      >
                        <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                        <span className={`relative z-10 font-display font-black uppercase text-[10px] tracking-widest transform skew-x-[12deg] ${invitedGroups.includes(group.id) ? 'text-white/30' : 'text-black'}`}>
                          {invitedGroups.includes(group.id) ? 'INVITED' : 'INVITE'}
                        </span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ COUNTDOWN OVERLAY ═══ */}
      {countdown !== null && (
        <div
          className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center"
          style={{ animation: 'fadeIn 0.3s ease-out' }}
        >
          {/* Traffic Lights */}
          <div className="flex gap-4 mb-8">
            {[
              { color: "#ef4444", activeAt: 3 },
              { color: "#facc15", activeAt: 2 },
              { color: "#00ff9d", activeAt: 1 },
            ].map((light, i) => {
              const isGo = countdown <= 0;
              const isLit = isGo || countdown <= light.activeAt;
              const displayColor = isGo ? "#00ff9d" : light.color;
              return (
                <div key={i} className="w-10 h-10 md:w-14 md:h-14 rounded-full border-2" style={{
                  borderColor: isLit ? displayColor : '#374151',
                  backgroundColor: isLit ? displayColor : 'rgba(55,65,81,0.3)',
                  boxShadow: isLit ? `0 0 30px ${displayColor}, 0 0 60px ${displayColor}55` : 'none',
                  transform: isLit ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                }} />
              );
            })}
          </div>

          {/* Number */}
          <span
            key={countdown}
            className={`font-display font-black py-2 drop-shadow-[0_0_40px_currentColor] ${countdown === 3 ? 'text-red-500' :
              countdown === 2 ? 'text-yellow-400' :
                'text-[#00ff9d]'
              }`}
            style={{
              fontSize: 'clamp(120px, 22vw, 220px)',
              lineHeight: '1.1',
              display: 'block',
              animation: 'countdown-pop 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
            }}
          >
            {countdown > 0 ? countdown : t('host_lobby.go') ?? 'GO!'}
          </span>

          {/* Label */}
          <p
            className="font-display text-xl text-gray-400 mt-4 tracking-[0.3em] uppercase"
            style={{ animation: 'fadeInUp 0.3s ease-out' }}
          >
            {countdown === 3
              ? (t('player_waiting.ready') ?? 'READY')
              : countdown === 2
                ? (t('player_waiting.steady') ?? 'STEADY')
                : (t('player_waiting.go_race') ?? 'GO RACE!')}
          </p>

          {/* Pulse ring */}
          <div
            className="absolute w-72 h-72 rounded-full border border-[#2d6af2]/30"
            style={{ animation: 'pulseRing 2s ease-in-out infinite' }}
          />

          <style>{`
            @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
            @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
            @keyframes countdown-pop { 0% { transform: scale(1.6) translateY(-20px); opacity: 0 } 60% { transform: scale(0.95) translateY(4px); opacity: 1 } 100% { transform: scale(1) translateY(0); opacity: 1 } }
            @keyframes pulseRing { 0% { transform: scale(1); opacity: 0.3 } 50% { transform: scale(1.8); opacity: 0 } 100% { transform: scale(1); opacity: 0.3 } }
          `}</style>
        </div>
      )}

      <FloatingHostActions />

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
    </TooltipProvider>
  );
}
