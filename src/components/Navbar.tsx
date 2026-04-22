"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    else document.removeEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  if (!session) return null;

  return (
    <nav className="sticky top-0 z-50 bg-surface-950/80 backdrop-blur-xl border-b border-surface-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/expenses"
            className="flex items-center gap-2 group"
          >
            <span className="text-2xl">💸</span>
            <span className="text-xl font-bold gradient-text group-hover:opacity-80 transition-opacity">
              LogMoney
            </span>
          </Link>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-2 rounded-xl hover:bg-surface-800/50 transition-colors"
            >
              <div className="text-right">
                <p className="text-sm font-medium text-surface-200">
                  {session.user.name}
                </p>
                <p className="text-xs text-surface-500">
                  {session.user.role === "admin" ? "Admin" : "User"}
                </p>
              </div>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-surface-900 border border-surface-800 rounded-xl shadow-xl overflow-hidden animate-fade-in">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
