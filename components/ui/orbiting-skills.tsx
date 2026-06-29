"use client"
import React, { useEffect, useState, memo } from 'react';

// --- Type Definitions ---
type IconType = 
  | 'python' 
  | 'algorithms' 
  | 'dataStructures' 
  | 'tensorflow' 
  | 'pytorch' 
  | 'keras' 
  | 'opencv' 
  | 'compVision' 
  | 'nlp' 
  | 'llms' 
  | 'dataAnalysis' 
  | 'git' 
  | 'sql';

type GlowColor = 'cyan' | 'purple';

interface SkillIconProps {
  type: IconType;
}

interface SkillConfig {
  id: string;
  orbitRadius: number;
  size: number;
  speed: number;
  iconType: IconType;
  phaseShift: number;
  glowColor: GlowColor;
  label: string;
}

interface OrbitingSkillProps {
  config: SkillConfig;
  angle: number;
}

interface GlowingOrbitPathProps {
  radius: number;
  glowColor?: GlowColor;
  animationDelay?: number;
}

// --- Improved SVG Icon Components ---
const iconComponents: Record<IconType, { component: () => React.JSX.Element; color: string }> = {
  python: {
    component: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M11.97 0C5.3 0 5.62 2.87 5.62 2.87l.02 2.97h6.36v.9H5.64s-3.07-.35-3.07 4.14c0 4.49 2.66 4.35 2.66 4.35h1.58v-2.22s-.08-2.66 2.6-2.66h6.24s2.58.07 2.58-2.5V4.67s.24-4.67-6.26-4.67zM8.88 1.48a.73.73 0 1 1 0 1.46.73.73 0 0 1 0-1.46zm3.15 21.04c6.67 0 6.35-2.87 6.35-2.87l-.02-2.97h-6.36v-.9h6.36s3.07.35 3.07-4.14c0-4.49-2.66-4.35-2.66-4.35h-1.58v2.22s.08 2.66-2.6 2.66H8.4s-2.58-.07-2.58 2.5v6.18s-.24 4.67 6.26 4.67zm3.09-1.48a.73.73 0 1 1 0-1.46.73.73 0 0 1 0 1.46z" fill="#3776AB"/>
      </svg>
    ),
    color: '#3776AB'
  },
  algorithms: {
    component: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-[#4CAF50]">
        <line x1="6" y1="3" x2="6" y2="15"></line>
        <circle cx="18" cy="6" r="3"></circle>
        <circle cx="6" cy="18" r="3"></circle>
        <path d="M18 9a9 9 0 0 1-9 9"></path>
      </svg>
    ),
    color: '#4CAF50'
  },
  dataStructures: {
    component: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-[#FF9800]">
        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
        <polyline points="2 17 12 22 22 17"></polyline>
        <polyline points="2 12 12 17 22 12"></polyline>
      </svg>
    ),
    color: '#FF9800'
  },
  tensorflow: {
    component: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 .288L1.614 6.28v11.44L12 23.712l10.386-5.992V6.28L12 .288zM12 2.738l7.558 4.364v7.868L12 19.334l-7.558-4.364V7.102L12 2.738zM8.5 7h7v2h-2.5v7h-2v-7H8.5V7z" fill="#FF6F00"/>
      </svg>
    ),
    color: '#FF6F00'
  },
  pytorch: {
    component: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.834 14.512c0 2.254-.606 4.38-2.28 5.393-2.148 1.303-5.309 1.157-7.228-.352-.892-.702-1.401-1.636-1.572-2.735a7.172 7.172 0 0 1-.065-1.127V8.675a3.84 3.84 0 0 1 .054-.86c.162-1.077.67-1.99 1.543-2.673 1.905-1.492 5.034-1.636 7.172-.35 1.666 1.004 2.268 3.102 2.275 5.336h-1.993c-.007-1.396-.342-2.56-1.328-3.155-1.096-.662-2.825-.56-3.864.254-.509.399-.785.918-.868 1.528a2.532 2.532 0 0 0-.026.438v5.822c0 .17.009.324.025.466.082.603.355 1.116.857 1.511 1.036.814 2.772.923 3.87.258.988-.596 1.323-1.77 1.33-3.177H17.834z" fill="#EE4C2C"/>
      </svg>
    ),
    color: '#EE4C2C'
  },
  keras: {
    component: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.5 17h-2.5l-3.5-5.5V17H8V7h2.5v5.5L14 7h2.5l-4.25 5L16.5 17z" fill="#D00000"/>
      </svg>
    ),
    color: '#D00000'
  },
  opencv: {
    component: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-[#5C3EE6]">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    ),
    color: '#5C3EE6'
  },
  compVision: {
    component: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-[#00BCD4]">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
        <circle cx="12" cy="13" r="4"></circle>
      </svg>
    ),
    color: '#00BCD4'
  },
  nlp: {
    component: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-[#9C27B0]">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        <path d="M8 7h8M8 11h8"></path>
      </svg>
    ),
    color: '#9C27B0'
  },
  llms: {
    component: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-[#E91E63]">
        <rect x="3" y="11" width="18" height="10" rx="2"></rect>
        <circle cx="12" cy="5" r="2"></circle>
        <path d="M12 7v4M8 16h.01M16 16h.01"></path>
      </svg>
    ),
    color: '#E91E63'
  },
  dataAnalysis: {
    component: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-[#3F51B5]">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
      </svg>
    ),
    color: '#3F51B5'
  },
  git: {
    component: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M23.546 10.93L13.067.452c-.604-.603-1.582-.603-2.187 0L8.708 2.624l2.76 2.76c.645-.215 1.379-.07 1.889.44.516.515.655 1.258.428 1.9l2.747 2.748c.64-.227 1.383-.087 1.9.43.755.753.755 1.977 0 2.73-.755.754-1.978.754-2.73 0-.523-.522-.663-1.272-.43-1.902l-2.72-2.72V14.6c.22.065.426.183.593.35.755.753.755 1.977 0 2.73-.755.754-1.978.754-2.73 0-.755-.753-.755-1.977 0-2.73.17-.168.378-.287.6-.352V9.81c-.22-.065-.43-.184-.6-.35-.515-.517-.655-1.258-.428-1.9L6.1 4.79.452 10.437c-.603.605-.603 1.582 0 2.187l10.48 10.478c.604.604 1.582.604 2.186 0l10.428-10.43c.603-.604.603-1.582 0-2.185z" fill="#F05032"/>
      </svg>
    ),
    color: '#F05032'
  },
  sql: {
    component: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-[#00758F]">
        <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
        <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"></path>
      </svg>
    ),
    color: '#00758F'
  }
};

