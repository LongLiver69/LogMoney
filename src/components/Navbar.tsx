"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!session) return null;

  const navLinks = [
    { href: "/dashboard", label: "Tổng quan", icon: "📊" },
    { href: "/groups", label: "Nhóm", icon: "👥" },
    { href: "/expenses", label: "Chi tiêu", icon: "💰" },
    { href: "/settlements", label: "Chia tiền", icon: "🔄" },
  ];

  if (session.user.role === "admin") {
    navLinks.push({ href: "/admin/users", label: "Quản lý User", icon: "⚙️" });
  }

  return (
    <nav className="sticky top-0 z-50 bg-surface-950/80 backdrop-blur-xl border-b border-surface-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 group"
          >
            <span className="text-2xl">💸</span>
            <span className="text-xl font-bold gradient-text group-hover:opacity-80 transition-opacity">
              LogMoney
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  pathname.startsWith(link.href)
                    ? "bg-primary-600/20 text-primary-400 border border-primary-500/30"
                    : "text-surface-400 hover:text-surface-200 hover:bg-surface-800/50"
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-surface-200">
                {session.user.name}
              </p>
              <p className="text-xs text-surface-500">
                {session.user.role === "admin" ? "Admin" : "User"}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="px-4 py-2 text-sm text-surface-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-300"
            >
              Đăng xuất
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-surface-400 hover:text-surface-200 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface-900/95 backdrop-blur-xl border-t border-surface-800/50 animate-fade-in">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  pathname.startsWith(link.href)
                    ? "bg-primary-600/20 text-primary-400"
                    : "text-surface-400 hover:bg-surface-800/50"
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
            <div className="border-t border-surface-800 pt-2 mt-2">
              <div className="px-4 py-2">
                <p className="text-sm font-medium text-surface-200">
                  {session.user.name}
                </p>
                <p className="text-xs text-surface-500">
                  {session.user.role === "admin" ? "Admin" : "User"}
                </p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
