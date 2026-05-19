"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { calendarApi, notesApi, CalendarEvent, AcademicNote } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  User, Calendar, FileText, Clock, Tag, ArrowRight, Sparkles,
} from "lucide-react";
import Link from "next/link";

const CATEGORY_DOT: Record<string, string> = {
  "Exam":          "bg-red-500",
  "Assignment":    "bg-amber-500",
  "Study Session": "bg-ink-400",
  "Class":         "bg-blue-500",
  "Other":         "bg-slate-500",
};

export default function DashboardPage() {
  const { user, signInWithGoogle } = useAuth();
  const [events, setEvents]   = useState<CalendarEvent[]>([]);
  const [notes,  setNotes]    = useState<AcademicNote[]>([]);
  const [loading, setLoading] = useState(false);

  const today = new Date();

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      calendarApi.list(today.getMonth() + 1, today.getFullYear()),
      notesApi.list(),
    ]).then(([evRes, noteRes]) => {
      setEvents(evRes.data);
      setNotes(noteRes.data);
    }).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const upcoming = events
    .filter(e => new Date(e.start_time) >= today)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 5);

  const recentNotes = notes.slice(0, 5);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <User size={48} className="text-academic-muted" />
        <p className="text-academic-subtle">Sign in to view your dashboard</p>
        <button
          onClick={signInWithGoogle}
          className="px-5 py-2.5 bg-ink-400 hover:bg-ink-300 text-white font-semibold rounded-xl text-sm transition-all"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-8">
        {user.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.photoURL} alt="avatar" className="w-14 h-14 rounded-2xl border-2 border-ink-400/30" />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-ink-400/20 flex items-center justify-center border border-ink-400/30">
            <User size={24} className="text-ink-400" />
          </div>
        )}
        <div>
          <h1 className="font-display font-bold text-xl text-academic-text">
            {user.displayName ?? "Student"}
          </h1>
          <p className="text-sm text-academic-subtle">{user.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Events This Month", value: events.length,   icon: Calendar, color: "text-ink-400",    bg: "bg-ink-400/10" },
          { label: "Upcoming",          value: upcoming.length, icon: Clock,    color: "text-amber-400",  bg: "bg-amber-400/10" },
          { label: "Saved Notes",       value: notes.length,    icon: FileText, color: "text-violet-400", bg: "bg-violet-400/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="p-5 bg-academic-card border border-academic-border rounded-2xl">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", bg)}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-2xl font-bold text-academic-text">{loading ? "—" : value}</p>
            <p className="text-xs text-academic-subtle mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming events */}
        <div className="bg-academic-card border border-academic-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-academic-border">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-ink-400" />
              <span className="text-sm font-semibold text-academic-text">Upcoming Events</span>
            </div>
            <Link href="/calendar" className="text-xs text-ink-400 hover:text-ink-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="divide-y divide-academic-border/50">
            {loading ? (
              <p className="text-xs text-academic-subtle p-4">Loading...</p>
            ) : upcoming.length === 0 ? (
              <p className="text-xs text-academic-subtle p-4">No upcoming events this month.</p>
            ) : (
              upcoming.map(ev => (
                <div key={ev.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className={cn("w-2 h-2 rounded-full flex-shrink-0", CATEGORY_DOT[ev.category] ?? "bg-slate-500")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-academic-text truncate">{ev.title}</p>
                    <p className="text-[10px] text-academic-subtle flex items-center gap-1">
                      <Clock size={9} />
                      {new Date(ev.start_time).toLocaleDateString([], { month: "short", day: "numeric" })}
                      &nbsp;{new Date(ev.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      &nbsp;·&nbsp;
                      <Tag size={9} /> {ev.category}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent notes */}
        <div className="bg-academic-card border border-academic-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-academic-border">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-violet-400" />
              <span className="text-sm font-semibold text-academic-text">Recent Notes</span>
            </div>
            <Link href="/notes" className="text-xs text-ink-400 hover:text-ink-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="divide-y divide-academic-border/50">
            {loading ? (
              <p className="text-xs text-academic-subtle p-4">Loading...</p>
            ) : recentNotes.length === 0 ? (
              <p className="text-xs text-academic-subtle p-4">No notes yet. Head to the canvas!</p>
            ) : (
              recentNotes.map(note => (
                <div key={note.id} className="flex items-start gap-3 px-4 py-2.5">
                  <div className="w-6 h-6 rounded-lg bg-violet-400/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles size={11} className="text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-academic-text truncate">{note.title}</p>
                    {note.ai_summary && (
                      <p className="text-[10px] text-academic-subtle truncate mt-0.5">{note.ai_summary.slice(0, 80)}...</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