// --- Memoized Icon Component ---
const SkillIcon = memo(({ type }: SkillIconProps) => {
  const IconComponent = iconComponents[type]?.component;
  return IconComponent ? <IconComponent /> : null;
});
SkillIcon.displayName = 'SkillIcon';

// --- Configuration for the Orbiting Skills ---
const skillsConfig: SkillConfig[] = [
  // Inner Orbit (Radius 110)
  { 
    id: 'python',
    orbitRadius: 110, 
    size: 40, 
    speed: 1, 
    iconType: 'python', 
    phaseShift: 0, 
    glowColor: 'cyan',
    label: 'Python'
  },
  { 
    id: 'algorithms',
    orbitRadius: 110, 
    size: 40, 
    speed: 1, 
    iconType: 'algorithms', 
    phaseShift: (2 * Math.PI) / 5, 
    glowColor: 'cyan',
    label: 'Algorithms'
  },
  { 
    id: 'dataStructures',
    orbitRadius: 110, 
    size: 40, 
    speed: 1, 
    iconType: 'dataStructures', 
    phaseShift: (4 * Math.PI) / 5, 
    glowColor: 'cyan',
    label: 'Data Structures'
  },
  { 
    id: 'git',
    orbitRadius: 110, 
    size: 40, 
    speed: 1, 
    iconType: 'git', 
    phaseShift: (6 * Math.PI) / 5, 
    glowColor: 'cyan',
    label: 'Git'
  },
  { 
    id: 'sql',
    orbitRadius: 110, 
    size: 40, 
    speed: 1, 
    iconType: 'sql', 
    phaseShift: (8 * Math.PI) / 5, 
    glowColor: 'cyan',
    label: 'SQL'
  },
  // Outer Orbit (Radius 200)
  { 
    id: 'tensorflow',
    orbitRadius: 200, 
    size: 45, 
    speed: -0.6, 
    iconType: 'tensorflow', 
    phaseShift: 0, 
    glowColor: 'purple',
    label: 'TensorFlow'
  },
  { 
    id: 'pytorch',
    orbitRadius: 200, 
    size: 45, 
    speed: -0.6, 
    iconType: 'pytorch', 
    phaseShift: (2 * Math.PI) / 8, 
    glowColor: 'purple',
    label: 'PyTorch'
  },
  { 
    id: 'keras',
    orbitRadius: 200, 
    size: 45, 
    speed: -0.6, 
    iconType: 'keras', 
    phaseShift: (4 * Math.PI) / 8, 
    glowColor: 'purple',
    label: 'Keras'
  },
  { 
    id: 'opencv',
    orbitRadius: 200, 
    size: 45, 
    speed: -0.6, 
    iconType: 'opencv', 
    phaseShift: (6 * Math.PI) / 8, 
    glowColor: 'purple',
    label: 'OpenCV'
  },
  { 
    id: 'compVision',
    orbitRadius: 200, 
    size: 45, 
    speed: -0.6, 
    iconType: 'compVision', 
    phaseShift: (8 * Math.PI) / 8, 
    glowColor: 'purple',
    label: 'Computer Vision'
  },
  { 
    id: 'nlp',
    orbitRadius: 200, 
    size: 45, 
    speed: -0.6, 
    iconType: 'nlp', 
    phaseShift: (10 * Math.PI) / 8, 
    glowColor: 'purple',
    label: 'NLP'
  },
  { 
    id: 'llms',
    orbitRadius: 200, 
    size: 45, 
    speed: -0.6, 
    iconType: 'llms', 
    phaseShift: (12 * Math.PI) / 8, 
    glowColor: 'purple',
    label: 'LLMs'
  },
  { 
    id: 'dataAnalysis',
    orbitRadius: 200, 
    size: 45, 
    speed: -0.6, 
    iconType: 'dataAnalysis', 
    phaseShift: (14 * Math.PI) / 8, 
    glowColor: 'purple',
    label: 'Data Analysis'
  },
];

