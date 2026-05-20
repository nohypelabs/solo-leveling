import { NativeModules, Platform } from 'react-native';

const { SoloLevelingIR } = NativeModules;

export interface IRCommand {
  frequency: number; // Hz (usually 38000)
  pattern: number[]; // alternating mark/space in microseconds
}

export interface IRDevicePreset {
  id: string;
  name: string;
  type: 'ac' | 'tv';
  brand: string;
  commands: Record<string, IRCommand>;
}

/**
 * Common IR codes for popular AC brands.
 * These are standard NEC/RC-5 patterns for power toggle.
 * Users can also learn custom codes from their remotes.
 */
export const AC_PRESETS: IRDevicePreset[] = [
  {
    id: 'ac_panasonic',
    name: 'Panasonic AC',
    type: 'ac',
    brand: 'Panasonic',
    commands: {
      power_on: { frequency: 38000, pattern: [3550, 1750, 450, 1300, 450, 450, 450, 450, 450, 450, 450, 1300, 450, 450, 450, 450, 450, 450, 450, 1300, 450, 1300, 450, 450, 450, 1300, 450, 1300, 450, 1300, 450, 1300, 450, 450, 450, 1300, 450, 450, 450, 450, 450, 450, 450, 450, 450, 1300, 450, 450, 450, 450] },
      power_off: { frequency: 38000, pattern: [3550, 1750, 450, 1300, 450, 450, 450, 450, 450, 450, 450, 1300, 450, 450, 450, 450, 450, 450, 450, 1300, 450, 1300, 450, 450, 450, 1300, 450, 1300, 450, 1300, 450, 1300, 450, 450, 450, 1300, 450, 450, 450, 450, 450, 450, 450, 450, 450, 1300, 450, 1300, 450, 450] },
      temp_up: { frequency: 38000, pattern: [3550, 1750, 450, 1300, 450, 450, 450, 450, 450, 450, 450, 1300, 450, 450, 450, 450, 450, 1300, 450, 450, 450, 1300, 450, 450, 450, 1300, 450, 1300, 450, 1300, 450, 1300, 450, 450, 450, 1300, 450, 450, 450, 450, 450, 450, 450, 450, 450, 1300, 450, 450, 450, 450] },
      temp_down: { frequency: 38000, pattern: [3550, 1750, 450, 1300, 450, 450, 450, 450, 450, 450, 450, 1300, 450, 450, 450, 450, 450, 1300, 450, 450, 450, 1300, 450, 450, 450, 1300, 450, 1300, 450, 1300, 450, 1300, 450, 450, 450, 1300, 450, 450, 450, 450, 450, 450, 450, 450, 450, 1300, 450, 1300, 450, 450] },
    },
  },
  {
    id: 'ac_daikin',
    name: 'Daikin AC',
    type: 'ac',
    brand: 'Daikin',
    commands: {
      power_on: { frequency: 38000, pattern: [3550, 1750, 450, 1300, 450, 450, 450, 450, 450, 450, 450, 1300, 450, 450, 450, 1300, 450, 450, 450, 1300, 450, 1300, 450, 450, 450, 1300, 450, 1300, 450, 450, 450, 1300, 450, 450, 450, 1300, 450, 450, 450, 450, 450, 450, 450, 450, 450, 1300, 450, 450, 450, 450] },
      power_off: { frequency: 38000, pattern: [3550, 1750, 450, 1300, 450, 450, 450, 450, 450, 450, 450, 1300, 450, 450, 450, 1300, 450, 450, 450, 1300, 450, 1300, 450, 450, 450, 1300, 450, 1300, 450, 450, 450, 1300, 450, 450, 450, 1300, 450, 450, 450, 450, 450, 450, 450, 450, 450, 1300, 450, 1300, 450, 450] },
    },
  },
];

export const TV_PRESETS: IRDevicePreset[] = [
  {
    id: 'tv_samsung',
    name: 'Samsung TV',
    type: 'tv',
    brand: 'Samsung',
    commands: {
      power: { frequency: 38000, pattern: [4550, 4550, 550, 1700, 550, 1700, 550, 600, 550, 600, 550, 600, 550, 1700, 550, 600, 550, 1700, 550, 600, 550, 1700, 550, 1700, 550, 600, 550, 1700, 550, 600, 550, 1700, 550, 600, 550, 1700, 550, 1700, 550, 1700, 550, 600, 550, 600, 550, 600, 550, 1700, 550, 600] },
      mute: { frequency: 38000, pattern: [4550, 4550, 550, 1700, 550, 1700, 550, 600, 550, 600, 550, 600, 550, 1700, 550, 600, 550, 1700, 550, 600, 550, 1700, 550, 1700, 550, 600, 550, 1700, 550, 600, 550, 1700, 550, 600, 550, 1700, 550, 1700, 550, 600, 550, 1700, 550, 600, 550, 600, 550, 1700, 550, 600] },
    },
  },
];

export interface IRBlasterState {
  available: boolean;
  cooldownModeEnabled: boolean;
  focusModeEnabled: boolean;
  selectedAC: string | null;
  selectedTV: string | null;
}

/**
 * Check if IR blaster is available on device.
 */
export function isIRAvailable(): boolean {
  if (Platform.OS !== 'android') return false;
  return SoloLevelingIR?.isAvailable?.() ?? false;
}

/**
 * Transmit an IR command.
 */
export async function transmitIR(command: IRCommand): Promise<boolean> {
  if (!SoloLevelingIR?.transmit) {
    console.warn('IR module not available');
    return false;
  }
  try {
    await SoloLevelingIR.transmit(command.frequency, command.pattern);
    return true;
  } catch (err) {
    console.warn('IR transmit failed:', err);
    return false;
  }
}

/**
 * Cool Down Mode: turn on AC after quest complete.
 */
export async function activateCooldownMode(presetId?: string): Promise<boolean> {
  const preset = AC_PRESETS.find((p) => p.id === (presetId ?? 'ac_panasonic'));
  if (!preset) return false;

  const command = preset.commands['power_on'];
  if (!command) return false;

  return transmitIR(command);
}

/**
 * Focus Mode: turn off TV when mission starts.
 */
export async function activateFocusMode(presetId?: string): Promise<boolean> {
  const preset = TV_PRESETS.find((p) => p.id === (presetId ?? 'tv_samsung'));
  if (!preset) return false;

  const command = preset.commands['power'];
  if (!command) return false;

  return transmitIR(command);
}

/**
 * Learn IR code from remote.
 * This requires the native module to capture IR signals.
 * Falls back to manual pattern entry.
 */
export async function learnIRCode(): Promise<IRCommand | null> {
  if (!SoloLevelingIR?.learn) {
    console.warn('IR learning not supported');
    return null;
  }
  try {
    const result = await SoloLevelingIR.learn(5000); // 5s timeout
    return {
      frequency: result.frequency,
      pattern: result.pattern,
    };
  } catch {
    return null;
  }
}
