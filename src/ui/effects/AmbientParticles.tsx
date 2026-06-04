import React, { type CSSProperties } from "react";

type AmbientParticlesProps = {
  variant: "menu" | "game";
};

type ParticleSpec = {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  driftX: number;
  driftY: number;
  tone: "gold" | "blue" | "green";
};

type WispSpec = {
  x: number;
  y: number;
  width: number;
  height: number;
  delay: number;
  duration: number;
  driftX: number;
  driftY: number;
  rotate: number;
};

type ParticleStyle = CSSProperties & {
  "--particle-x": string;
  "--particle-y": string;
  "--particle-size": string;
  "--particle-delay": string;
  "--particle-duration": string;
  "--particle-drift-x": string;
  "--particle-drift-y": string;
};

type WispStyle = CSSProperties & {
  "--wisp-x": string;
  "--wisp-y": string;
  "--wisp-width": string;
  "--wisp-height": string;
  "--wisp-delay": string;
  "--wisp-duration": string;
  "--wisp-drift-x": string;
  "--wisp-drift-y": string;
  "--wisp-rotate": string;
};

const menuParticles: ParticleSpec[] = [
  { x: 12, y: 18, size: 4, delay: -0.4, duration: 7.4, driftX: 9, driftY: -18, tone: "blue" },
  { x: 18, y: 34, size: 3, delay: -2.1, duration: 8.2, driftX: -8, driftY: -13, tone: "gold" },
  { x: 22, y: 58, size: 4, delay: -4.8, duration: 9.1, driftX: 10, driftY: -12, tone: "green" },
  { x: 16, y: 76, size: 5, delay: -1.7, duration: 7.8, driftX: 13, driftY: -16, tone: "gold" },
  { x: 30, y: 84, size: 3, delay: -5.4, duration: 8.6, driftX: -7, driftY: -15, tone: "blue" },
  { x: 40, y: 28, size: 4, delay: -3.3, duration: 9.4, driftX: 8, driftY: -19, tone: "gold" },
  { x: 47, y: 15, size: 3, delay: -6.2, duration: 7.9, driftX: -12, driftY: -11, tone: "blue" },
  { x: 53, y: 46, size: 4, delay: -1.1, duration: 8.8, driftX: 9, driftY: -14, tone: "green" },
  { x: 59, y: 70, size: 5, delay: -3.9, duration: 9.6, driftX: -9, driftY: -17, tone: "gold" },
  { x: 64, y: 86, size: 3, delay: -0.9, duration: 7.6, driftX: 11, driftY: -12, tone: "blue" },
  { x: 71, y: 20, size: 4, delay: -5.8, duration: 8.4, driftX: -10, driftY: -18, tone: "gold" },
  { x: 76, y: 39, size: 3, delay: -2.6, duration: 9.2, driftX: 8, driftY: -14, tone: "green" },
  { x: 82, y: 56, size: 5, delay: -4.2, duration: 8.1, driftX: -12, driftY: -16, tone: "blue" },
  { x: 88, y: 30, size: 4, delay: -1.5, duration: 7.7, driftX: 10, driftY: -13, tone: "gold" },
  { x: 91, y: 72, size: 3, delay: -6.7, duration: 9.3, driftX: -7, driftY: -19, tone: "green" },
  { x: 36, y: 63, size: 3, delay: -2.9, duration: 8.5, driftX: 12, driftY: -15, tone: "blue" },
  { x: 68, y: 63, size: 4, delay: -5.1, duration: 7.5, driftX: -10, driftY: -11, tone: "gold" },
  { x: 8, y: 48, size: 3, delay: -3.6, duration: 8.9, driftX: 9, driftY: -17, tone: "green" },
];

