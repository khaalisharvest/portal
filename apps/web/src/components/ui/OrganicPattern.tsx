type IconFn = (k: number) => React.ReactElement;

const ICONS: IconFn[] = [
  (k) => <g key={k}><path d="M0,-6 Q6,-3 6,1 Q6,6 0,7 Q-6,6 -6,1 Q-6,-3 0,-6Z"/><line x1="0" y1="-6" x2="0" y2="7"/></g>,
  (k) => <g key={k}><line x1="0" y1="-7" x2="0" y2="7"/><path d="M0,3 Q-4,1 -4,4 Q-2,6 0,3Z"/><path d="M0,3 Q4,1 4,4 Q2,6 0,3Z"/><path d="M0,-1 Q-4,-3 -4,0 Q-2,2 0,-1Z"/><path d="M0,-1 Q4,-3 4,0 Q2,2 0,-1Z"/><path d="M0,-5 Q-1,-8 0,-9 Q1,-8 0,-5Z"/></g>,
  (k) => <g key={k}><circle cx="0" cy="1" r="5.5"/><path d="M0,-4 L1,-8 Q3,-10 5,-8"/><path d="M-2,-2 Q0,-5 2,-2"/></g>,
  (k) => <g key={k}><path d="M0,-6 L5,7 L-5,7Z"/><path d="M-2,-6 Q-4,-9 -5,-11"/><path d="M0,-6 Q0,-9 0,-11"/><path d="M2,-6 Q4,-9 5,-10"/></g>,
  (k) => <g key={k}><ellipse cx="0" cy="0" rx="7" ry="4.5"/><path d="M-7,0 Q-9,-1 -10,1"/><path d="M7,0 Q9,1 10,2"/></g>,
  (k) => <g key={k}><path d="M0,-7 Q6,-2 6,3 Q6,7 0,8 Q-6,7 -6,3 Q-6,-2 0,-7Z"/><path d="M0,-7 L1,-10 Q3,-12 5,-10"/></g>,
  (k) => <g key={k}><line x1="0" y1="-7" x2="0" y2="7"/><path d="M0,3 Q-5,0 -5,3 Q-3,6 0,3Z"/><path d="M0,3 Q5,0 5,3 Q3,6 0,3Z"/><path d="M0,-2 Q-4,-5 -4,-2 Q-2,0 0,-2Z"/><path d="M0,-2 Q4,-5 4,-2 Q2,0 0,-2Z"/><path d="M0,-6 Q-2,-8 -2,-6 Q-1,-4 0,-6Z"/><path d="M0,-6 Q2,-8 2,-6 Q1,-4 0,-6Z"/></g>,
  (k) => <g key={k}><path d="M0,-3 Q6,1 6,5 Q4,9 0,10 Q-4,9 -6,5 Q-6,1 0,-3Z"/><path d="M-3,-4 Q-4,-8 -3,-9"/><path d="M0,-4 Q0,-8 0,-10"/><path d="M3,-4 Q4,-8 3,-9"/></g>,
  (k) => <g key={k}><path d="M0,-6 Q5,0 4,6 Q3,10 0,11 Q-3,10 -4,6 Q-5,0 0,-6Z"/><path d="M0,-6 L0,-9 Q2,-11 3,-9"/></g>,
  (k) => <g key={k}><circle cx="0" cy="0" r="3"/><ellipse cx="0" cy="-5" rx="2" ry="3.5"/><ellipse cx="0" cy="-5" rx="2" ry="3.5" transform="rotate(72,0,0)"/><ellipse cx="0" cy="-5" rx="2" ry="3.5" transform="rotate(144,0,0)"/><ellipse cx="0" cy="-5" rx="2" ry="3.5" transform="rotate(216,0,0)"/><ellipse cx="0" cy="-5" rx="2" ry="3.5" transform="rotate(288,0,0)"/></g>,
  (k) => <g key={k}><circle cx="0" cy="1" r="6"/><path d="M-3,-5 Q-3,-9 -4,-10"/><path d="M0,-5 Q0,-9 0,-11"/><path d="M3,-5 Q3,-9 4,-10"/></g>,
  (k) => <g key={k}><path d="M-6,1 Q-6,-7 0,-8 Q6,-7 6,1Z"/><line x1="-2" y1="1" x2="-2" y2="7"/><line x1="2" y1="1" x2="2" y2="7"/><line x1="-2" y1="7" x2="2" y2="7"/></g>,
  (k) => <g key={k}><ellipse cx="0" cy="1" rx="4" ry="7"/><line x1="-4" y1="-2" x2="4" y2="-2"/><line x1="-4" y1="1" x2="4" y2="1"/><line x1="-4" y1="4" x2="4" y2="4"/><line x1="0" y1="-6" x2="-2" y2="-10"/><line x1="0" y1="-6" x2="2" y2="-10"/></g>,
  (k) => <g key={k}><path d="M0,-7 L1.5,-2.5 L6,-6 L2.5,-1 L7,0 L2.5,1 L6,6 L1.5,2.5 L0,7 L-1.5,2.5 L-6,6 L-2.5,1 L-7,0 L-2.5,-1 L-6,-6 L-1.5,-2.5Z"/><circle cx="0" cy="0" r="2"/></g>,
  (k) => <g key={k}><path d="M0,-7 Q6,-4 6,1 Q6,7 0,8 Q-6,7 -6,1 Q-6,-4 0,-7Z"/><path d="M-2,-7 Q-1,-10 0,-11 Q1,-10 2,-7"/><line x1="-4" y1="-1" x2="4" y2="-1"/><line x1="-5" y1="3" x2="5" y2="3"/></g>,
  (k) => <g key={k}><path d="M0,-7 Q-5,-4 -5,1 Q-3,6 0,7 Q3,6 5,1 Q5,-4 0,-7Z"/><path d="M-2.5,-3 Q-5,-1 -5,1 Q-3,5 0,6"/><path d="M2.5,-3 Q5,-1 5,1 Q3,5 0,6"/><path d="M0,-7 L0,-10"/></g>,
  (k) => <g key={k}><circle cx="0" cy="2" r="6"/><path d="M-3,-4 L3,-4 L3,-7 L0,-9 L-3,-7Z"/><circle cx="-2" cy="1" r="1.2"/><circle cx="2" cy="1" r="1.2"/><circle cx="0" cy="4" r="1.2"/><circle cx="-3" cy="4" r="1.2"/><circle cx="3" cy="4" r="1.2"/></g>,
  (k) => <g key={k}><path d="M0,4 L0,8"/><path d="M-4,-1 Q-7,-6 -4,-8 Q-1,-9 0,-4"/><path d="M4,-1 Q7,-6 4,-8 Q1,-9 0,-4"/><path d="M0,-4 Q-1,-9 0,-11 Q1,-9 0,-4"/><line x1="-2" y1="4" x2="2" y2="4"/></g>,
  (k) => <g key={k}><circle cx="0" cy="3" r="5"/><path d="M0,-2 L0,-7"/><path d="M-3,-5 Q-5,-8 -4,-9"/><path d="M3,-5 Q5,-8 4,-9"/><line x1="0" y1="8" x2="0" y2="11"/></g>,
  (k) => <g key={k}><ellipse cx="0" cy="2" rx="4" ry="6.5"/><line x1="-4" y1="0" x2="4" y2="0"/><line x1="-4" y1="3" x2="4" y2="3"/><line x1="-2" y1="-4.5" x2="-3" y2="-8"/><line x1="0" y1="-5.5" x2="0" y2="-9"/><line x1="2" y1="-4.5" x2="3" y2="-8"/></g>,
  (k) => <g key={k}><circle cx="-3" cy="-3" r="2.5"/><circle cx="3" cy="-3" r="2.5"/><circle cx="-4.5" cy="2" r="2.5"/><circle cx="0" cy="2" r="2.5"/><circle cx="4.5" cy="2" r="2.5"/><circle cx="-2.5" cy="7" r="2.5"/><circle cx="2.5" cy="7" r="2.5"/><line x1="0" y1="-5.5" x2="0" y2="-8"/></g>,
  (k) => <g key={k}><circle cx="0" cy="0" r="6"/><line x1="0" y1="-6" x2="0" y2="6"/><line x1="-6" y1="0" x2="6" y2="0"/><line x1="-4.2" y1="-4.2" x2="4.2" y2="4.2"/><line x1="4.2" y1="-4.2" x2="-4.2" y2="4.2"/></g>,
  (k) => <g key={k}><path d="M0,-7 Q6,-1 6,4 Q6,8 0,9 Q-6,8 -6,4 Q-6,-1 0,-7Z"/><ellipse cx="0" cy="4" rx="3" ry="3.5"/></g>,
  (k) => <g key={k}><path d="M-6,0 Q-6,-5 -2,-5 Q0,-5 0,0 Q2,-5 5,-5 Q7,-2 6,2 Q5,6 2,5 Q0,7 -2,5 Q-5,6 -6,2Z"/></g>,
  (k) => <g key={k}><ellipse cx="0" cy="0" rx="3.5" ry="6"/><line x1="0" y1="-6" x2="0" y2="6"/></g>,
  (k) => <g key={k}><circle cx="-4" cy="2" r="3"/><circle cx="4" cy="2" r="3"/><circle cx="0" cy="-3" r="3"/><path d="M0,-6 L0,-9 Q2,-10 3,-9"/></g>,
  (k) => <g key={k}><circle cx="0" cy="0" r="3"/><ellipse cx="0" cy="-5.5" rx="1.8" ry="3"/><ellipse cx="0" cy="-5.5" rx="1.8" ry="3" transform="rotate(45,0,0)"/><ellipse cx="0" cy="-5.5" rx="1.8" ry="3" transform="rotate(90,0,0)"/><ellipse cx="0" cy="-5.5" rx="1.8" ry="3" transform="rotate(135,0,0)"/><ellipse cx="0" cy="-5.5" rx="1.8" ry="3" transform="rotate(180,0,0)"/><ellipse cx="0" cy="-5.5" rx="1.8" ry="3" transform="rotate(225,0,0)"/><ellipse cx="0" cy="-5.5" rx="1.8" ry="3" transform="rotate(270,0,0)"/><ellipse cx="0" cy="-5.5" rx="1.8" ry="3" transform="rotate(315,0,0)"/></g>,
  (k) => <g key={k}><path d="M-7,0 Q-5,-5 0,-5 Q5,-5 7,0 Q5,5 0,5 Q-5,5 -7,0Z"/><circle cx="-3.5" cy="0" r="2"/><circle cx="0" cy="0" r="2"/><circle cx="3.5" cy="0" r="2"/></g>,
  (k) => <g key={k}><circle cx="0" cy="0" r="6"/><path d="M-2.5,-2 Q0,-5 2.5,-2"/><path d="M-4,1 Q0,-1 4,1"/><path d="M-3,4 Q0,2 3,4"/></g>,
  (k) => <g key={k}><circle cx="0" cy="-3.5" r="3"/><circle cx="-3" cy="2" r="3"/><circle cx="3" cy="2" r="3"/><line x1="0" y1="5" x2="0" y2="9"/></g>,
];

