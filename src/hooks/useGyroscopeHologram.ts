import { useEffect } from 'react';
import { Gyroscope } from 'expo-sensors';
import { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

const MAX_ROTATION = 8; // degrees
const SMOOTHING = 0.12; // lower = smoother
const UPDATE_INTERVAL = 16; // ~60fps

export function useGyroscopeHologram(enabled = true) {
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const perspective = useSharedValue(1000);

  useEffect(() => {
    if (!enabled) return;

    const subscription = Gyroscope.addListener((gyroscopeData) => {
      // gyroscope returns rad/s — map to visual rotation degrees
      const rawY = gyroscopeData.y * SMOOTHING * 180 / Math.PI;
      const rawX = gyroscopeData.x * SMOOTHING * 180 / Math.PI;

      const clampedY = Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, rawY));
      const clampedX = Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, rawX));

      rotateY.value = withTiming(clampedY, {
        duration: 80,
        easing: Easing.out(Easing.quad),
      });
      rotateX.value = withTiming(clampedX, {
        duration: 80,
        easing: Easing.out(Easing.quad),
      });
    });

    Gyroscope.setUpdateInterval(UPDATE_INTERVAL);

    return () => {
      subscription.remove();
    };
  }, [enabled]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: perspective.value },
      { rotateX: `${rotateX.value}deg` },
      { rotateY: `${rotateY.value}deg` },
    ],
  }));

  return { animatedStyle, rotateX, rotateY };
}
