'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

/* 6 icons drawn in ±8 unit viewport — same family as OrganicPattern */
const ORBIT_ICONS = [
  /* Leaf */
  (k: number) => <g key={k}><path d="M0,-6 Q6,-3 6,1 Q6,6 0,7 Q-6,6 -6,1 Q-6,-3 0,-6Z"/><line x1="0" y1="-6" x2="0" y2="7"/></g>,
  /* Apple */
  (k: number) => <g key={k}><circle cx="0" cy="1" r="5.5"/><path d="M0,-4 L1,-8 Q3,-10 5,-8"/><path d="M-2,-2 Q0,-5 2,-2"/></g>,
  /* Wheat */
  (k: number) => <g key={k}><line x1="0" y1="-7" x2="0" y2="7"/><path d="M0,3 Q-4,1 -4,4 Q-2,6 0,3Z"/><path d="M0,3 Q4,1 4,4 Q2,6 0,3Z"/><path d="M0,-1 Q-4,-3 -4,0 Q-2,2 0,-1Z"/><path d="M0,-1 Q4,-3 4,0 Q2,2 0,-1Z"/><path d="M0,-5 Q-1,-8 0,-9 Q1,-8 0,-5Z"/></g>,
  /* 5-petal flower */
  (k: number) => <g key={k}><circle cx="0" cy="0" r="2.5"/><ellipse cx="0" cy="-4.5" rx="1.8" ry="3"/><ellipse cx="0" cy="-4.5" rx="1.8" ry="3" transform="rotate(72,0,0)"/><ellipse cx="0" cy="-4.5" rx="1.8" ry="3" transform="rotate(144,0,0)"/><ellipse cx="0" cy="-4.5" rx="1.8" ry="3" transform="rotate(216,0,0)"/><ellipse cx="0" cy="-4.5" rx="1.8" ry="3" transform="rotate(288,0,0)"/></g>,
  /* Strawberry */
  (k: number) => <g key={k}><path d="M0,-3 Q6,1 6,5 Q4,9 0,10 Q-4,9 -6,5 Q-6,1 0,-3Z"/><path d="M-3,-4 Q-4,-8 -3,-9"/><path d="M0,-4 Q0,-8 0,-10"/><path d="M3,-4 Q4,-8 3,-9"/></g>,
  /* Orange slice */
  (k: number) => <g key={k}><circle cx="0" cy="0" r="6"/><line x1="0" y1="-6" x2="0" y2="6"/><line x1="-6" y1="0" x2="6" y2="0"/><line x1="-4.2" y1="-4.2" x2="4.2" y2="4.2"/><line x1="4.2" y1="-4.2" x2="-4.2" y2="4.2"/></g>,
];

const CFG = {
  sm: { wrapper: 88,  logo: 28, orbitR: 36, iconBox: 13 },
  md: { wrapper: 120, logo: 40, orbitR: 50, iconBox: 17 },
  lg: { wrapper: 152, logo: 52, orbitR: 64, iconBox: 21 },
};

interface ProductLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ProductLoader({ size = 'md', className = '' }: ProductLoaderProps) {
  const { wrapper, logo, orbitR, iconBox } = CFG[size];
  const cx = wrapper / 2;
  const cy = wrapper / 2;

  /* Sweep arc ring sits just inside the icon orbit */
  const sweepR    = orbitR - iconBox / 2 - 3;
  const circ      = 2 * Math.PI * sweepR;
  const arcLen    = circ * 0.28;

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>

      {/* ── main ring ────────────────────────────────────────────── */}
      <div style={{ width: wrapper, height: wrapper }} className="relative flex items-center justify-center">

        {/* Track + sweep arc */}
        <svg
          className="absolute inset-0"
          width={wrapper}
          height={wrapper}
          viewBox={`0 0 ${wrapper} ${wrapper}`}
          overflow="visible"
        >
          {/* faint track */}
          <circle
            cx={cx} cy={cy} r={sweepR}
            fill="none" stroke="#d1fae5" strokeWidth="1.5"
          />
          {/* animated sweep */}
          <motion.circle
            cx={cx} cy={cy} r={sweepR}
            fill="none"
            stroke="#3d7a2e"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={`${arcLen} ${circ - arcLen}`}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        </svg>

        {/* Orbiting icons — ring rotates, each icon counter-rotates to stay upright */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{ width: wrapper, height: wrapper }}
        >
          {ORBIT_ICONS.map((Icon, i) => {
            const angle = (i / ORBIT_ICONS.length) * 2 * Math.PI;
            const x = cx + orbitR * Math.sin(angle) - iconBox / 2;
            const y = cy - orbitR * Math.cos(angle) - iconBox / 2;
            return (
              <motion.div
                key={i}
                style={{ position: 'absolute', left: x, top: y, width: iconBox, height: iconBox }}
                animate={{ rotate: -360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <svg
                  viewBox="-8 -8 16 16"
                  width={iconBox}
                  height={iconBox}
                  fill="none"
                  stroke="#3d7a2e"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.6"
                >
                  {Icon(i)}
                </svg>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Center logo — gentle breathing */}
        <motion.div
          style={{ width: logo, height: logo }}
          className="relative z-10"
          animate={{ scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Image
            src="/images/logo.png"
            alt="Khaalis Harvest"
            fill
            className="object-contain drop-shadow-sm"
          />
        </motion.div>
      </div>

      {/* Loading label */}
      <motion.p
        className="text-xs text-neutral-400 tracking-widest uppercase"
        animate={{ opacity: [0.35, 1, 0.35] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        Loading
      </motion.p>
    </div>
  );
}
