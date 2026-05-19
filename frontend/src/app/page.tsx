"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Calendar, FileText, Brain, Sparkles, ArrowRight, BookOpen } from "lucide-react";

const FEATURES = [
  {
    icon: Calendar,
    title: "Smart Academic Calendar",
    description:
      "Schedule exams, assignments, and study sessions. Tell the AI what you need in plain English and watch it build your calendar.",
    color: "text-ink-400",
    bg: "bg-ink-400/10",
    href: "/calendar",
  },
  {
    icon: FileText,
    title: "Canvas Note Board",
    description:
      "Sketch diagrams, write formulas, draw mind-maps on an infinite canvas. Gemini Vision transcribes and summarises your work instantly.",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    href: "/notes",
  },
  {
    icon: Brain,
    title: "Contextual AI Assistant",
    description:
      "Your AI stays aware of what you're doing — scheduling mode on the calendar, tutor mode on a note. One assistant, full context.",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    href: "/calendar",
  },
];

export default function HomePage() {
  const { user, signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-4 pt-24 pb-20 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-ink-400/10 blur-[100px]" />
          <div className="absolute top-20 left-1/4 w-[300px] h-[300px] rounded-full bg-violet-500/5 blur-[80px]" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-ink-400/30 bg-ink-400/10 text-ink-400 text-xs font-semibold mb-6 tracking-wide uppercase">
            <Sparkles size={11} />
            Powered by Gemini 2.5 Flash
          </div>

          <h1 className="font-display font-bold text-5xl sm:text-6xl md:text-7xl text-academic-text leading-[1.1] tracking-tight mb-6">
            Your AI
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-ink-400 to-violet-400">
              Academic Mind
            </span>
          </h1>

          <p className="text-lg text-academic-subtle max-w-xl mx-auto mb-10 leading-relaxed">
            Schedule smarter, study deeper. Talk to your calendar, sketch on the canvas, and let Gemini do the heavy lifting — from OCR to summaries.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {user ? (
              <>
                <Link
                  href="/calendar"
                  className="flex items-center gap-2 px-6 py-3 bg-ink-400 hover:bg-ink-300 text-white font-semibold rounded-xl transition-all shadow-glow-sm hover:shadow-glow-md text-sm"
                >
                  Open Calendar
                  <ArrowRight size={15} />
                </Link>
                <Link
                  href="/notes"
                  className="flex items-center gap-2 px-6 py-3 border border-academic-border bg-academic-card hover:border-ink-400/40 text-academic-text font-semibold rounded-xl transition-all text-sm"
                >
                  <FileText size={15} />
                  Go to Notes
                </Link>
              </>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-7 py-3.5 bg-ink-400 hover:bg-ink-300 text-white font-semibold rounded-xl transition-all shadow-glow-sm hover:shadow-glow-md text-sm"
              >
                Get started — it&apos;s free
                <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 pb-24 w-full">
        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, description, color, bg, href }) => (
            <Link
              key={title}
              href={user ? href : "#"}
              onClick={!user ? signInWithGoogle : undefined}
              className="group relative p-6 rounded-2xl border border-academic-border bg-academic-card hover:border-ink-400/30 transition-all duration-300 hover:shadow-glow-sm cursor-pointer"
            >
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                <Icon size={20} className={color} />
              </div>
              <h3 className="font-display font-semibold text-academic-text mb-2 text-base">{title}</h3>
              <p className="text-sm text-academic-subtle leading-relaxed">{description}</p>
              <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight size={14} className="text-ink-400" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-academic-border py-6 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-academic-subtle">
          <div className="flex items-center gap-1.5">
            <BookOpen size={13} className="text-ink-400" />
            <span>StudyMind — AI Academic Helper</span>
          </div>
          <span>Built with Next.js · FastAPI · Gemini</span>
        </div>
      </footer>
    </div>
  );
}
