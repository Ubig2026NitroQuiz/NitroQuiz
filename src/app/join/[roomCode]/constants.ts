/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KONSTANTA: Halaman Join Room
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Peta pesan error yang ditampilkan saat pemain gagal bergabung ke room.
 * Setiap kunci merepresentasikan jenis error yang dikembalikan oleh RPC
 * `join_game`, dan nilainya berisi judul dan pesan yang user-friendly.
 */

// ═══════════════════════════════════════════════════════════════════════════
// TIPE DATA
// ═══════════════════════════════════════════════════════════════════════════

/** Tipe untuk kunci error yang dikenali oleh halaman join */
export type AlertReasonKey = keyof typeof ERROR_MESSAGES;

// ═══════════════════════════════════════════════════════════════════════════
// PETA PESAN ERROR
// ═══════════════════════════════════════════════════════════════════════════

export const ERROR_MESSAGES = {
  /** Nickname sudah dipakai pemain lain di room yang sama */
  duplicate: {
    title: "Duplicate Nickname",
    message:
      "This nickname is already taken in this room. Please change your profile nickname.",
  },

  /** Kode room tidak ditemukan di database */
  roomNotFound: {
    title: "Room Not Found",
    message:
      "The game code you entered does not exist. Please check the code.",
  },

  /** Sesi game sudah dimulai atau sudah berakhir */
  sessionLocked: {
    title: "Session Locked",
    message: "This game session has already started or ended.",
  },

  /** Room sudah penuh (kapasitas maksimum tercapai) */
  roomFull: {
    title: "Room Full",
    message: "This room has reached its maximum capacity.",
  },

  /** Error umum yang tidak terklasifikasi */
  general: {
    title: "Join Error",
    message: "Failed to join the game. Please try again later.",
  },
} as const;
