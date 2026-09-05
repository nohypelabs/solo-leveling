import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

// Centralized game sounds (Phase 3). expo-audio replaced expo-av, which broke
// the R8 production build — do NOT reintroduce expo-av for playback.

let questPlayer: AudioPlayer | null = null;
let levelPlayer: AudioPlayer | null = null;
let preloaded = false;

/**
 * Preload both jingles once at app startup. Fire-and-forget is fine —
 * play*() below no-ops until preload succeeds.
 */
export async function preloadSounds(): Promise<void> {
  if (preloaded) return;
  try {
    await setAudioModeAsync({ playsInSilentMode: true });
    questPlayer = createAudioPlayer(
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('../../assets/sounds/quest_complete.wav'),
    );
    levelPlayer = createAudioPlayer(
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('../../assets/sounds/level_up.wav'),
    );
    preloaded = true;
  } catch (e) {
    console.warn('Sound preload failed:', e);
  }
}

function replay(player: AudioPlayer | null) {
  if (!player) return;
  try {
    player.seekTo(0);
    player.play();
  } catch (e) {
    console.warn('Sound play failed:', e);
  }
}

/** Quest complete jingle — play when RewardModal opens. */
export function playQuestComplete() {
  replay(questPlayer);
}

/** Level-up fanfare — play next to hapticLevelUp() in StatusWindow. */
export function playLevelUp() {
  replay(levelPlayer);
}
