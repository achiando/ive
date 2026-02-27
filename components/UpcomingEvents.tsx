"use client";
import { useState, useRef, useEffect } from "react";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type TagColor = "red" | "green";

interface EventDate {
  label: string;
  value: string;
}

interface EventCTA {
  label: string;
  href: string;
}

interface Event {
  id: number;
  tag: string;
  title: string;
  subtitle: string;
  body: string;
  dates: EventDate[];
  cta: EventCTA;
  contact: string;
  poster: string | null;
  tagColor: TagColor;
}

interface TagStyle {
  tag: string;
  btn: string;
  pip: string;
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const EVENTS: Event[] = [
  {
    id: 1,
    tag: "Design Challenge",
    title: "Invention Education Program",
    subtitle: "Assistive Device Design Challenge",
    body: "Design affordable, practical assistive devices addressing challenges for caregivers of persons living with disabilities and chronic illnesses. Build a functional prototype at our Design Studio.",
    dates: [
      { label: "Info Session", value: "2nd March 2026" },
      { label: "Design Challenge", value: "23rd – 27th March 2026" },
    ],
    cta: { label: "Submit Expression of Interest", href: "https://forms.gle/xHQR1k13c4CkT5GdA" },
    contact: "ive@ku.ac.ke",
    poster: "/disability.jpeg", // replace with e.g. "/posters/ive-challenge.jpg"
    tagColor: "red",
  },
  {
    id: 2,
    tag: "Poster Presentation",
    title: "IvE Poster Presentation",
    subtitle: "Next-Gen Biomedical Solutions Showcase",
    body: "A showcase of the next generation of biomedical solutions — a launchpad for careers in Medical Device Innovation. Meet past participants and learn how you can get involved.",
    dates: [
      { label: "Date", value: "6th March 2026" },
      { label: "Time", value: "2:00 PM – 4:00 PM" },
      { label: "Venue", value: "CDIE, Graduate School, KU" },
    ],
    cta: { label: "Register for Info Session", href: "https://forms.gle/whmtvyj6CHTGThZs8" },
    contact: "ive@ku.ac.ke",
    poster: "/poster.jpeg", // replace with e.g. "/posters/ive-poster.jpg"
    tagColor: "green",
  },
];

const TAG_STYLES: Record<TagColor, TagStyle> = {
  red: {
    tag: "bg-red-50 text-red-700 border border-red-200",
    btn: "bg-red-700 hover:bg-red-800",
    pip: "bg-red-600",
  },
  green: {
    tag: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    btn: "bg-emerald-700 hover:bg-emerald-800",
    pip: "bg-emerald-600",
  },
};

const ACCENT_TEXT: Record<TagColor, string> = {
  red: "text-red-600",
  green: "text-emerald-600",
};

// ─── PLACEHOLDER SVG ──────────────────────────────────────────────────────────
function PosterPlaceholder({ color }: { color: TagColor }) {
  const isRed = color === "red";
  return (
    <svg
      viewBox="0 0 400 220"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isRed ? "#fff1f2" : "#f0fdf4"} />
          <stop offset="100%" stopColor={isRed ? "#ffe4e6" : "#dcfce7"} />
        </linearGradient>
        <pattern id={`grid-${color}`} width="24" height="24" patternUnits="userSpaceOnUse">
          <path
            d="M 24 0 L 0 0 0 24"
            fill="none"
            stroke={isRed ? "#fecdd3" : "#bbf7d0"}
            strokeWidth="0.8"
          />
        </pattern>
      </defs>
      <rect width="400" height="220" fill={`url(#grad-${color})`} />
      <rect width="400" height="220" fill={`url(#grid-${color})`} />
      <circle cx="200" cy="100" r="38" fill={isRed ? "#fecdd3" : "#bbf7d0"} />
      <circle cx="200" cy="100" r="26" fill={isRed ? "#fda4af" : "#86efac"} />
      <circle cx="200" cy="100" r="14" fill={isRed ? "#f43f5e" : "#16a34a"} opacity="0.8" />
      <circle cx="200" cy="100" r="56" fill="none" stroke={isRed ? "#fda4af" : "#86efac"} strokeWidth="1" strokeDasharray="6 4" />
      <circle cx="200" cy="100" r="70" fill="none" stroke={isRed ? "#fecdd3" : "#bbf7d0"} strokeWidth="1" strokeDasharray="3 6" />
      <rect x="16" y="16" width="30" height="3" rx="2" fill={isRed ? "#f43f5e" : "#16a34a"} opacity="0.4" />
      <rect x="16" y="16" width="3" height="30" rx="2" fill={isRed ? "#f43f5e" : "#16a34a"} opacity="0.4" />
      <rect x="354" y="16" width="30" height="3" rx="2" fill={isRed ? "#f43f5e" : "#16a34a"} opacity="0.4" />
      <rect x="381" y="16" width="3" height="30" rx="2" fill={isRed ? "#f43f5e" : "#16a34a"} opacity="0.4" />
    </svg>
  );
}

