"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface ExpenseDetail {
  id: string;
  description: string;
  paidAmount: number;
  owedAmount: number;
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

export default function UserSettlementDetailsPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [userData, setUserData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");

    if (status === "authenticated" && params?.id) {
      fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
        .then((res) => res.json())
        .then((resData) => {
          if (resData.error) {
            alert(resData.error);
            router.push("/settlements");
          } else {
            const user = resData.balances.find((b: BalanceData) => b.id === params.id);
            if (user) {
              setUserData(user);
            } else {
              router.push("/settlements");
            }
          }
        })
        .catch((e) => console.error(e))
        .finally(() => setLoading(false));
    }
  }, [status, router, params]);

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

  if (!userData) return null;

  return (
    <div className="page-container pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 animate-fade-in">
        <Link
          href="/settlements"
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-400 transition-colors"
        >
          ←
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-surface-100">{userData.name}</h1>
          <p className="text-surface-400 text-sm mt-1">Chi tiết các khoản chi tiêu liên quan</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8 animate-fade-in">
        <div className="glass-card p-4 text-center border-t-2 border-emerald-500">
          <p className="text-surface-400 text-xs uppercase tracking-wider mb-1">Đã chi trả</p>
          <p className="text-xl font-bold text-emerald-400">{fmt(userData.paidAmount)}</p>
        </div>
        <div className="glass-card p-4 text-center border-t-2 border-red-500">
          <p className="text-surface-400 text-xs uppercase tracking-wider mb-1">Phần nợ phải chịu</p>
          <p className="text-xl font-bold text-red-400">{fmt(userData.owedAmount)}</p>
        </div>
      </div>

      <div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
        <h2 className="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
          Chi tiết từng khoản
        </h2>
        {userData.expensesInvolved.length === 0 ? (
          <div className="glass-card p-8 text-center bg-surface-800/30">
            <p className="text-sm text-surface-500 italic">Không có chi tiêu nào.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {userData.expensesInvolved.map((exp) => {
               const netAmount = exp.paidAmount - exp.owedAmount;
               return (
                <div key={exp.id} className="glass-card p-4 border-l-4 border-surface-600 hover:border-primary-500 transition-colors">
                  <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-surface-100 font-medium">{exp.description}</p>
                      <p className="text-xs text-surface-500">{new Date(exp.date).toLocaleDateString("vi-VN")}</p>
                    </div>
                    
                    <div className="flex flex-col sm:items-end text-sm gap-1">
                      {exp.paidAmount > 0 && (
                        <p className="text-surface-300">
                          Đã trả: <span className="text-emerald-400 font-semibold">{fmt(exp.paidAmount)}</span>
                        </p>
                      )}
                      {exp.owedAmount > 0 && (
                        <p className="text-surface-300">
                          Phần nợ: <span className="text-red-400 font-semibold">{fmt(exp.owedAmount)}</span>
                        </p>
                      )}
                      <div className="h-px w-full bg-surface-700 my-1" />
                      <p className="text-surface-400 font-medium">
                        Thực tế:{" "}
                        <span className={netAmount > 0 ? "text-emerald-400" : netAmount < 0 ? "text-red-400" : "text-surface-400"}>
                          {netAmount > 0 ? "+" : ""}{fmt(netAmount)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
