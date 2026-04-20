"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

interface UserData { _id: string; name: string; username: string; }
interface GroupData { _id: string; name: string; members: UserData[]; }
interface ExpenseData {
  _id: string; description: string; amount: number; date: string;
  paidBy: UserData; splitAmong: UserData[];
  splitType: "equal" | "custom"; splitDetails: { user: UserData; amount: number }[];
  group: { _id: string; name: string }; createdBy: UserData;
}

export default function ExpensesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseData | null>(null);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [formData, setFormData] = useState({
    description: "", amount: "", date: new Date().toISOString().split("T")[0],
    paidBy: "", splitAmong: [] as string[], splitType: "equal" as "equal" | "custom",
    splitDetails: [] as { user: string; amount: number }[], group: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchExpenses = useCallback(async () => {
    try {
      const url = selectedGroup ? `/api/expenses?groupId=${selectedGroup}` : "/api/expenses";
      const res = await fetch(url);
      const data = await res.json();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [selectedGroup]);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/groups");
      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated") { fetchGroups(); fetchExpenses(); }
  }, [status, router, fetchGroups, fetchExpenses]);

  const selectedGroupData = groups.find((g) => g._id === formData.group);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingExpense ? `/api/expenses/${editingExpense._id}` : "/api/expenses";
      const method = editingExpense ? "PUT" : "POST";
      const body = { ...formData, amount: parseFloat(formData.amount) };
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) { setShowForm(false); setEditingExpense(null); resetForm(); fetchExpenses(); }
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa chi tiêu này?")) return;
    try { const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" }); if (res.ok) fetchExpenses(); }
    catch (e) { console.error(e); }
  };

  const resetForm = () => {
    setFormData({ description: "", amount: "", date: new Date().toISOString().split("T")[0], paidBy: "", splitAmong: [], splitType: "equal", splitDetails: [], group: "" });
  };

  const startEdit = (expense: ExpenseData) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description, amount: expense.amount.toString(),
      date: new Date(expense.date).toISOString().split("T")[0],
      paidBy: expense.paidBy._id, splitAmong: expense.splitAmong.map((u) => u._id),
      splitType: expense.splitType, splitDetails: expense.splitDetails.map((d) => ({ user: d.user._id, amount: d.amount })),
      group: expense.group._id,
    });
    setShowForm(true);
  };

  const toggleSplitUser = (userId: string) => {
    setFormData((prev) => {
      const newSplitAmong = prev.splitAmong.includes(userId) ? prev.splitAmong.filter((id) => id !== userId) : [...prev.splitAmong, userId];
      return { ...prev, splitAmong: newSplitAmong };
    });
  };

  const updateCustomAmount = (userId: string, amount: number) => {
    setFormData((prev) => {
      const newDetails = prev.splitDetails.filter((d) => d.user !== userId);
      newDetails.push({ user: userId, amount });
      return { ...prev, splitDetails: newDetails };
    });
  };

  const fmt = (amount: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  if (status === "loading" || loading) {
    return (<div className="page-container"><div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></div></div>);
  }

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-surface-100">💰 Chi tiêu</h1>
          <p className="text-surface-400 mt-1">Quản lý thu chi của bạn</p>
        </div>
        <div className="flex gap-3">
          <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="input-field w-auto">
            <option value="">Tất cả nhóm</option>
            {groups.map((g) => (<option key={g._id} value={g._id}>{g.name}</option>))}
          </select>
          <button onClick={() => { setEditingExpense(null); resetForm(); setShowForm(true); }} className="btn-primary whitespace-nowrap">+ Thêm</button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-surface-100 mb-6">{editingExpense ? "✏️ Sửa chi tiêu" : "➕ Thêm chi tiêu"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-text">Nhóm</label>
                <select value={formData.group} onChange={(e) => setFormData({ ...formData, group: e.target.value, paidBy: "", splitAmong: [] })} className="input-field" required>
                  <option value="">Chọn nhóm</option>
                  {groups.map((g) => (<option key={g._id} value={g._id}>{g.name}</option>))}
                </select>
              </div>
              <div>
                <label className="label-text">Mô tả</label>
                <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field" placeholder="Ăn trưa, mua sắm..." required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-text">Số tiền (VND)</label>
                  <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="input-field" placeholder="0" min="0" required />
                </div>
                <div>
                  <label className="label-text">Ngày</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="input-field" required />
                </div>
              </div>
              {selectedGroupData && (
                <>
                  <div>
                    <label className="label-text">Người trả</label>
                    <select value={formData.paidBy} onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })} className="input-field" required>
                      <option value="">Chọn người trả</option>
                      {selectedGroupData.members.map((m) => (<option key={m._id} value={m._id}>{m.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="label-text">Chia cho</label>
                    <div className="space-y-2 p-2 bg-surface-800/50 rounded-xl max-h-32 overflow-y-auto">
                      {selectedGroupData.members.map((m) => (
                        <label key={m._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-700/50 cursor-pointer transition-colors">
                          <input type="checkbox" checked={formData.splitAmong.includes(m._id)} onChange={() => toggleSplitUser(m._id)} className="w-4 h-4 rounded accent-primary-500" />
                          <span className="text-surface-200 text-sm flex-1">{m.name}</span>
                          {formData.splitType === "custom" && formData.splitAmong.includes(m._id) && (
                            <input type="number" value={formData.splitDetails.find((d) => d.user === m._id)?.amount || ""} onChange={(e) => updateCustomAmount(m._id, parseFloat(e.target.value) || 0)} className="input-field w-28 text-sm py-1" placeholder="Số tiền" />
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label-text">Cách chia</label>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setFormData({ ...formData, splitType: "equal" })} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${formData.splitType === "equal" ? "bg-primary-600/20 text-primary-400 border border-primary-500/30" : "bg-surface-800 text-surface-400 border border-surface-700"}`}>Chia đều</button>
                      <button type="button" onClick={() => setFormData({ ...formData, splitType: "custom" })} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${formData.splitType === "custom" ? "bg-primary-600/20 text-primary-400 border border-primary-500/30" : "bg-surface-800 text-surface-400 border border-surface-700"}`}>Tùy chỉnh</button>
                    </div>
                  </div>
                </>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="btn-primary flex-1">{submitting ? "Đang xử lý..." : editingExpense ? "Cập nhật" : "Thêm"}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditingExpense(null); }} className="btn-secondary">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {expenses.length === 0 ? (
        <div className="glass-card p-12 text-center animate-fade-in">
          <span className="text-6xl">📭</span>
          <h3 className="text-xl font-semibold text-surface-200 mt-4">Chưa có chi tiêu nào</h3>
          <p className="text-surface-400 mt-2">Thêm chi tiêu đầu tiên</p>
        </div>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense, i) => (
            <div key={expense._id} className="glass-card-hover p-5 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-surface-100 font-medium truncate">{expense.description}</h3>
                    <span className="badge-info text-xs">{expense.group?.name}</span>
                  </div>
                  <p className="text-surface-500 text-sm">
                    💳 {expense.paidBy?.name} trả • 📅 {new Date(expense.date).toLocaleDateString("vi-VN")}
                    {expense.splitType === "equal" ? " • Chia đều" : " • Tùy chỉnh"}
                    {expense.splitAmong?.length > 0 && ` cho ${expense.splitAmong.length} người`}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="text-xl font-bold text-red-400">{fmt(expense.amount)}</span>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(expense)} className="p-1.5 text-surface-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-all">✏️</button>
                    {(session?.user?.role === "admin" || expense.createdBy?._id === session?.user?.id) && (
                      <button onClick={() => handleDelete(expense._id)} className="p-1.5 text-surface-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">🗑️</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
