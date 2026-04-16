"use client";

interface WelcomeScreenProps {
  onSuggestion: (text: string) => void;
}

const QUICK_CARDS = [
  {
    icon: "train",
    title: "Transit Status",
    desc: "MBTA alerts & delays",
    query: "What's the MBTA status right now?",
    color: "var(--bp-teal)",
  },
  {
    icon: "weather",
    title: "Weather",
    desc: "Current conditions",
    query: "What's the weather like in Boston?",
    color: "var(--bp-blue)",
  },
  {
    icon: "event",
    title: "Events Tonight",
    desc: "Shows, sports & more",
    query: "What events are happening in Boston tonight?",
    color: "var(--bp-purple)",
  },
  {
    icon: "pulse",
    title: "Full Briefing",
    desc: "Everything at a glance",
    query: "Give me a full Boston city briefing",
    color: "var(--bp-accent)",
  },
];

export function WelcomeScreen({ onSuggestion }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[500px] p-6">
      <div className="max-w-lg w-full text-center">
        {/* Hero icon */}
        <div className="relative mx-auto w-20 h-20 mb-6">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--bp-accent)]/20 to-[var(--bp-teal)]/10 blur-xl" />
          <div className="relative h-full w-full rounded-2xl bg-[var(--bp-surface)] border border-[var(--bp-border)] flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--bp-accent)]">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-[var(--bp-text)] mb-2">
          What&apos;s happening in Boston?
        </h1>
        <p className="text-sm text-[var(--bp-text-muted)] mb-8 leading-relaxed">
          Real-time transit, weather, events & city buzz — powered by
          multi-hop AI reasoning
        </p>

        {/* Quick action cards */}
        <div className="grid grid-cols-2 gap-3">
          {QUICK_CARDS.map((card) => (
            <button
              key={card.title}
              type="button"
              onClick={() => onSuggestion(card.query)}
              className={[
                "group text-left p-4 rounded-xl",
                "bg-[var(--bp-surface)] border border-[var(--bp-border)]",
                "hover:border-[var(--bp-border-light)] hover:bg-[var(--bp-surface-2)]",
                "transition-all duration-200",
                "active:scale-[0.98]",
              ].join(" ")}
            >
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center mb-3"
                style={{ backgroundColor: `color-mix(in srgb, ${card.color} 12%, transparent)` }}
              >
                <CardIcon type={card.icon} color={card.color} />
              </div>
              <p className="text-sm font-semibold text-[var(--bp-text)] group-hover:text-[var(--bp-accent)] transition-colors">
                {card.title}
              </p>
              <p className="text-xs text-[var(--bp-text-faint)] mt-0.5">
                {card.desc}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CardIcon({ type, color }: { type: string; color: string }) {
  const props = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (type) {
    case "train":
      return (
        <svg {...props}>
          <rect x="4" y="3" width="16" height="14" rx="2" />
          <path d="M4 11h16" />
          <path d="M12 3v8" />
          <circle cx="8" cy="19" r="1" />
          <circle cx="16" cy="19" r="1" />
          <path d="M6 17l-2 4M18 17l2 4" />
        </svg>
      );
    case "weather":
      return (
        <svg {...props}>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      );
    case "event":
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
          <circle cx="12" cy="16" r="1" />
        </svg>
      );
    case "pulse":
      return (
        <svg {...props}>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      );
    default:
      return null;
  }
}
