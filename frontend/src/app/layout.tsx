import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import Navbar from "@/components/navbar";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "StudyMind — AI Academic Helper",
  description:
    "Your AI-powered academic companion. Manage your schedule, digitise handwritten notes, and get instant study insights.",
  keywords: ["academic helper", "AI notes", "study calendar", "student productivity", "canvas notes"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={lexend.variable}>
      <body className="bg-academic-bg text-academic-text font-body antialiased min-h-screen" suppressHydrationWarning>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}

