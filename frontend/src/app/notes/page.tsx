"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { notesApi, AcademicNote } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Pen, Eraser, Trash2, Download, Loader2, FileText,
  Sparkles, X, CheckCircle, ChevronDown, ChevronUp, Plus,
} from "lucide-react";

// ── Drawing Canvas ────────────────────────────────────────────────────────────

interface CanvasProps {
  onExport: (dataUrl: string) => void;
  onClear: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

function DrawingCanvas({ onExport, onClear, canvasRef }: CanvasProps) {
  const [tool, setTool]       = useState<"pen" | "eraser">("pen");
  const [color, setColor]     = useState("#818cf8");
  const [brushSize, setBrushSize] = useState(3);
  const isDrawing = useRef(false);
  const lastPos   = useRef<{ x: number; y: number } | null>(null);

  // Initialise canvas background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [canvasRef]);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top)  * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    isDrawing.current = true;
    lastPos.current = getPos(e);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === "eraser" ? "#0d1117" : color;
    ctx.lineWidth   = tool === "eraser" ? brushSize * 6 : brushSize;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    ctx.stroke();
    lastPos.current = pos;
  };

  const stopDraw = () => { isDrawing.current = false; lastPos.current = null; };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    onClear();
  };

  const COLORS = ["#818cf8","#c4b5fd","#34d399","#fbbf24","#f87171","#e2e8f0","#64748b"];

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Tools */}
        <div className="flex items-center gap-1 p-1 bg-academic-surface border border-academic-border rounded-lg">
          <button
            onClick={() => setTool("pen")}
            className={cn("p-1.5 rounded-md transition-all", tool === "pen" ? "bg-ink-400/20 text-ink-400" : "text-academic-subtle hover:text-academic-text")}
          >
            <Pen size={14} />
          </button>
          <button
            onClick={() => setTool("eraser")}
            className={cn("p-1.5 rounded-md transition-all", tool === "eraser" ? "bg-academic-muted/30 text-academic-text" : "text-academic-subtle hover:text-academic-text")}
          >
            <Eraser size={14} />
          </button>
        </div>

        {/* Colors */}
        <div className="flex items-center gap-1.5">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => { setColor(c); setTool("pen"); }}
              style={{ background: c }}
              className={cn(
                "w-5 h-5 rounded-full transition-all border-2",
                color === c && tool === "pen" ? "border-white scale-110" : "border-transparent hover:scale-105"
              )}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={e => { setColor(e.target.value); setTool("pen"); }}
            className="w-5 h-5 rounded-full border border-academic-border cursor-pointer bg-transparent"
            title="Custom color"
          />
        </div>

        {/* Brush size */}
        <input
          type="range" min={1} max={12} value={brushSize}
          onChange={e => setBrushSize(Number(e.target.value))}
          className="w-20 accent-ink-400"
        />

        {/* Actions */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => { const c = canvasRef.current; if (c) onExport(c.toDataURL("image/png")); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-academic-border text-academic-subtle hover:text-academic-text hover:border-academic-muted/50 rounded-lg text-xs transition-all"
          >
            <Download size={12} /> Export
          </button>
          <button
            onClick={clearCanvas}
            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-lg text-xs transition-all"
          >
            <Trash2 size={12} /> Clear
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative rounded-xl overflow-hidden border border-academic-border">
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          className="w-full h-full canvas-cursor touch-none"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
      </div>
    </div>
  );
}

// ── Note Card ─────────────────────────────────────────────────────────────────

