export function RobuxIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        fill="currentColor"
        d="M12 1.2l9.3 5.35v10.9L12 22.8l-9.3-5.35V6.55zM8.6 8.6v6.8h6.8V8.6z"
      />
    </svg>
  );
}

/** A tiny blocky "noob" character built from plain divs */
export function Noob({ className = "" }: { className?: string }) {
  const box = (s: React.CSSProperties) => (
    <div style={{ position: "absolute", border: "2px solid rgba(0,0,0,.35)", borderRadius: 4, ...s }} />
  );
  return (
    <div className={`relative ${className}`} style={{ width: 112, height: 168 }} aria-hidden>
      {box({ left: 0, top: 48, width: 24, height: 64, background: "#f5cd30" })}
      {box({ right: 0, top: 48, width: 24, height: 64, background: "#f5cd30" })}
      {box({ left: 24, top: 48, width: 64, height: 64, background: "#0d69ac" })}
      {box({ left: 24, top: 112, width: 32, height: 56, background: "#4b974b" })}
      {box({ left: 56, top: 112, width: 32, height: 56, background: "#4b974b" })}
      <div
        style={{
          position: "absolute",
          left: 32,
          top: 0,
          width: 48,
          height: 48,
          background: "#f5cd30",
          border: "2px solid rgba(0,0,0,.35)",
          borderRadius: 6,
        }}
      >
        <div style={{ position: "absolute", left: 11, top: 15, width: 6, height: 8, background: "#111", borderRadius: 2 }} />
        <div style={{ position: "absolute", right: 11, top: 15, width: 6, height: 8, background: "#111", borderRadius: 2 }} />
        <div style={{ position: "absolute", left: 13, bottom: 10, width: 20, height: 6, borderBottom: "3px solid #111", borderRadius: "0 0 12px 12px" }} />
      </div>
    </div>
  );
}

export function LogoMark({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="roox-mark" x1="5" y1="4" x2="43" y2="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#74F5FF" />
          <stop offset=".52" stopColor="#5867FF" />
          <stop offset="1" stopColor="#A44BFF" />
        </linearGradient>
        <linearGradient id="roox-cut" x1="15" y1="12" x2="34" y2="37" gradientUnits="userSpaceOnUse">
          <stop stopColor="#101426" />
          <stop offset="1" stopColor="#080B13" />
        </linearGradient>
      </defs>
      <path d="M24 2.8 44.6 14.7v18.6L24 45.2 3.4 33.3V14.7L24 2.8Z" fill="url(#roox-mark)" />
      <path d="m24 8.5 15.4 8.9v13.2L24 39.5 8.6 30.6V17.4L24 8.5Z" fill="url(#roox-cut)" />
      <path d="M17 15.5h10.4a6.2 6.2 0 0 1 2.9 11.7l5.1 6.1h-7.7L23 27.1h-1.1v6.2H17V15.5Zm4.9 4.7v2.4h5.4a1.2 1.2 0 1 0 0-2.4h-5.4Z" fill="white" />
      <path d="m10.2 16.7 4.2-2.4M33.6 35.1l4.2-2.4" stroke="#B8FAFF" strokeOpacity=".65" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
