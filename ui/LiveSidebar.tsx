"use client";

import { useEffect, useState, useCallback } from "react";

interface LiveData {
  mbta: string;
  weather: string;
  events: string;
  buzz: string;
}

export function LiveSidebar() {
  const [data, setData] = useState<LiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/live-data");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastUpdated(new Date());
      }
    } catch {
      /* silent fail — sidebar is supplementary */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 120_000); // refresh every 2 min
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[var(--bp-border)] flex items-center justify-between">
        <h3 className="text-[11px] font-semibold text-[var(--bp-text-muted)] uppercase tracking-wider">
          Live Boston Data
        </h3>
        {lastUpdated && (
          <span className="text-[9px] text-[var(--bp-text-faint)]">
            {lastUpdated.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : data ? (
          <>
            <DataCard
              icon="transit"
              title="MBTA Transit"
              content={data.mbta}
              accentColor="var(--bp-teal)"
            />
            <DataCard
              icon="weather"
              title="Weather"
              content={data.weather}
              accentColor="var(--bp-blue)"
            />
            <DataCard
              icon="events"
              title="Events Today"
              content={data.events}
              accentColor="var(--bp-purple)"
            />
            <DataCard
              icon="buzz"
              title="City Buzz"
              content={data.buzz}
              accentColor="var(--bp-yellow)"
            />
          </>
        ) : (
          <p className="text-xs text-[var(--bp-text-faint)] p-4 text-center">
            Could not load live data
          </p>
        )}
      </div>
    </div>
  );
}

function DataCard({
  icon,
  title,
  content,
  accentColor,
}: {
  icon: string;
  title: string;
  content: string;
  accentColor: string;
}) {
  const lines = content.split("\n").filter(Boolean);

  return (
    <div className="rounded-xl border border-[var(--bp-glass-border)] bg-[var(--bp-glass)] p-3 animate-[bp-slide-up_0.3s_var(--bp-ease)]">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="h-6 w-6 rounded-md flex items-center justify-center"
          style={{ backgroundColor: `color-mix(in srgb, ${accentColor} 12%, transparent)` }}
        >
          <DataIcon type={icon} color={accentColor} />
        </div>
        <span className="text-[11px] font-semibold text-[var(--bp-text)]">
          {title}
        </span>
        <span
          className="h-1.5 w-1.5 rounded-full ml-auto animate-pulse"
          style={{ backgroundColor: accentColor }}
        />
      </div>

      <div className="space-y-1">
        {lines.map((line, i) => (
          <p
            key={i}
            className="text-[11px] text-[var(--bp-text-muted)] leading-relaxed"
          >
            {line.length > 120 ? line.slice(0, 120) + "..." : line}
          </p>
        ))}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[var(--bp-glass-border)] bg-[var(--bp-glass)] p-3 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-6 w-6 rounded-md bg-[var(--bp-surface-2)]" />
        <div className="h-3 w-24 rounded bg-[var(--bp-surface-2)]" />
      </div>
      <div className="space-y-2">
        <div className="h-2.5 w-full rounded bg-[var(--bp-surface-2)]" />
        <div className="h-2.5 w-3/4 rounded bg-[var(--bp-surface-2)]" />
      </div>
    </div>
  );
}

function DataIcon({ type, color }: { type: string; color: string }) {
  const props = {
    width: 12,
    height: 12,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (type) {
    case "transit":
      return (
        <svg {...props}>
          <rect x="4" y="3" width="16" height="14" rx="2" />
          <path d="M4 11h16" />
          <path d="M12 3v8" />
        </svg>
      );
    case "weather":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41" />
        </svg>
      );
    case "events":
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      );
    case "buzz":
      return (
        <svg {...props}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    default:
      return null;
  }
}