function NoteCard({ note, onDelete }: { note: AcademicNote; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-academic-border bg-academic-card rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-academic-surface/40 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="w-7 h-7 rounded-lg bg-ink-400/10 flex items-center justify-center flex-shrink-0">
          <FileText size={13} className="text-ink-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-academic-text truncate">{note.title}</p>
          <p className="text-[10px] text-academic-subtle">
            {new Date(note.created_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="p-1 text-academic-subtle hover:text-red-400 transition-colors"
          >
            <Trash2 size={12} />
          </button>
          {expanded ? <ChevronUp size={13} className="text-academic-subtle" /> : <ChevronDown size={13} className="text-academic-subtle" />}
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 border-t border-academic-border/50 space-y-3 pt-3">
          {note.extracted_text && (
            <div>
              <p className="text-[10px] font-semibold text-academic-subtle uppercase tracking-wide mb-1">Extracted Text</p>
              <p className="text-xs text-academic-text leading-relaxed whitespace-pre-wrap">{note.extracted_text}</p>
            </div>
          )}
          {note.ai_summary && (
            <div>
              <p className="text-[10px] font-semibold text-ink-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Sparkles size={9} /> AI Summary
              </p>
              <p className="text-xs text-academic-subtle leading-relaxed whitespace-pre-wrap">{note.ai_summary}</p>
            </div>
          )}
          {note.action_items.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide mb-1">Action Items</p>
              <ul className="space-y-1">
                {note.action_items.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-academic-subtle">
                    <CheckCircle size={11} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Notes Page ────────────────────────────────────────────────────────────────

export default function NotesPage() {
  const { user, signInWithGoogle } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [notes, setNotes]       = useState<AcademicNote[]>([]);
  const [title, setTitle]       = useState("");
  const [processing, setProcessing] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"canvas" | "notes">("canvas");

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    try {
      const res = await notesApi.list();
      setNotes(res.data);
    } catch { /* silent */ }
  }, [user]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !title.trim()) return;
    setProcessing(true);
    setError(null);
    try {
      const dataUrl = canvas.toDataURL("image/png");
      await notesApi.create(title.trim(), dataUrl);
      await fetchNotes();
      setTitle("");
      // Clear canvas
      const ctx = canvas.getContext("2d");
      if (ctx) { ctx.fillStyle = "#0d1117"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
      setHasDrawing(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Processing failed. Please try again.";
      setError(msg);
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    await notesApi.delete(id);
    await fetchNotes();
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <FileText size={48} className="text-academic-muted" />
        <p className="text-academic-subtle">Sign in to access your notes</p>
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
    <div className="flex flex-col h-[calc(100vh-60px)] overflow-hidden">

      {/* Mobile tab bar */}
      <div className="md:hidden flex border-b border-academic-border bg-academic-surface/80 flex-shrink-0">
        <button
          onClick={() => setMobileTab("canvas")}
          className={cn(
            "flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2",
            mobileTab === "canvas"
              ? "text-ink-400 border-ink-400"
              : "text-academic-subtle border-transparent"
          )}
        >
          <Pen size={12} /> Canvas
        </button>
        <button
          onClick={() => setMobileTab("notes")}
          className={cn(
            "flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2",
            mobileTab === "notes"
              ? "text-ink-400 border-ink-400"
              : "text-academic-subtle border-transparent"
          )}
        >
          <FileText size={12} /> Notes ({notes.length})
        </button>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

      {/* ── Notes Sidebar ────────────────────────────────────────────────── */}
      <div className={cn(
        "flex-shrink-0 border-r border-academic-border bg-academic-surface/30 flex-col",
        "hidden md:flex md:w-72",
        mobileTab === "notes" ? "!flex w-full" : ""
      )}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-academic-border">
          <FileText size={14} className="text-ink-400" />
          <span className="text-sm font-semibold text-academic-text">Saved Notes</span>
          <span className="ml-auto text-xs text-academic-subtle">{notes.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
          {notes.length === 0 ? (
            <p className="text-xs text-academic-subtle text-center py-8">
              No notes yet. Draw something and save it!
            </p>
          ) : (
            notes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onDelete={() => handleDelete(note.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Canvas Main ──────────────────────────────────────────────────── */}
      <div className={cn(
        "flex-1 flex-col p-4 gap-3 min-w-0 overflow-hidden",
        mobileTab === "canvas" ? "flex" : "hidden md:flex"
      )}>

        {/* Save bar */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Note title…"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="flex-1 px-3 py-2 bg-academic-surface border border-academic-border rounded-xl text-sm text-academic-text placeholder:text-academic-subtle focus:outline-none focus:border-ink-400/60 transition-colors"
          />
          <button
            onClick={handleSave}
            disabled={!title.trim() || processing}
            className="flex items-center gap-2 px-4 py-2 bg-ink-400 hover:bg-ink-300 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-glow-sm hover:shadow-glow-md"
          >
            {processing
              ? <><Loader2 size={14} className="animate-spin" /> Analysing…</>
              : <><Sparkles size={14} /> Save &amp; Analyse</>
            }
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
            <X size={12} /> {error}
          </div>
        )}

        {processing && (
          <div className="flex items-center gap-2 px-3 py-2 bg-ink-400/10 border border-ink-400/30 rounded-xl text-xs text-ink-400 animate-pulse-soft">
            <Sparkles size={12} />
            Gemini Vision is transcribing and summarising your notes…
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 min-h-0">
          <DrawingCanvas
            canvasRef={canvasRef}
            onExport={(_dataUrl) => { /* handled in save */ }}
            onClear={() => setHasDrawing(false)}
          />
        </div>

        <p className="text-xs text-academic-subtle text-center">
          Draw, sketch, or write on the canvas above. Click <strong className="text-ink-400">Save &amp; Analyse</strong> to have Gemini transcribe and summarise your notes.
        </p>
      </div>
      </div>
    </div>
  );
}
