import React, { useEffect } from 'react';
import { Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PARTICLE_COUNT = 35;
const COLORS = ['#00f3ff', '#ff00cc', '#00f3ff', '#ff00cc', '#e0e0e0'];

interface Particle {
  startX: number;
  color: string;
  delay: number;
  rotation: number;
  size: number;
}

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    startX: Math.random() * SCREEN_WIDTH,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    delay: Math.random() * 400,
    rotation: Math.random() * 360,
    size: 4 + Math.random() * 6,
  }));
}

export function Confetti({ visible }: { visible: boolean }) {
  // Fresh random pattern every time the modal opens (not the same burst twice).
  const [burst, setBurst] = React.useState(0);
  const wasVisible = React.useRef(visible);

  if (visible && !wasVisible.current) {
    wasVisible.current = true;
    setBurst((b) => b + 1);
  } else if (!visible && wasVisible.current) {
    wasVisible.current = false;
  }

  const particles = React.useMemo(() => generateParticles(), [burst]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      {particles.map((p, i) => (
        <ConfettiParticle key={i} particle={p} />
      ))}
    </Animated.View>
  );
}

function ConfettiParticle({ particle }: { particle: Particle }) {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(particle.startX);
  const rotation = useSharedValue(particle.rotation);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const duration = 1500 + Math.random() * 1000;
    const targetX = particle.startX + (Math.random() - 0.5) * 200;

    const timeout = setTimeout(() => {
      translateY.value = withTiming(SCREEN_HEIGHT + 20, {
        duration,
        easing: Easing.out(Easing.quad),
      });
      translateX.value = withTiming(targetX, { duration });
      rotation.value = withTiming(particle.rotation + 720, { duration });
      opacity.value = withSequence(
        withTiming(1, { duration: duration * 0.6 }),
        withTiming(0, { duration: duration * 0.4 }),
      );
    }, particle.delay);

    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: 'absolute',
          width: particle.size,
          height: particle.size,
          backgroundColor: particle.color,
          borderRadius: 2,
        },
      ]}
    />
  );
}
