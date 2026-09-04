/**
 * components/dashboard/DashboardHeader.tsx
 *
 * Green Flora agricultural hero carousel.
 *
 * - Changes the farm scene every 6 seconds.
 * - In English mode: Alternates between English and Urdu scenes (Left-aligned).
 * - In Urdu mode: Filters out English entirely; shows ONLY Urdu scenes (Right-aligned).
 * - Fixed alignment: Urdu text in English mode is forced to physically align left.
 */

"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Leaf } from "lucide-react";

import Badge from "@/components/ui/Badge";

interface DashboardHeaderProps {
  farmerName: string;
  greeting?: string | null;
  isDemo?: boolean;
}

type Scene = {
  image: string;
  message: string;
  language: "en" | "ur";
  accent?: string;
};

const SCENES: Scene[] = [
  {
    image: "/images/dashboard/farm-scenes/sunrise.jpg",
    message: "A good day starts with a clear view of your farm.",
    language: "en",
    accent: "Good day",
  },
  {
    image: "/images/dashboard/farm-scenes/rain.jpg",
    message: "بارش کے بعد فصل اور زمین کی صورتحال پر نظر رکھیں۔",
    language: "ur",
    accent: "موسم",
  },
  {
    image: "/images/dashboard/farm-scenes/spring.jpg",
    message: "Every season brings a new opportunity for your farm.",
    language: "en",
    accent: "new opportunity",
  },
  {
    image: "/images/dashboard/farm-scenes/irrigation.jpg",
    message: "پانی کی بروقت فراہمی فصل کی بہتر نشوونما میں مدد دیتی ہے۔",
    language: "ur",
    accent: "پانی",
  },
  {
    image: "/images/dashboard/farm-scenes/crops.jpg",
    message: "Keep an eye on your crops and give them what they need.",
    language: "en",
    accent: "your crops",
  },
  {
    image: "/images/dashboard/farm-scenes/planting.jpg",
    message: "صحیح وقت پر کیا گیا کام بہتر فصل کی بنیاد بنتا ہے۔",
    language: "ur",
    accent: "صحیح وقت",
  },
  {
    image: "/images/dashboard/farm-scenes/wheat.jpg",
    message: "Small decisions today can make a difference at harvest.",
    language: "en",
    accent: "a difference",
  },
  {
    image: "/images/dashboard/farm-scenes/cloudy.jpg",
    message: "موسم کو سمجھیں، اپنی فصل کے لیے بہتر فیصلہ کریں۔",
    language: "ur",
    accent: "موسم",
  },
  {
    image: "/images/dashboard/farm-scenes/harvest.jpg",
    message: "Your hard work grows with every careful decision.",
    language: "en",
    accent: "careful decision",
  },
  {
    image: "/images/dashboard/farm-scenes/sunset.jpg",
    message: "آج کی محنت، کل کی بہتر فصل کی طرف ایک قدم ہے۔",
    language: "ur",
    accent: "آج کی محنت",
  },
];

export default function DashboardHeader({
  farmerName,
  greeting: _greeting,
  isDemo,
}: DashboardHeaderProps) {
  const [sceneCounter, setSceneCounter] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isUrduAppMode, setIsUrduAppMode] = useState(false);

  useEffect(() => {
    if (document.cookie.includes("googtrans=/en/ur") || document.documentElement.dir === "rtl") {
      setIsUrduAppMode(true);
    }
  }, []);

  const activeScenes = isUrduAppMode
    ? SCENES.filter((s) => s.language === "ur")
    : SCENES;

  const currentScene = activeScenes[sceneCounter % activeScenes.length];
  const isUrduText = currentScene.language === "ur";

  const today = new Date().toLocaleDateString(isUrduAppMode ? "ur-PK" : "en-PK", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  
  const bottomMessage = isUrduAppMode
    ? "آج آپ کے فارم کی صورتحال کچھ یوں ہے۔"
    : "Here's how your farm looks today.";

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIsVisible(false);
      window.setTimeout(() => {
        setSceneCounter((current) => current + 1);
        setIsVisible(true);
      }, 350);
    }, 6000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="relative mb-6 min-h-[280px] overflow-hidden rounded-2xl bg-primary-900 shadow-elevated sm:min-h-[300px]">
      
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out"
        style={{
          backgroundImage: `url("${currentScene.image}")`,
          opacity: isVisible ? 1 : 0,
          transform: isUrduAppMode ? "scaleX(-1)" : "none",
        }}
        aria-hidden="true"
      />
      
      {/* 
        FIX: Gradient explicitly stops at 65%, leaving the remaining 35% of the image 100% crystal clear. 
      */}
      <div
        className={`pointer-events-none absolute inset-0 ${
          isUrduAppMode
            ? "bg-gradient-to-l from-primary-950 from-10% via-primary-900/80 via-45% to-transparent to-65%"
            : "bg-gradient-to-r from-primary-950 from-10% via-primary-900/80 via-45% to-transparent to-65%"
        }`}
        aria-hidden="true" 
      />
      
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-primary-950/50 to-transparent" aria-hidden="true" />
      
      <Leaf
        className={`pointer-events-none absolute top-5 h-9 w-9 text-primary-200/20 ${
          isUrduAppMode ? "right-5" : "left-5"
        }`}
        strokeWidth={1.5}
        aria-hidden="true"
      />

      {isDemo && (
        <div className={`absolute top-5 z-20 sm:top-7 ${isUrduAppMode ? "left-5 sm:left-7" : "right-5 sm:right-7"}`}>
          <Badge variant="warning">Demo data</Badge>
        </div>
      )}

      <div className="relative z-10 flex min-h-[280px] items-end px-5 py-7 sm:min-h-[300px] sm:px-8 sm:py-8 lg:px-10">
        <div className={`w-full max-w-2xl transition-all duration-500 ease-out ${isVisible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"}`}>
          
          <div className="flex flex-col items-start">
            <h1
              dir={isUrduText ? "rtl" : "ltr"}
              lang={isUrduText ? "ur" : "en"}
              className={`max-w-xl text-2xl font-semibold leading-snug tracking-tight text-white sm:text-3xl lg:text-[2.15rem] ${
                isUrduAppMode ? "text-right" : "text-left"
              } ${
                isUrduText
                  ? "font-serif leading-[1.8] sm:text-[2rem] lg:text-[2.25rem]"
                  : ""
              }`}
            >
              {currentScene.message}
            </h1>

            <div className="mt-4 h-px w-9 bg-primary-300/80" />

            <div
              className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-primary-100/90 notranslate"
              translate="no"
              dir={isUrduAppMode ? "rtl" : "ltr"}
            >
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-primary-300" />
                {today}
              </span>

              <span className="hidden h-4 w-px bg-white/25 sm:block" />

              <span className="inline-flex items-center gap-1.5">
                <Leaf className="h-4 w-4 text-primary-300" />
                {bottomMessage}
              </span>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-1.5" aria-label="Farm scene carousel">
            {activeScenes.map((item, index) => {
              const isActive = (sceneCounter % activeScenes.length) === index;
              return (
                <span
                  key={item.image}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isActive ? "w-5 bg-primary-200" : "w-1.5 bg-white/35"
                  }`}
                  aria-hidden="true"
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}