export function DaygoLogo({ compact = false }: { compact?: boolean }) {
  return <div className={`daygo-brand${compact ? " daygo-brand-compact" : ""}`} aria-label="DAYGO">
    <svg className="daygo-mark" viewBox="0 0 48 48" role="img" aria-hidden="true">
      <rect x="1" y="1" width="46" height="46" rx="15" fill="#E9D6C2" />
      <path d="M11 31h26" fill="none" stroke="#8A654A" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M15 30a9 9 0 0 1 18 0" fill="none" stroke="#8A654A" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M12 26c4-1 6-5 9-8 3-3 6-4 11-4" fill="none" stroke="#382D24" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="1 4" />
      <circle cx="33" cy="14" r="3" fill="#B48765" />
    </svg>
    <span className="daygo-word">daygo</span>
    {!compact && <span className="daygo-tagline">ONE DAY. ONE DESTINATION.</span>}
  </div>;
}
