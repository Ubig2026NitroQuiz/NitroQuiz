/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CUSTOM HOOK: useInviteSystem
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Hook untuk mengelola sistem undangan (invite) di lobby host.
 *
 * Tanggung Jawab:
 * - Mengelola state dialog invite teman & grup (buka/tutup)
 * - Mengambil daftar teman mutual (saling follow) dari database pusat
 * - Mengambil daftar grup yang diikuti user
 * - Mengirim undangan ke teman individual (notifikasi sessionFriend)
 * - Mengirim undangan ke seluruh anggota grup (notifikasi sessionGroup)
 * - Menyediakan state pencarian & filter untuk dialog undangan
 *
 * CATATAN: Hook ini terpisah dari useLobbyData agar logika undangan
 * tidak tercampur dengan logika inti lobby (session, countdown, dll.)
 */

"use client";

import { useState, useEffect } from "react";
import { createGFSClient } from "@/lib/supabase/gfs-client";
import type { FriendProfile, UserGroup } from "../types";

// ═══════════════════════════════════════════════════════════════════════════
// TIPE PARAMETER HOOK
// ═══════════════════════════════════════════════════════════════════════════

interface UseInviteSystemParams {
  profileId: string | undefined;    // ID profil user yang sedang login
  sessionId: string | null;         // ID sesi game saat ini
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK UTAMA
// ═══════════════════════════════════════════════════════════════════════════

export function useInviteSystem({
  profileId,
  sessionId,
}: UseInviteSystemParams) {
  const supabaseCentral = createGFSClient();

  // ── State dialog ──
  const [inviteFriendOpen, setInviteFriendOpen] = useState(false);
  const [inviteGroupOpen, setInviteGroupOpen] = useState(false);

  // ── State teman ──
  const [mutualFriends, setMutualFriends] = useState<FriendProfile[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [searchFriendQuery, setSearchFriendQuery] = useState("");
  const [invitedFriends, setInvitedFriends] = useState<string[]>([]);

  // ── State grup ──
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [searchGroupQuery, setSearchGroupQuery] = useState("");
  const [invitedGroups, setInvitedGroups] = useState<string[]>([]);

  // ── State toast undangan ──
  const [inviteToastVisible, setInviteToastVisible] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════
  // AMBIL DAFTAR TEMAN MUTUAL saat dialog teman dibuka
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Mengambil teman mutual (saling follow — kedua arah harus ada).
   * Hanya dipanggil saat dialog invite teman dibuka.
   */
  useEffect(() => {
    if (!inviteFriendOpen || !profileId) return;

    const fetchMutualFriends = async () => {
      setLoadingFriends(true);
      try {
        // Ambil user yang saya follow (saya = requester)
        const { data: iFollow, error: e1 } = await supabaseCentral
          .from("friendships")
          .select("addressee_id")
          .eq("requester_id", profileId)
          .eq("status", "accepted");

        // Ambil user yang follow saya (saya = addressee)
        const { data: followMe, error: e2 } = await supabaseCentral
          .from("friendships")
          .select("requester_id")
          .eq("addressee_id", profileId)
          .eq("status", "accepted");

        if (e1 || e2) {
          console.error("Error mengambil data pertemanan:", e1 || e2);
          setLoadingFriends(false);
          return;
        }

        // Cari irisan (intersection) = mutual friends
        const iFollowIds = new Set(
          (iFollow || []).map((f: any) => f.addressee_id)
        );
        const followMeIds = new Set(
          (followMe || []).map((f: any) => f.requester_id)
        );
        const mutualIds = [...iFollowIds].filter((id) => followMeIds.has(id));

        if (mutualIds.length === 0) {
          setMutualFriends([]);
          setLoadingFriends(false);
          return;
        }

        // Ambil profil untuk ID teman mutual
        const { data: profiles, error: profileError } = await supabaseCentral
          .from("profiles")
          .select("id, username, nickname, fullname, avatar_url")
          .in("id", mutualIds);

        if (profileError) {
          console.error("Error mengambil profil teman:", profileError);
          setLoadingFriends(false);
          return;
        }

        setMutualFriends(profiles || []);
      } catch (e) {
        console.error("Gagal mengambil teman mutual:", e);
      } finally {
        setLoadingFriends(false);
      }
    };

    fetchMutualFriends();
  }, [inviteFriendOpen, profileId]);

  // ═══════════════════════════════════════════════════════════════════════
  // AMBIL DAFTAR GRUP saat dialog grup dibuka
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Mengambil grup-grup di mana user adalah anggota.
   * Hanya dipanggil saat dialog invite grup dibuka.
   */
  useEffect(() => {
    if (!inviteGroupOpen || !profileId) return;

    const fetchGroups = async () => {
      setLoadingGroups(true);
      try {
        const { data, error } = await supabaseCentral
          .from("groups")
          .select("id, name, members, creator_id")
          .is("deleted_at", null);

        if (error) {
          console.error("Error mengambil data grup:", error);
          setLoadingGroups(false);
          return;
        }

        // Filter grup di mana user adalah anggota & tentukan role-nya
        const myGroups = (data || []).reduce((acc: UserGroup[], group: any) => {
          const members = Array.isArray(group.members) ? group.members : [];
          const member = members.find(
            (m: any) => m.user_id === profileId || m.id === profileId
          );

          if (member) {
            // Creator selalu menjadi owner
            let role = member.role || "member";
            if (group.creator_id === profileId) role = "owner";

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
        console.error("Gagal mengambil data grup:", e);
      } finally {
        setLoadingGroups(false);
      }
    };

    fetchGroups();
  }, [inviteGroupOpen, profileId]);

  // ═══════════════════════════════════════════════════════════════════════
  // FILTER: Hasil pencarian teman & grup
  // ═══════════════════════════════════════════════════════════════════════

  /** Daftar teman yang sudah difilter berdasarkan query pencarian */
  const filteredFriends = mutualFriends.filter((f) => {
    const q = searchFriendQuery.toLowerCase();
    return (
      (f.username || "").toLowerCase().includes(q) ||
      (f.nickname || "").toLowerCase().includes(q) ||
      (f.fullname || "").toLowerCase().includes(q)
    );
  });

  /** Daftar grup yang sudah difilter berdasarkan query pencarian */
  const filteredGroups = userGroups.filter((g) =>
    g.name.toLowerCase().includes(searchGroupQuery.toLowerCase())
  );

  // ═══════════════════════════════════════════════════════════════════════
  // AKSI: Undang Teman
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Mengirim undangan ke seorang teman.
   * Membuat notifikasi bertipe 'sessionFriend' di database pusat.
   */
  const handleInviteFriend = async (friendId: string) => {
    setInvitedFriends((prev) => [...prev, friendId]);

    // Tampilkan toast
    setInviteToastVisible(true);
    setTimeout(() => setInviteToastVisible(false), 3000);

    // Sisipkan notifikasi untuk teman yang diundang
    if (profileId && sessionId) {
      try {
        await supabaseCentral.from("notifications").insert({
          user_id: friendId,      // yang diundang
          actor_id: profileId,    // pengundang
          type: "sessionFriend",
          entity_type: "session",
          entity_id: sessionId,
        });
      } catch (e) {
        console.error("Gagal mengirim notifikasi undangan:", e);
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // AKSI: Undang Grup
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Mengirim undangan ke seluruh anggota grup (kecuali pengundang).
   * Membuat notifikasi bertipe 'sessionGroup' untuk setiap anggota.
   */
  const handleInviteGroup = async (groupId: string) => {
    // Cari data grup dari state
    const group = userGroups.find((g) => g.id === groupId);
    if (!group) return;

    // Filter anggota: kecualikan pengundang itu sendiri
    const members = Array.isArray(group.members) ? group.members : [];
    const recipientIds = members
      .map((m: any) => m.user_id || m.id)
      .filter((id: string) => id && id !== profileId);

    // Buat baris notifikasi (content dibiarkan default dari DB)
    const notifications = recipientIds.map((userId: string) => ({
      user_id: userId,
      actor_id: profileId,
      type: "sessionGroup",
      entity_type: "session",
      entity_id: sessionId,
      from_group_id: groupId,
    }));

    // Sisipkan ke database pusat
    if (notifications.length > 0) {
      const { error } = await supabaseCentral
        .from("notifications")
        .insert(notifications);

      if (error) {
        console.error("Gagal mengirim notifikasi grup:", error);
      }
    }

    // Update UI
    setInvitedGroups((prev) => [...prev, groupId]);
    setInviteToastVisible(true);
    setTimeout(() => setInviteToastVisible(false), 3000);
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RETURN: Semua state dan aksi yang dibutuhkan komponen undangan
  // ═══════════════════════════════════════════════════════════════════════

  return {
    // State & aksi dialog
    inviteFriendOpen,
    setInviteFriendOpen,
    inviteGroupOpen,
    setInviteGroupOpen,

    // State & aksi teman
    loadingFriends,
    searchFriendQuery,
    setSearchFriendQuery,
    filteredFriends,
    invitedFriends,
    handleInviteFriend,

    // State & aksi grup
    loadingGroups,
    searchGroupQuery,
    setSearchGroupQuery,
    filteredGroups,
    invitedGroups,
    handleInviteGroup,

    // Toast
    inviteToastVisible,
  };
}
