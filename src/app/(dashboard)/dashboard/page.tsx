"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface GroupData {
  _id: string;
  name: string;
  members: { _id: string; name: string }[];
}

interface ExpenseData {
  _id: string;
  description: string;
  amount: number;
  date: string;
  paidBy: { name: string };
  group: { name: string };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<ExpenseData[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [groupsRes, expensesRes] = await Promise.all([
        fetch("/api/groups"),
        fetch("/api/expenses"),
      ]);
      const groupsData = await groupsRes.json();
      const expensesData = await expensesRes.json();

      setGroups(Array.isArray(groupsData) ? groupsData : []);
      const expenses = Array.isArray(expensesData) ? expensesData : [];
      setRecentExpenses(expenses.slice(0, 5));
      setTotalExpenses(
        expenses.reduce((sum: number, e: ExpenseData) => sum + e.amount, 0)
      );
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchData();
    }
  }, [status, router, fetchData]);

  if (status === "loading" || loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
            <p className="text-surface-400">Đang tải...</p>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const stats = [
    {
      label: "Tổng chi tiêu",
      value: formatCurrency(totalExpenses),
      icon: "💰",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Số nhóm",
      value: groups.length,
      icon: "👥",
      color: "from-violet-500 to-purple-500",
      bgColor: "bg-violet-500/10",
    },
    {
      label: "Giao dịch gần đây",
      value: recentExpenses.length,
      icon: "📝",
      color: "from-emerald-500 to-green-500",
      bgColor: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="page-container">
      {/* Welcome Section */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-surface-100">
          Xin chào,{" "}
          <span className="gradient-text">{session?.user?.name}</span>! 👋
        </h1>
        <p className="text-surface-400 mt-2">
          Đây là tổng quan tài chính của bạn hôm nay
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="glass-card p-6 animate-fade-in"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-surface-400 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-surface-100 mt-1">
                  {stat.value}
                </p>
              </div>
              <div
                className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center text-2xl`}
              >
                {stat.icon}
              </div>
            </div>
            <div className={`h-1 bg-gradient-to-r ${stat.color} rounded-full mt-4 opacity-60`} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Expenses */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-surface-100">
              💰 Chi tiêu gần đây
            </h2>
            <Link href="/expenses" className="text-primary-400 text-sm hover:text-primary-300 transition-colors">
              Xem tất cả →
            </Link>
          </div>

          {recentExpenses.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl">📭</span>
              <p className="text-surface-400 mt-3">Chưa có chi tiêu nào</p>
              <Link href="/expenses" className="btn-primary mt-4 inline-block text-sm">
                Thêm chi tiêu
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentExpenses.map((expense) => (
                <div
                  key={expense._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-800/40 hover:bg-surface-800/60 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-surface-200 text-sm font-medium truncate">
                      {expense.description}
                    </p>
                    <p className="text-surface-500 text-xs mt-0.5">
                      {expense.paidBy?.name} •{" "}
                      {expense.group?.name} •{" "}
                      {new Date(expense.date).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <span className="text-red-400 font-semibold text-sm ml-3">
                    -{formatCurrency(expense.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Groups */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "400ms" }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-surface-100">
              👥 Nhóm của bạn
            </h2>
            <Link href="/groups" className="text-primary-400 text-sm hover:text-primary-300 transition-colors">
              Xem tất cả →
            </Link>
          </div>

          {groups.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl">🏘️</span>
              <p className="text-surface-400 mt-3">Chưa có nhóm nào</p>
              <Link href="/groups" className="btn-primary mt-4 inline-block text-sm">
                Tạo nhóm mới
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => (
                <Link
                  key={group._id}
                  href={`/groups/${group._id}`}
                  className="block p-3 rounded-xl bg-surface-800/40 hover:bg-surface-800/60 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-surface-200 font-medium">
                        {group.name}
                      </p>
                      <p className="text-surface-500 text-xs mt-0.5">
                        {group.members?.length || 0} thành viên
                      </p>
                    </div>
                    <span className="text-surface-600">→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 glass-card p-6 animate-fade-in" style={{ animationDelay: "500ms" }}>
        <h2 className="text-lg font-semibold text-surface-100 mb-4">
          ⚡ Thao tác nhanh
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/groups"
            className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 transition-all text-center"
          >
            <span className="text-2xl">👥</span>
            <p className="text-surface-200 font-medium mt-2 text-sm">Tạo nhóm mới</p>
          </Link>
          <Link
            href="/expenses"
            className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all text-center"
          >
            <span className="text-2xl">➕</span>
            <p className="text-surface-200 font-medium mt-2 text-sm">Thêm chi tiêu</p>
          </Link>
          <Link
            href="/settlements"
            className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-center"
          >
            <span className="text-2xl">🔄</span>
            <p className="text-surface-200 font-medium mt-2 text-sm">Chia tiền</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
