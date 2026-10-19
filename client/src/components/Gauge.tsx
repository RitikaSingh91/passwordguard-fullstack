export function Gauge({ score, category }: { score: number; category: string }) {
  const color = score < 40 ? '#ef4444' : score < 70 ? '#f59e0b' : '#10b981';
  return (
    <div className="text-center" role="img" aria-label={`Strength ${score} out of 100: ${category}`}>
      <svg viewBox="0 0 200 110" className="mx-auto w-full max-w-[260px]" aria-hidden="true">
        <path d="M20 100A80 80 0 0 1 180 100" fill="none" stroke="currentColor" strokeOpacity=".15" strokeWidth="14" strokeLinecap="round" />
        <path d="M20 100A80 80 0 0 1 180 100" fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" pathLength="100" strokeDasharray={`${score} 100`} style={{ transition: 'stroke-dasharray .3s' }} />
        <text x="100" y="90" textAnchor="middle" fontSize="34" fontWeight="700" fill="currentColor">{score}</text>
      </svg>
      <div className="font-semibold" style={{ color }}>{category}</div>
    </div>
  );
}
