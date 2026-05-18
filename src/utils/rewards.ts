export interface Reward {
  day: number;
  description: string;
  message: string;
}

export const REWARD_TABLE: Reward[] = [
  { day: 1, description: 'Susu UHT 250ml', message: 'Beli sendiri sebagai bentuk apresiasi ke tubuhmu.' },
  { day: 2, description: 'Istirahat dan hidrasi', message: 'Minum air putih minimal 2 liter hari ini.' },
  { day: 3, description: 'Vitamin C / jus jeruk', message: 'Asupan vitamin C membantu pemulihan otot.' },
  { day: 4, description: 'Istirahat dan hidrasi', message: 'Tubuhmu butuh regenerasi. Istirahat cukup.' },
  { day: 5, description: 'Pisang 1 buah', message: 'Kalium alami untuk mencegah kram otot.' },
  { day: 6, description: 'Istirahat dan hidrasi', message: 'Hari pemulihan. Jaga asupan air.' },
  { day: 7, description: '2 telur rebus', message: 'Protein berkualitas untuk membangun otot.' },
  { day: 8, description: 'Istirahat dan hidrasi', message: 'Konsistensi adalah kunci. Tetap jaga hidrasi.' },
  { day: 9, description: 'Susu UHT 250ml', message: 'Kalsium dan protein untuk tulang dan otot.' },
  { day: 10, description: 'Istirahat dan hidrasi', message: 'Pemulihan aktif. Stretching ringan dianjurkan.' },
  { day: 11, description: 'Vitamin C / jus jeruk', message: 'Antioksidan melindungi otot dari kerusakan.' },
  { day: 12, description: 'Istirahat dan hidrasi', message: 'Hampir 2 minggu! Istirahat layak dirayakan.' },
  { day: 13, description: 'Pisang 1 buah', message: 'Energi alami untuk sesi latihan besok.' },
  { day: 14, description: '1 pisang', message: 'Dua minggu penuh! Reward spesial dari sistem.' },
  { day: 15, description: 'Susu UHT 250ml', message: 'Setengah bulan konsisten. Luar biasa.' },
  { day: 16, description: 'Istirahat dan hidrasi', message: 'Tubuh sedang beradaptasi. Jaga istirahat.' },
  { day: 17, description: '2 telur rebus', message: 'Protein ganda untuk pemulihan maksimal.' },
  { day: 18, description: 'Istirahat dan hidrasi', message: 'Pemulihan adalah bagian dari latihan.' },
  { day: 19, description: 'Vitamin C / jus jeruk', message: 'Imunitas kuat, otot kuat.' },
  { day: 20, description: 'Istirahat dan hidrasi', message: '3 minggu sudah dekat. Jaga momentum.' },
  { day: 21, description: 'Susu UHT 250ml + pisang', message: 'Kombo protein dan kalmium!' },
  { day: 22, description: 'Istirahat dan hidrasi', message: 'Tubuhmu semakin kuat setiap hari.' },
  { day: 23, description: '2 telur rebus', message: 'Protein untuk hari yang intens.' },
  { day: 24, description: 'Istirahat dan hidrasi', message: 'Satu minggu lagi menuju milestone 30 hari.' },
  { day: 25, description: 'Vitamin C / jus jeruk', message: 'Hampir sampai. Jangan menyerah sekarang.' },
  { day: 26, description: 'Istirahat dan hidrasi', message: 'Pemulihan maksimal untuk final push.' },
  { day: 27, description: 'Susu UHT 250ml', message: 'Tiga hari lagi. Kamu bisa!' },
  { day: 28, description: 'Istirahat dan hidrasi', message: 'Tubuh siap untuk penutup bulan.' },
  { day: 29, description: 'Pisang 1 buah', message: 'Energi terakhir sebelum milestone besar.' },
  { day: 30, description: 'Pijat / foam roller', message: 'Satu bulan penuh! Reward terbaik: pijat pemulihan.' },
];

export function getRewardForDay(day: number): Reward {
  const exact = REWARD_TABLE.find((r) => r.day === day);
  if (exact) return exact;
  // For days beyond 30, cycle through pattern
  const cycleDay = ((day - 1) % 30) + 1;
  return REWARD_TABLE.find((r) => r.day === cycleDay) ?? REWARD_TABLE[0];
}
