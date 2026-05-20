import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { storage } from '@/lib/mmkv';

const TASK_NAME = 'solo-leveling-location-tracking';
const STEP_TASK_NAME = 'solo-leveling-step-counter';

export interface LocationMission {
  id: string;
  title: string;
  description: string;
  type: 'walk' | 'run' | 'bike';
  targetDistance: number; // meters
  targetSteps?: number;
  xpReward: number;
  rewardName: string;
}

export const LOCATION_MISSIONS: LocationMission[] = [
  {
    id: 'raid_boss_walk',
    title: 'Raid Boss: Shadow Walk',
    description: 'Walk 2000 steps to defeat the Raid Boss.',
    type: 'walk',
    targetDistance: 1500, // ~2000 steps
    targetSteps: 2000,
    xpReward: 50,
    rewardName: 'Health Potion',
  },
  {
    id: 'hunt_goblin_run',
    title: 'Hunt Goblin: Speed Dash',
    description: 'Run 1 km to hunt down the Goblin pack.',
    type: 'run',
    targetDistance: 1000,
    xpReward: 100,
    rewardName: 'Speed Buff',
  },
  {
    id: 'shadow_bike',
    title: 'Shadow Ride: Endurance',
    description: 'Bike 3 km to unlock Shadow Rider status.',
    type: 'bike',
    targetDistance: 3000,
    xpReward: 150,
    rewardName: 'Shadow Mount',
  },
];

export interface LocationMissionProgress {
  missionId: string;
  distanceTraveled: number;
  stepsCounted: number;
  completed: boolean;
  startedAt: number;
}

function loadProgress(): Record<string, LocationMissionProgress> {
  const raw = storage.getString('location_mission_progress');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveProgress(progress: Record<string, LocationMissionProgress>) {
  storage.set('location_mission_progress', JSON.stringify(progress));
}

// Define the background task
TaskManager.defineTask(TASK_NAME, async ({ data, error }) => {
  if (error) return;
  if (!data) return;

  const { locations } = data as { locations: Location.LocationObject[] };
  if (!locations || locations.length === 0) return;

  const latest = locations[locations.length - 1];
  const speed = latest.coords.speed ?? 0;

  // Classify activity based on speed
  let activity: 'walk' | 'run' | 'bike' | 'idle' = 'idle';
  if (speed > 0.5 && speed < 2.5) activity = 'walk';
  else if (speed >= 2.5 && speed < 5) activity = 'run';
  else if (speed >= 5) activity = 'bike';

  if (activity === 'idle') return;

  // Update progress for matching missions
  const progress = loadProgress();
  const distance = locations.reduce((sum, loc, i) => {
    if (i === 0) return 0;
    const prev = locations[i - 1];
    return sum + haversine(
      prev.coords.latitude,
      prev.coords.longitude,
      loc.coords.latitude,
      loc.coords.longitude,
    );
  }, 0);

  for (const mission of LOCATION_MISSIONS) {
    const p = progress[mission.id];
    if (!p || p.completed) continue;
    if (mission.type !== activity) continue;

    p.distanceTraveled += distance;
    if (p.distanceTraveled >= mission.targetDistance) {
      p.completed = true;
    }
  }

  saveProgress(progress);
});

// Haversine distance (meters)
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function startLocationTracking(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return false;

  const bgStatus = await Location.requestBackgroundPermissionsAsync();

  const isRunning = await Location.hasStartedLocationUpdatesAsync(TASK_NAME);
  if (isRunning) await Location.stopLocationUpdatesAsync(TASK_NAME);

  await Location.startLocationUpdatesAsync(TASK_NAME, {
    accuracy: Location.Accuracy.High,
    timeInterval: 5000,
    distanceInterval: 10,
    showsBackgroundNotification: true,
    foregroundService: {
      notificationTitle: 'Solo Leveling — Tracking',
      notificationBody: 'Location tracking active for bonus missions.',
    },
  });

  return true;
}

export async function stopLocationTracking() {
  const isRunning = await Location.hasStartedLocationUpdatesAsync(TASK_NAME);
  if (isRunning) {
    await Location.stopLocationUpdatesAsync(TASK_NAME);
  }
}

export function startMission(missionId: string): LocationMissionProgress | null {
  const mission = LOCATION_MISSIONS.find((m) => m.id === missionId);
  if (!mission) return null;

  const progress = loadProgress();
  if (progress[missionId]?.completed) return progress[missionId];

  const newProgress: LocationMissionProgress = {
    missionId,
    distanceTraveled: 0,
    stepsCounted: 0,
    completed: false,
    startedAt: Date.now(),
  };

  progress[missionId] = newProgress;
  saveProgress(progress);
  return newProgress;
}

export function getMissionProgress(missionId: string): LocationMissionProgress | null {
  const progress = loadProgress();
  return progress[missionId] ?? null;
}

export function getAllProgress(): Record<string, LocationMissionProgress> {
  return loadProgress();
}

export function resetMissionProgress(missionId: string) {
  const progress = loadProgress();
  delete progress[missionId];
  saveProgress(progress);
}

export async function requestLocationPermissions(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}
