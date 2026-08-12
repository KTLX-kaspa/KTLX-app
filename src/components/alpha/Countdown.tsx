import { useEffect, useMemo, useState } from 'react';

export function Countdown({ targetIso }: { targetIso: string }) {
  const target = useMemo(() => new Date(targetIso).getTime(), [targetIso]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!Number.isFinite(target)) {
    return <p className="muted">Invalid launch time</p>;
  }

  const diff = Math.max(0, target - now);
  const sec = Math.floor(diff / 1000);
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;
  const launched = diff === 0;

  return (
    <div>
      {launched ? (
        <p className="success" style={{ fontWeight: 700 }}>
          Launch window is open
        </p>
      ) : (
        <div className="countdown" aria-live="polite">
          <div className="countdown-cell">
            <strong>{days}</strong>
            <span>Days</span>
          </div>
          <div className="countdown-cell">
            <strong>{hours}</strong>
            <span>Hours</span>
          </div>
          <div className="countdown-cell">
            <strong>{minutes}</strong>
            <span>Minutes</span>
          </div>
          <div className="countdown-cell">
            <strong>{seconds}</strong>
            <span>Seconds</span>
          </div>
        </div>
      )}
    </div>
  );
}