const gameParticles: ParticleSpec[] = [
  { x: 10, y: 30, size: 3, delay: -1.2, duration: 9.2, driftX: 6, driftY: -10, tone: "blue" },
  { x: 18, y: 72, size: 4, delay: -4.5, duration: 10.4, driftX: 8, driftY: -12, tone: "green" },
  { x: 28, y: 17, size: 3, delay: -2.8, duration: 8.7, driftX: -7, driftY: -9, tone: "gold" },
  { x: 38, y: 84, size: 3, delay: -6.1, duration: 9.9, driftX: 7, driftY: -11, tone: "blue" },
  { x: 52, y: 24, size: 4, delay: -3.4, duration: 10.1, driftX: -8, driftY: -10, tone: "green" },
  { x: 62, y: 78, size: 3, delay: -5.6, duration: 8.9, driftX: 6, driftY: -13, tone: "gold" },
  { x: 73, y: 34, size: 4, delay: -0.9, duration: 9.5, driftX: -7, driftY: -11, tone: "blue" },
  { x: 84, y: 64, size: 3, delay: -7.2, duration: 10.6, driftX: 8, driftY: -9, tone: "green" },
  { x: 91, y: 22, size: 3, delay: -2.2, duration: 8.8, driftX: -6, driftY: -12, tone: "gold" },
  { x: 94, y: 82, size: 4, delay: -4.1, duration: 9.7, driftX: -8, driftY: -10, tone: "blue" },
];

const menuWisps: WispSpec[] = [
  { x: 14, y: 28, width: 150, height: 26, delay: -1.1, duration: 13.4, driftX: 36, driftY: -22, rotate: -14 },
  { x: 24, y: 69, width: 190, height: 30, delay: -6.4, duration: 15.2, driftX: -42, driftY: -18, rotate: 9 },
  { x: 43, y: 18, width: 126, height: 22, delay: -3.7, duration: 12.8, driftX: 34, driftY: -16, rotate: 18 },
  { x: 58, y: 55, width: 210, height: 34, delay: -8.1, duration: 16.1, driftX: -46, driftY: -20, rotate: -7 },
  { x: 77, y: 33, width: 162, height: 28, delay: -4.8, duration: 14.5, driftX: 38, driftY: -24, rotate: 12 },
  { x: 84, y: 78, width: 140, height: 24, delay: -10.2, duration: 15.7, driftX: -32, driftY: -17, rotate: -18 },
];

const gameWisps: WispSpec[] = [
  { x: 12, y: 42, width: 120, height: 22, delay: -2.6, duration: 15.4, driftX: 24, driftY: -14, rotate: -10 },
  { x: 33, y: 77, width: 150, height: 24, delay: -7.5, duration: 16.8, driftX: -28, driftY: -13, rotate: 16 },
  { x: 66, y: 27, width: 132, height: 22, delay: -4.3, duration: 14.7, driftX: 26, driftY: -16, rotate: 11 },
  { x: 86, y: 68, width: 116, height: 20, delay: -9.2, duration: 16.1, driftX: -24, driftY: -12, rotate: -15 },
];

export function AmbientParticles({ variant }: AmbientParticlesProps) {
  const particles = variant === "menu" ? menuParticles : gameParticles;
  const wisps = variant === "menu" ? menuWisps : gameWisps;

  return (
    <div className={`ambient-particles ambient-particles--${variant}`} aria-hidden="true">
      {wisps.map((wisp, index) => (
        <span
          className="ambient-wisp"
          key={`${variant}-wisp-${index}`}
          style={wispStyle(wisp)}
        />
      ))}
      {particles.map((particle, index) => (
        <span
          className="ambient-particle"
          data-tone={particle.tone}
          key={`${variant}-${index}`}
          style={particleStyle(particle)}
        />
      ))}
    </div>
  );
}

function particleStyle(particle: ParticleSpec): ParticleStyle {
  return {
    "--particle-x": `${particle.x}%`,
    "--particle-y": `${particle.y}%`,
    "--particle-size": `${particle.size}px`,
    "--particle-delay": `${particle.delay}s`,
    "--particle-duration": `${particle.duration}s`,
    "--particle-drift-x": `${particle.driftX}px`,
    "--particle-drift-y": `${particle.driftY}px`,
  };
}

function wispStyle(wisp: WispSpec): WispStyle {
  return {
    "--wisp-x": `${wisp.x}%`,
    "--wisp-y": `${wisp.y}%`,
    "--wisp-width": `${wisp.width}px`,
    "--wisp-height": `${wisp.height}px`,
    "--wisp-delay": `${wisp.delay}s`,
    "--wisp-duration": `${wisp.duration}s`,
    "--wisp-drift-x": `${wisp.driftX}px`,
    "--wisp-drift-y": `${wisp.driftY}px`,
    "--wisp-rotate": `${wisp.rotate}deg`,
  };
}