// ─── NAV BUTTON ───────────────────────────────────────────────────────────────
interface NavBtnProps {
  onClick: () => void;
  disabled: boolean;
  dir: "left" | "right";
}

function NavBtn({ onClick, disabled, dir }: NavBtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "right" ? "Next" : "Previous"}
      className={[
        "flex items-center justify-center w-10 h-10 rounded-xl border transition-all duration-200",
        disabled
          ? "border-gray-200 text-gray-300 cursor-not-allowed bg-white"
          : "border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-900 hover:shadow-sm bg-white cursor-pointer",
      ].join(" ")}
    >
      {dir === "right" ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M13 8H3M8 3L3 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const CARD_WIDTH = 352;

export default function EventsCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState<boolean>(false);
  const [canRight, setCanRight] = useState<boolean>(EVENTS.length > 1);
  const [activeIdx, setActiveIdx] = useState<number>(0);

  const updateState = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 10);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    setActiveIdx(Math.min(Math.round(el.scrollLeft / CARD_WIDTH), EVENTS.length - 1));
  };

  const scrollBy = (dir: "left" | "right") => {
    trackRef.current?.scrollBy({
      left: dir === "right" ? CARD_WIDTH : -CARD_WIDTH,
      behavior: "smooth",
    });
  };

  const goTo = (i: number) => {
    trackRef.current?.scrollTo({ left: i * CARD_WIDTH, behavior: "smooth" });
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateState, { passive: true });
    updateState();
    return () => el.removeEventListener("scroll", updateState);
  }, []);

  return (
    <section className="bg-white py-16 overflow-hidden">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10">
        <div className="flex items-end justify-between gap-4 mb-10 flex-wrap">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-emerald-700 uppercase mb-2">
              <span className="inline-block w-5 h-0.5 bg-emerald-700 rounded" />
              CDIE · Chandaria Innovation Hub
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
              Upcoming <span className="text-red-700">Events</span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <NavBtn dir="left" onClick={() => scrollBy("left")} disabled={!canLeft} />
            <NavBtn dir="right" onClick={() => scrollBy("right")} disabled={!canRight} />
          </div>
        </div>
      </div>

      {/* Track */}
      <div className="relative max-w-6xl mx-auto">
        {/* Edge fades */}
        <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div
          ref={trackRef}
          className="flex gap-5 overflow-x-auto pb-6 px-6 sm:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {EVENTS.map((ev) => {
            const s = TAG_STYLES[ev.tagColor];
            return (
              <article
                key={ev.id}
                className="flex-none w-80 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 flex flex-col overflow-hidden"
                style={{ scrollSnapAlign: "start" }}
              >
                {/* Poster */}
                <div className="relative h-44 overflow-hidden bg-gray-50 flex-shrink-0">
                  {ev.poster ? (
                    <img
                      src={ev.poster}
                      alt={`${ev.title} poster`}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  ) : (
                    <PosterPlaceholder color={ev.tagColor} />
                  )}
                  <span className={`absolute top-3 left-3 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full ${s.tag}`}>
                    {ev.tag}
                  </span>
                </div>

                {/* Body */}
                <div className="flex flex-col gap-3 p-5 flex-1">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 leading-snug">{ev.title}</h3>
                    <p className={`text-[11px] font-semibold uppercase tracking-wider mt-1 ${ACCENT_TEXT[ev.tagColor]}`}>
                      {ev.subtitle}
                    </p>
                  </div>

                  <p className="text-sm text-gray-500 leading-relaxed">{ev.body}</p>

                  {/* Dates */}
                  <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
                    {ev.dates.map((d) => (
                      <div key={d.label} className="flex items-center gap-2.5 text-sm">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.pip}`} />
                        <span className="font-semibold text-gray-700 w-28 flex-shrink-0">{d.label}</span>
                        <span className="text-gray-400">{d.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="border-t border-gray-100 pt-3 mt-auto flex flex-col gap-2">
                    <a
                      href={ev.cta.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-white text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 ${s.btn}`}
                    >
                      {ev.cta.label}
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                    <p className="text-xs text-gray-400 text-center">
                      Inquiries:{" "}
                      <a
                        href={`mailto:${ev.contact}`}
                        className="text-gray-500 hover:text-gray-700 underline underline-offset-2"
                      >
                        {ev.contact}
                      </a>
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-2 mt-2">
        {EVENTS.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to event ${i + 1}`}
            className={`rounded-full transition-all duration-300 cursor-pointer ${
              i === activeIdx ? "w-6 h-2 bg-red-700" : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
            }`}
          />
        ))}
      </div>
    </section>
  );
}