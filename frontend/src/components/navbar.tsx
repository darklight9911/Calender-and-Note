"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Calendar, FileText, LogOut, User } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/notes",    label: "Notes",    icon: FileText },
];

export default function Navbar() {
  const { user, signInWithGoogle, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-academic-border bg-academic-surface/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between gap-4" style={{ height: "60px" }}>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-ink-400 flex items-center justify-center shadow-glow-sm group-hover:shadow-glow-md transition-shadow">
            <BookOpen size={15} className="text-white" />
          </div>
          <span className="font-display font-semibold text-lg text-academic-text hidden sm:block tracking-tight">
            Study<span className="text-ink-400">Mind</span>
          </span>
        </Link>

        {/* Nav links */}
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

        {/* Auth */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className={cn(
                  "hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  pathname === "/dashboard"
                    ? "bg-ink-400/15 text-ink-400"
                    : "text-academic-subtle hover:text-academic-text hover:bg-academic-card"
                )}
              >
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photoURL} alt="avatar" className="w-5 h-5 rounded-full" />
                ) : (
                  <User size={14} />
                )}
                <span className="max-w-[100px] truncate">{user.displayName?.split(" ")[0] ?? "Profile"}</span>
              </Link>
              <button
                onClick={logout}
                className="p-2 text-academic-subtle hover:text-academic-text hover:bg-academic-card rounded-lg transition-all"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-2 px-4 py-2 bg-ink-400 hover:bg-ink-300 text-white text-sm font-semibold rounded-lg transition-all shadow-glow-sm hover:shadow-glow-md"
            >
              Sign in with Google
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
