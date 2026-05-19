"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { calendarApi, CalendarEvent, CalendarEventCreate, EventCategory } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  ChevronLeft, ChevronRight, Plus, X, Send, Loader2,
  Calendar, Sparkles, Trash2, Clock, Tag,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const CATEGORY_STYLES: Record<EventCategory, { dot: string; badge: string }> = {
  "Exam":          { dot: "bg-red-500",     badge: "bg-red-500/15 text-red-400 border-red-500/30" },
  "Assignment":    { dot: "bg-amber-500",   badge: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  "Study Session": { dot: "bg-ink-400",     badge: "bg-ink-400/15 text-ink-400 border-ink-400/30" },
  "Class":         { dot: "bg-blue-500",    badge: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  "Other":         { dot: "bg-slate-500",   badge: "bg-slate-500/15 text-slate-400 border-slate-500/30" },
};

const CATEGORIES: EventCategory[] = ["Exam", "Assignment", "Study Session", "Class", "Other"];

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function toLocalISO(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// ── Modal ─────────────────────────────────────────────────────────────────────

interface EventModalProps {
  date?: Date;
  event?: CalendarEvent;
  onSave: (data: CalendarEventCreate) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

function EventModal({ date, event, onSave, onDelete, onClose }: EventModalProps) {
  const defaultStart = date ? new Date(date.setHours(9, 0)) : new Date();
  const defaultEnd   = date ? new Date(date.setHours(10, 0)) : new Date();

  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [start, setStart] = useState(event ? toLocalISO(new Date(event.start_time)) : toLocalISO(defaultStart));
  const [end, setEnd]     = useState(event ? toLocalISO(new Date(event.end_time))   : toLocalISO(defaultEnd));
  const [category, setCategory] = useState<EventCategory>(event?.category ?? "Other");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        start_time: new Date(start).toISOString(),
        end_time: new Date(end).toISOString(),
        category,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete();
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md bg-academic-card border border-academic-border rounded-2xl p-6 animate-slide-up shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-semibold text-academic-text">
            {event ? "Edit Event" : "New Event"}
          </h2>
          <button onClick={onClose} className="p-1.5 text-academic-subtle hover:text-academic-text hover:bg-academic-muted/20 rounded-lg transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <input
            type="text"
            placeholder="Event title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2.5 bg-academic-surface border border-academic-border rounded-xl text-sm text-academic-text placeholder:text-academic-subtle focus:outline-none focus:border-ink-400/60 transition-colors"
          />

          {/* Category */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium border transition-all",
                  category === cat ? CATEGORY_STYLES[cat].badge : "border-academic-border text-academic-subtle hover:border-academic-muted/50"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-academic-subtle mb-1 block">Start</label>
              <input
                type="datetime-local"
                value={start}
                onChange={e => setStart(e.target.value)}
                className="w-full px-3 py-2 bg-academic-surface border border-academic-border rounded-xl text-xs text-academic-text focus:outline-none focus:border-ink-400/60 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-academic-subtle mb-1 block">End</label>
              <input
                type="datetime-local"
                value={end}
                onChange={e => setEnd(e.target.value)}
                className="w-full px-3 py-2 bg-academic-surface border border-academic-border rounded-xl text-xs text-academic-text focus:outline-none focus:border-ink-400/60 transition-colors"
              />
            </div>
          </div>

          {/* Description */}
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2.5 bg-academic-surface border border-academic-border rounded-xl text-sm text-academic-text placeholder:text-academic-subtle focus:outline-none focus:border-ink-400/60 transition-colors resize-none"
          />
        </div>

        <div className="flex items-center justify-between mt-5">
          {event && onDelete ? (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg text-sm transition-all"
            >
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Delete
            </button>
          ) : <div />}

          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-academic-subtle hover:text-academic-text transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-ink-400 hover:bg-ink-300 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── AI Chat Sidebar ───────────────────────────────────────────────────────────

interface AIChatProps {
  onEventDraft: (draft: CalendarEventCreate, msg: string) => void;
}

function AIChat({ onEventDraft }: AIChatProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user"|"ai"; text: string }>>([
    { role: "ai", text: "Hi! Tell me what to schedule. Try: \"Block 2 hours for math revision this Friday at 4pm\"" },
  ]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput("");
    setMessages(m => [...m, { role: "user", text: msg }]);
    setLoading(true);
    try {
      const res = await calendarApi.parseChat(msg);
      const { event, confirmation_message } = res.data;
      setMessages(m => [...m, { role: "ai", text: confirmation_message }]);
      onEventDraft(event, confirmation_message);
    } catch {
      setMessages(m => [...m, { role: "ai", text: "Sorry, I couldn't parse that. Please try rephrasing." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-academic-border">
        <div className="w-6 h-6 rounded-lg bg-ink-400/20 flex items-center justify-center">
          <Sparkles size={12} className="text-ink-400" />
        </div>
        <span className="text-sm font-semibold text-academic-text">AI Scheduler</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed",
              m.role === "user"
                ? "bg-ink-400 text-white"
                : "bg-academic-card border border-academic-border text-academic-subtle"
            )}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-3 py-2 bg-academic-card border border-academic-border rounded-xl">
              <Loader2 size={12} className="animate-spin text-ink-400" />
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-academic-border">
        <div className="flex items-center gap-2 px-3 py-2 bg-academic-surface border border-academic-border rounded-xl focus-within:border-ink-400/60 transition-colors">
          <input
            type="text"
            placeholder="Describe your event…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            className="flex-1 bg-transparent text-xs text-academic-text placeholder:text-academic-subtle focus:outline-none"
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="p-1 text-ink-400 disabled:opacity-40 hover:text-ink-300 transition-colors"
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Calendar Page ─────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const { user, signInWithGoogle } = useAuth();
  const today = new Date();
  const [currentYear, setCurrentYear]   = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [events, setEvents]   = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [modalDate,  setModalDate]  = useState<Date | undefined>();
  const [editEvent,  setEditEvent]  = useState<CalendarEvent | undefined>();
  const [showModal,  setShowModal]  = useState(false);

  // Confirm AI draft
  const [aiDraft, setAiDraft] = useState<CalendarEventCreate | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await calendarApi.list(currentMonth + 1, currentYear);
      setEvents(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [user, currentMonth, currentYear]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // ── Calendar grid helpers ─────────────────────────────────────────────────

  const daysInMonth  = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstWeekDay = new Date(currentYear, currentMonth, 1).getDay();

  const eventsForDay = (day: number) => {
    return events.filter(e => {
      const d = new Date(e.start_time);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth && d.getDate() === day;
    });
  };

  const isToday = (day: number) =>
    day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  // ── Handlers ──────────────────────────────────────────────────────────────

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const openCreate = (day: number) => {
    setEditEvent(undefined);
    setModalDate(new Date(currentYear, currentMonth, day));
    setShowModal(true);
  };

  const openEdit = (e: CalendarEvent) => {
    setModalDate(undefined);
    setEditEvent(e);
    setShowModal(true);
  };

  const handleSave = async (data: CalendarEventCreate) => {
    if (editEvent) {
      await calendarApi.update(editEvent.id, data);
    } else {
      await calendarApi.create(data);
    }
    await fetchEvents();
  };

  const handleDelete = async () => {
    if (!editEvent) return;
    await calendarApi.delete(editEvent.id);
    await fetchEvents();
  };

  const handleAIDraft = (draft: CalendarEventCreate) => {
    setAiDraft(draft);
  };

  const confirmAIDraft = async () => {
    if (!aiDraft) return;
    await calendarApi.create(aiDraft);
    await fetchEvents();
    setAiDraft(null);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Calendar size={48} className="text-academic-muted" />
        <p className="text-academic-subtle">Sign in to access your calendar</p>
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
    <div className="flex h-[calc(100vh-60px)] overflow-hidden">

      {/* ── Calendar main ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-academic-border bg-academic-surface/50">
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="p-1.5 hover:bg-academic-card rounded-lg transition-all text-academic-subtle hover:text-academic-text">
              <ChevronLeft size={16} />
            </button>
            <h2 className="font-display font-semibold text-academic-text text-base min-w-[160px] text-center">
              {MONTHS[currentMonth]} {currentYear}
            </h2>
            <button onClick={nextMonth} className="p-1.5 hover:bg-academic-card rounded-lg transition-all text-academic-subtle hover:text-academic-text">
              <ChevronRight size={16} />
            </button>
          </div>
          <button
            onClick={() => { setEditEvent(undefined); setModalDate(new Date()); setShowModal(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-ink-400 hover:bg-ink-300 text-white text-xs font-semibold rounded-lg transition-all"
          >
            <Plus size={13} /> Add Event
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-academic-border">
          {DAYS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-academic-subtle tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className={cn("flex-1 overflow-y-auto scrollbar-thin", loading && "opacity-60 pointer-events-none")}>
          <div className="grid grid-cols-7 auto-rows-fr min-h-full">
            {/* Empty leading cells */}
            {Array.from({ length: firstWeekDay }).map((_, i) => (
              <div key={`empty-${i}`} className="border-r border-b border-academic-border/50 min-h-[90px] bg-academic-bg/30" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const dayEvents = eventsForDay(day);
              return (
                <div
                  key={day}
                  onClick={() => openCreate(day)}
                  className="border-r border-b border-academic-border/50 min-h-[90px] p-1.5 cursor-pointer hover:bg-academic-card/40 transition-colors group"
                >
                  <span className={cn(
                    "inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-medium mb-1",
                    isToday(day)
                      ? "bg-ink-400 text-white"
                      : "text-academic-subtle group-hover:text-academic-text"
                  )}>
                    {day}
                  </span>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map(ev => (
                      <div
                        key={ev.id}
                        onClick={e => { e.stopPropagation(); openEdit(ev); }}
                        className={cn(
                          "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium truncate cursor-pointer hover:opacity-80 transition-opacity border",
                          CATEGORY_STYLES[ev.category].badge
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", CATEGORY_STYLES[ev.category].dot)} />
                        <span className="truncate">{ev.title}</span>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-academic-subtle px-1.5">+{dayEvents.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── AI Chat Sidebar ─────────────────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 border-l border-academic-border bg-academic-surface/30 flex flex-col">
        <AIChat onEventDraft={handleAIDraft} />
      </div>

      {/* AI Draft confirm banner */}
      {aiDraft && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-3 bg-academic-card border border-ink-400/40 rounded-xl shadow-glow-sm animate-slide-up max-w-sm w-full">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-academic-text truncate">{aiDraft.title}</p>
            <p className="text-[10px] text-academic-subtle flex items-center gap-1 mt-0.5">
              <Clock size={9} /> {new Date(aiDraft.start_time).toLocaleString([], { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })}
              &nbsp;·&nbsp;
              <Tag size={9} /> {aiDraft.category}
            </p>
          </div>
          <button onClick={confirmAIDraft} className="px-3 py-1.5 bg-ink-400 hover:bg-ink-300 text-white text-xs font-semibold rounded-lg transition-all flex-shrink-0">
            Add
          </button>
          <button onClick={() => setAiDraft(null)} className="p-1 text-academic-subtle hover:text-academic-text">
            <X size={13} />
          </button>
        </div>
      )}

      {/* Event Modal */}
      {showModal && (
        <EventModal
          date={modalDate}
          event={editEvent}
          onSave={handleSave}
          onDelete={editEvent ? handleDelete : undefined}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
