"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";

interface ExpenseDetail {
  description: string;
  amount: number;
  type: "paid" | "owed";
  date: string;
}

interface BalanceData {
  id: string;
  name: string;
  username: string;
  balance: number;
  paidAmount: number;
  owedAmount: number;
  expensesInvolved: ExpenseDetail[];
}

interface SettlementData {
  from: { id: string; name: string };
  to: { id: string; name: string };
  amount: number;
}

interface SettlementResult {
  balances: BalanceData[];
  settlements: SettlementData[];
  totalExpenses: number;
  expenseCount: number;
}

function SettlementsContent() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<SettlementResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");

    if (status === "authenticated") {
      fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
        .then((res) => res.json())
        .then((resData) => {
          if (resData.error) {
            alert(resData.error);
            router.push("/expenses");
          } else {
            setData(resData);
          }
        })
        .catch((e) => console.error(e))
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  const fmt = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  if (loading || status === "loading") {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="page-container pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 animate-fade-in">
        <Link
          href="/expenses"
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-400 transition-colors"
        >
          ←
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-surface-100">🧮 Kết quả chia tiền</h1>
          <p className="text-surface-400 text-sm mt-1">Chi tiết thanh toán cho nhóm</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8 animate-fade-in">
        <div className="glass-card p-4 text-center border-t-2 border-primary-500">
          <p className="text-surface-400 text-xs uppercase tracking-wider mb-1">Tổng chi tiêu</p>
          <p className="text-xl font-bold text-primary-400">{fmt(data.totalExpenses)}</p>
        </div>
        <div className="glass-card p-4 text-center border-t-2 border-surface-600">
          <p className="text-surface-400 text-xs uppercase tracking-wider mb-1">Số giao dịch</p>
          <p className="text-xl font-bold text-surface-200">{data.expenseCount}</p>
        </div>
      </div>

      {/* Settlements (Who pays whom) */}
      <div className="mb-10 animate-fade-in">
        <h2 className="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
          💸 Chốt sổ (Ai trả ai)
        </h2>
        {data.settlements.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <span className="text-4xl">✅</span>
            <p className="text-surface-300 mt-3 font-medium">Tuyệt vời! Không ai nợ ai.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.settlements.map((s, i) => (
              <div
                key={i}
                className="glass-card p-4 flex items-center gap-4 border-l-4 border-emerald-500"
              >
                <div className="flex-1 text-right">
                  <p className="text-red-400 font-bold">{s.from.name}</p>
                  <p className="text-surface-500 text-[10px] uppercase">Cần trả</p>
                </div>
                <div className="flex flex-col items-center px-2 min-w-[100px]">
                  <span className="text-lg font-black text-amber-400">{fmt(s.amount)}</span>
                  <span className="text-surface-600 text-xl leading-none">→</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-emerald-400 font-bold">{s.to.name}</p>
                  <p className="text-surface-500 text-[10px] uppercase">Nhận</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detailed Breakdown Per User */}
      <div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
        <h2 className="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
          📊 Chi tiết từng cá nhân
        </h2>
        <div className="space-y-4">
          {data.balances.map((user) => (
            <div key={user.id} className="glass-card overflow-hidden transition-all duration-300">
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-surface-800/50"
                onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
              >
                <div>
                  <h3 className="font-bold text-surface-100">{user.name}</h3>
                  <div className="flex gap-3 text-xs mt-1">
                    <span className="text-emerald-400">Đã chi: {fmt(user.paidAmount)}</span>
                    <span className="text-red-400">Cần trả: {fmt(user.owedAmount)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-surface-500 uppercase">Số dư</p>
                    <p
                      className={`font-black ${user.balance > 0
                        ? "text-emerald-400"
                        : user.balance < 0
                          ? "text-red-400"
                          : "text-surface-400"
                        }`}
                    >
                      {user.balance > 0 ? "+" : ""}
                      {fmt(user.balance)}
                    </p>
                  </div>
                  <span
                    className={`text-surface-500 transition-transform ${expandedUser === user.id ? "rotate-180" : ""
                      }`}
                  >
                    ▼
                  </span>
                </div>
              </div>

              {/* Expanded details */}
              {expandedUser === user.id && (
                <div className="border-t border-surface-700/50 bg-surface-900/50 p-4">
                  <p className="text-xs font-semibold text-surface-400 uppercase mb-3">
                    Lịch sử chi tiêu liên quan
                  </p>
                  {user.expensesInvolved.length === 0 ? (
                    <p className="text-sm text-surface-500 italic">Không có chi tiêu nào.</p>
                  ) : (
                    <div className="space-y-2">
                      {user.expensesInvolved.map((exp, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center text-sm p-2 rounded bg-surface-800/30"
                        >
                          <div className="flex-1">
                            <p className="text-surface-200">{exp.description}</p>
                            <p className="text-xs text-surface-500">
                              {new Date(exp.date).toLocaleDateString("vi-VN")}
                            </p>
                          </div>
                          <div className="text-right">
                            {exp.type === "paid" ? (
                              <span className="text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded text-xs font-bold">
                                + {fmt(exp.amount)} (Chi trả)
                              </span>
                            ) : (
                              <span className="text-red-400 bg-red-400/10 px-2 py-1 rounded text-xs font-bold">
                                - {fmt(exp.amount)} (Phần nợ)
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SettlementsPage() {
  return (
    <Suspense
      fallback={
        <div className="page-container">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          </div>
        </div>
      }
    >
      <SettlementsContent />
    </Suspense>
  );
}
