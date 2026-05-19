"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Calendar, FileText, LogOut, User, Menu, X } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/calendar",  label: "Calendar", icon: Calendar },
  { href: "/notes",     label: "Notes",    icon: FileText },
  { href: "/dashboard", label: "Profile",  icon: User },
];

export default function Navbar() {
  const { user, signInWithGoogle, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-academic-border bg-academic-surface/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4" style={{ height: "60px" }}>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group" onClick={() => setOpen(false)}>
          <div className="w-8 h-8 rounded-lg bg-ink-400 flex items-center justify-center shadow-glow-sm group-hover:shadow-glow-md transition-shadow">
            <BookOpen size={15} className="text-white" />
          </div>
          <span className="font-display font-semibold text-lg text-academic-text tracking-tight">
            Study<span className="text-ink-400">Mind</span>
          </span>
        </Link>

        {/* Desktop nav */}
        {user && (
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  pathname === href
                    ? "bg-ink-400/15 text-ink-400"
                    : "text-academic-subtle hover:text-academic-text hover:bg-academic-card"
                )}
              >
                <Icon size={14} />
                {label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <button
                onClick={logout}
                className="hidden md:flex p-2 text-academic-subtle hover:text-academic-text hover:bg-academic-card rounded-lg transition-all"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
              {/* Mobile hamburger */}
              <button
                onClick={() => setOpen(o => !o)}
                className="md:hidden p-2 text-academic-subtle hover:text-academic-text hover:bg-academic-card rounded-lg transition-all"
                aria-label="Toggle menu"
              >
                {open ? <X size={20} /> : <Menu size={20} />}
              </button>
            </>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-2 px-4 py-2 bg-ink-400 hover:bg-ink-300 text-white text-sm font-semibold rounded-lg transition-all shadow-glow-sm hover:shadow-glow-md"
            >
              Sign in
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown */}
      {user && open && (
        <div className="md:hidden border-t border-academic-border bg-academic-surface/95 backdrop-blur-xl">
          <nav className="flex flex-col px-4 py-3 gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all",
                  pathname === href
                    ? "bg-ink-400/15 text-ink-400"
                    : "text-academic-subtle hover:text-academic-text hover:bg-academic-card"
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
            <div className="border-t border-academic-border/50 mt-1 pt-2">
              <div className="flex items-center gap-3 px-3 py-2 mb-1">
                {user.photoURL
                  ? <img src={user.photoURL} alt="avatar" className="w-7 h-7 rounded-full" />
                  : <User size={16} className="text-academic-subtle" />
                }
                <div className="min-w-0">
                  <p className="text-xs font-medium text-academic-text truncate">{user.displayName}</p>
                  <p className="text-[10px] text-academic-subtle truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => { logout(); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