const ROTS   = [5, -15, 20, -8, 28, 12, -22, 0, 18, -30, 25, -5, 10, -18, 30, -12, 8, -25, 15, -3];
const SCALES = [1.0, 1.4, 0.75, 1.6, 0.9, 1.25, 0.65, 1.5, 1.1, 0.8, 1.35, 0.7, 1.2, 1.55, 0.85, 1.45, 0.95, 1.3, 0.72, 1.15];

const COL_GAP = 56;
const ROW_GAP = 52;
const TILE    = 500;
const SCALE   = 2.8;

interface Inst { x: number; y: number; rot: number; icon: number; scale: number }

const INSTANCES: Inst[] = (() => {
  const out: Inst[] = [];
  let n = 0;
  for (let row = 0; row * ROW_GAP < TILE + ROW_GAP; row++) {
    const xOff = (row % 2) * (COL_GAP / 2);
    for (let col = 0; col * COL_GAP + xOff < TILE + COL_GAP; col++) {
      out.push({
        x:     col * COL_GAP + xOff,
        y:     row * ROW_GAP,
        rot:   ROTS[n % ROTS.length],
        icon:  n % ICONS.length,
        scale: SCALE * SCALES[n % SCALES.length],
      });
      n++;
    }
  }
  return out;
})();

export default function OrganicPattern() {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 w-full h-full pointer-events-none"
    >
      <defs>
        <pattern
          id="organic-bg"
          x="0" y="0"
          width={TILE} height={TILE}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(20)"
        >
          <g fill="none" stroke="#3d7a2e" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" opacity="0.22">
            {INSTANCES.map(({ x, y, rot, icon, scale }, i) => (
              <g key={i} transform={`translate(${x},${y}) rotate(${rot}) scale(${scale})`}>
                {ICONS[icon](i)}
              </g>
            ))}
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#organic-bg)" />
    </svg>
  );
}