// --- Memoized Orbiting Skill Component ---
const OrbitingSkill = memo(({ config, angle }: OrbitingSkillProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { orbitRadius, size, iconType, label } = config;

  const x = Math.cos(angle) * orbitRadius;
  const y = Math.sin(angle) * orbitRadius;

  return (
    <div
      className="absolute top-1/2 left-1/2 transition-all duration-300 ease-out"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        transform: `translate(calc(${x}px - 50%), calc(${y}px - 50%))`,
        zIndex: isHovered ? 20 : 10,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`
          relative w-full h-full p-2 bg-gray-800/90 backdrop-blur-sm
          rounded-full flex items-center justify-center
          transition-all duration-300 cursor-pointer
          ${isHovered ? 'scale-125 shadow-2xl' : 'shadow-lg hover:shadow-xl'}
        `}
        style={{
          boxShadow: isHovered
            ? `0 0 30px ${iconComponents[iconType]?.color}40, 0 0 60px ${iconComponents[iconType]?.color}20`
            : undefined
        }}
      >
        <SkillIcon type={iconType} />
        {isHovered && (
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900/95 backdrop-blur-sm rounded text-xs text-white whitespace-nowrap pointer-events-none">
            {label}
          </div>
        )}
      </div>
    </div>
  );
});
OrbitingSkill.displayName = 'OrbitingSkill';

// --- Optimized Orbit Path Component ---
const GlowingOrbitPath = memo(({ radius, glowColor = 'cyan', animationDelay = 0 }: GlowingOrbitPathProps) => {
  const glowColors = {
    cyan: {
      primary: 'rgba(6, 182, 212, 0.4)',
      secondary: 'rgba(6, 182, 212, 0.2)',
      border: 'rgba(6, 182, 212, 0.3)'
    },
    purple: {
      primary: 'rgba(147, 51, 234, 0.4)',
      secondary: 'rgba(147, 51, 234, 0.2)',
      border: 'rgba(147, 51, 234, 0.3)'
    }
  };

  const colors = glowColors[glowColor] || glowColors.cyan;

  return (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
      style={{
        width: `${radius * 2}px`,
        height: `${radius * 2}px`,
        animationDelay: `${animationDelay}s`,
      }}
    >
      {/* Glowing background */}
      <div
        className="absolute inset-0 rounded-full animate-pulse"
        style={{
          background: `radial-gradient(circle, transparent 30%, ${colors.secondary} 70%, ${colors.primary} 100%)`,
          boxShadow: `0 0 60px ${colors.primary}, inset 0 0 60px ${colors.secondary}`,
          animation: 'pulse 4s ease-in-out infinite',
          animationDelay: `${animationDelay}s`,
        }}
      />

      {/* Static ring for depth */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: `1px solid ${colors.border}`,
          boxShadow: `inset 0 0 20px ${colors.secondary}`,
        }}
      />
    </div>
  );
});
GlowingOrbitPath.displayName = 'GlowingOrbitPath';

// --- Main App Component ---
export default function OrbitingSkills() {
  const [time, setTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      setTime(prevTime => prevTime + deltaTime);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused]);

  const orbitConfigs: Array<{ radius: number; glowColor: GlowColor; delay: number }> = [
    { radius: 110, glowColor: 'cyan', delay: 0 },
    { radius: 200, glowColor: 'purple', delay: 1.5 }
  ];

  return (
    <main className="w-full flex items-center justify-center overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #374151 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, #4B5563 0%, transparent 50%)`,
          }}
        />
      </div>

      <div 
        className="relative w-[calc(100vw-40px)] h-[calc(100vw-40px)] md:w-[480px] md:h-[480px] flex items-center justify-center"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        
        {/* Central "Code" Icon with enhanced glow */}
        <div className="w-20 h-20 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center z-10 relative shadow-2xl">
          <div className="absolute inset-0 rounded-full bg-cyan-500/30 blur-xl animate-pulse"></div>
          <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="relative z-10">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="url(#gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06B6D4" />
                  <stop offset="100%" stopColor="#9333EA" />
                </linearGradient>
              </defs>
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
          </div>
        </div>

        {/* Render glowing orbit paths */}
        {orbitConfigs.map((config) => (
          <GlowingOrbitPath
            key={`path-${config.radius}`}
            radius={config.radius}
            glowColor={config.glowColor}
            animationDelay={config.delay}
          />
        ))}

        {/* Render orbiting skill icons */}
        {skillsConfig.map((config) => {
          const angle = time * config.speed + (config.phaseShift || 0);
          return (
            <OrbitingSkill
              key={config.id}
              config={config}
              angle={angle}
            />
          );
        })}
      </div>
    </main>
  );
}
