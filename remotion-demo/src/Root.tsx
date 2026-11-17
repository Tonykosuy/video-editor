import React from 'react';
import { Composition, AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

const TestScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#f8fafc',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ opacity, textAlign: 'center' }}>
        <h1 style={{ fontSize: 64, margin: 0 }}>Remotion Ready</h1>
        <p style={{ fontSize: 28, color: '#38bdf8' }}>Frame {frame}</p>
      </div>
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="TestVideo"
      component={TestScene}
      durationInFrames={60}
      fps={30}
      width={1280}
      height={720}
    />
  );
};
