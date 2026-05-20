import { Audio } from 'expo-av';

let soundObject: Audio.Sound | null = null;
let initialized = false;

async function ensureSound() {
  if (initialized) return soundObject;
  initialized = true;
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });
    // Try loading a custom sound file if present
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/quest-complete.mp3'),
      );
      soundObject = sound;
    } catch {
      // No custom sound file — use system default notification
      soundObject = null;
    }
  } catch {
    // Audio not available
  }
}

export async function playQuestCompleteSound() {
  try {
    await ensureSound();
    if (soundObject) {
      await soundObject.replayAsync();
    }
  } catch {
    // Silent fail
  }
}

export async function unloadSounds() {
  if (soundObject) {
    await soundObject.unloadAsync();
    soundObject = null;
  }
}
