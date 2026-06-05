/**
 * =====================================================
 * KOMPONEN: QuizBackground - Latar Belakang Sinematik
 * =====================================================
 * Menampilkan latar belakang bertema racing dengan efek:
 * - Racing stripe di atas
 * - Background image dengan overlay gradient
 * - Grid pattern
 * - Ambient glow (cahaya biru dan ungu)
 * =====================================================
 */
'use client';

/**
 * Komponen latar belakang sinematik untuk halaman quiz.
 * Menggunakan beberapa layer overlay untuk menciptakan efek visual yang mendalam.
 * Semua elemen bersifat pointer-events-none agar tidak mengganggu interaksi.
 */
export function QuizBackground() {
    return (
        <>
            {/* Racing Stripe — Garis tipis berwarna di atas halaman */}
            <div className="racing-stripe z-50 pointer-events-none absolute top-0 inset-x-0 h-1" />

            {/* Background Image — Gambar latar dengan opacity rendah */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-30"
                style={{
                    backgroundImage: 'url("/assets/backgorund/homepage_bg.webp")',
                    backgroundAttachment: 'fixed'
                }}
            />

            {/* Gradient Overlay — Transisi gelap dari bawah ke atas */}
            <div className="fixed inset-0 z-0 bg-gradient-to-t from-[#04060f] via-[#04060f]/85 to-[#2d6af2]/10 pointer-events-none" />

            {/* Grid Pattern — Pola kotak-kotak halus */}
            <div className="fixed inset-0 z-0 bg-[linear-gradient(rgba(45,106,242,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(45,106,242,0.04)_1px,transparent_1px)] bg-[length:35px_35px] pointer-events-none" />

            {/* Ambient Glow Biru — Cahaya lembut di kiri atas */}
            <div className="fixed top-0 left-1/3 w-[500px] h-[500px] bg-[#2d6af2]/8 blur-[140px] rounded-full pointer-events-none" />

            {/* Ambient Glow Ungu — Cahaya lembut di kanan bawah */}
            <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-[#7C3AED]/8 blur-[120px] rounded-full pointer-events-none" />
        </>
    );
}
