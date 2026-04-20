"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

interface GroupData { _id: string; name: string; }
interface BalanceData { id: string; name: string; username: string; balance: number; }
interface SettlementData { from: { id: string; name: string }; to: { id: string; name: string }; amount: number; }
interface SettlementResult { balances: BalanceData[]; settlements: SettlementData[]; totalExpenses: number; expenseCount: number; }

export default function SettlementsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [result, setResult] = useState<SettlementResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/groups");
      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setPageLoading(false); }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated") fetchGroups();
  }, [status, router, fetchGroups]);

  const calculateSettlement = async () => {
    if (!selectedGroup) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: selectedGroup }),
      });
      const data = await res.json();
      if (res.ok) setResult(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fmt = (amount: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  if (status === "loading" || pageLoading) {
    return (<div className="page-container"><div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></div></div>);
  }

  return (
    <div className="page-container">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-surface-100">🔄 Chia tiền</h1>
        <p className="text-surface-400 mt-1">Tính toán ai phải trả cho ai</p>
      </div>

      <div className="glass-card p-6 mb-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row gap-4">
          <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="input-field flex-1">
            <option value="">Chọn nhóm</option>
            {groups.map((g) => (<option key={g._id} value={g._id}>{g.name}</option>))}
          </select>
          <button onClick={calculateSettlement} disabled={!selectedGroup || loading} className="btn-primary">
            {loading ? "Đang tính..." : "Tính toán"}
          </button>
        </div>
      </div>

      {result && (
        <div className="space-y-6 animate-fade-in">
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card p-5">
              <p className="text-surface-400 text-sm">Tổng chi tiêu</p>
              <p className="text-2xl font-bold gradient-text mt-1">{fmt(result.totalExpenses)}</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-surface-400 text-sm">Số giao dịch</p>
              <p className="text-2xl font-bold text-surface-100 mt-1">{result.expenseCount}</p>
            </div>
          </div>

          {/* Balances */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-surface-100 mb-4">📊 Số dư từng người</h2>
            <div className="space-y-3">
              {result.balances.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-800/40">
                  <span className="text-surface-200 font-medium">{b.name}</span>
                  <span className={`font-semibold ${b.balance > 0 ? "text-emerald-400" : b.balance < 0 ? "text-red-400" : "text-surface-400"}`}>
                    {b.balance > 0 ? "+" : ""}{fmt(b.balance)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Settlements */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-surface-100 mb-4">💸 Cần thanh toán</h2>
            {result.settlements.length === 0 ? (
              <div className="text-center py-6">
                <span className="text-4xl">✅</span>
                <p className="text-surface-400 mt-2">Tất cả đã cân bằng!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {result.settlements.map((s, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-red-500/5 to-emerald-500/5 border border-surface-700/50">
                    <div className="flex-1 text-right">
                      <p className="text-red-400 font-medium">{s.from.name}</p>
                      <p className="text-surface-500 text-xs">trả</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-xl font-bold text-amber-400">{fmt(s.amount)}</span>
                      <span className="text-surface-600">→</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-emerald-400 font-medium">{s.to.name}</p>
                      <p className="text-surface-500 text-xs">nhận</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
