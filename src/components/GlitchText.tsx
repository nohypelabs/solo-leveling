import React from 'react';
import { Text } from 'react-native';

interface GlitchTextProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'pink';
  className?: string;
}

export function GlitchText({
  children,
  variant = 'cyan',
  className = '',
}: GlitchTextProps) {
  const colorClass = variant === 'cyan' ? 'text-sl-cyan' : 'text-sl-pink';

  return (
    <Text className={`font-bold ${colorClass} ${className}`}>
      {children}
    </Text>
  );
}
