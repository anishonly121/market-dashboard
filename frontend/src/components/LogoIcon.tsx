interface Props {
  size?: number;
  className?: string;
}

export default function LogoIcon({ size = 36, className = "" }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#312e81" />
          <stop offset="1" stopColor="#1e1b4b" />
        </linearGradient>
        <linearGradient id="lineGrad" x1="4" y1="0" x2="35" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818cf8" />
          <stop offset="1" stopColor="#c4b5fd" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect width="40" height="40" rx="9" fill="url(#bgGrad)" />
      {/* Border */}
      <rect width="40" height="40" rx="9" stroke="#4f46e5" strokeWidth="1" fill="none" opacity="0.8" />

      {/* Chart line */}
      <polyline
        points="4,32 9,26 14,28 20,14 26,19 31,9"
        stroke="url(#lineGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#glow)"
      />

      {/* Peak dot — live indicator */}
      <circle cx="31" cy="9" r="3" fill="#22c55e" filter="url(#glow)" />
      <circle cx="31" cy="9" r="5" stroke="#22c55e" strokeWidth="1" fill="none" opacity="0.4" />
    </svg>
  );
}
