"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

interface UserData {
  _id: string;
  name: string;
  username: string;
}

interface GroupData {
  _id: string;
  name: string;
  description: string;
  members: UserData[];
  createdBy: UserData;
  createdAt: string;
}

export default function GroupsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupData | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", members: [] as string[] });
  const [submitting, setSubmitting] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/groups");
      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const fetchUsers = useCallback(async () => {
    if (session?.user?.role === "admin") {
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        setAllUsers(Array.isArray(data) ? data.filter((u: UserData & { approved?: boolean }) => u.approved !== false) : []);
      } catch (e) { console.error(e); }
    }
  }, [session?.user?.role]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated") { fetchGroups(); fetchUsers(); }
  }, [status, router, fetchGroups, fetchUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingGroup ? `/api/groups/${editingGroup._id}` : "/api/groups";
      const method = editingGroup ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      if (res.ok) { setShowForm(false); setEditingGroup(null); setFormData({ name: "", description: "", members: [] }); fetchGroups(); }
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa nhóm này?")) return;
    try { const res = await fetch(`/api/groups/${id}`, { method: "DELETE" }); if (res.ok) fetchGroups(); }
    catch (e) { console.error(e); }
  };

  const startEdit = (group: GroupData) => {
    setEditingGroup(group);
    setFormData({ name: group.name, description: group.description, members: group.members.map((m) => m._id) });
    setShowForm(true);
  };

  const toggleMember = (userId: string) => {
    setFormData((prev) => ({
      ...prev,
      members: prev.members.includes(userId) ? prev.members.filter((id) => id !== userId) : [...prev.members, userId],
    }));
  };

  if (status === "loading" || loading) {
    return (<div className="page-container"><div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></div></div>);
  }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-surface-100">👥 Nhóm</h1>
          <p className="text-surface-400 mt-1">Quản lý các nhóm chi tiêu</p>
        </div>
        <button onClick={() => { setEditingGroup(null); setFormData({ name: "", description: "", members: [] }); setShowForm(true); }} className="btn-primary">+ Tạo nhóm</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-surface-100 mb-6">{editingGroup ? "✏️ Sửa nhóm" : "➕ Tạo nhóm mới"}</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label-text">Tên nhóm</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="Ví dụ: Nhóm bạn bè" required />
              </div>
              <div>
                <label className="label-text">Mô tả</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field resize-none h-20" placeholder="Mô tả nhóm (tùy chọn)" />
              </div>
              {allUsers.length > 0 && (
                <div>
                  <label className="label-text">Thành viên</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto p-2 bg-surface-800/50 rounded-xl">
                    {allUsers.map((user) => (
                      <label key={user._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-700/50 cursor-pointer transition-colors">
                        <input type="checkbox" checked={formData.members.includes(user._id)} onChange={() => toggleMember(user._id)} className="w-4 h-4 rounded accent-primary-500" />
                        <div><p className="text-surface-200 text-sm">{user.name}</p><p className="text-surface-500 text-xs">@{user.username}</p></div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="btn-primary flex-1">{submitting ? "Đang xử lý..." : editingGroup ? "Cập nhật" : "Tạo nhóm"}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditingGroup(null); }} className="btn-secondary">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="glass-card p-12 text-center animate-fade-in">
          <span className="text-6xl">🏘️</span>
          <h3 className="text-xl font-semibold text-surface-200 mt-4">Chưa có nhóm nào</h3>
          <p className="text-surface-400 mt-2">Tạo nhóm đầu tiên để bắt đầu quản lý chi tiêu</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group, i) => (
            <div key={group._id} className="glass-card-hover p-6 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-surface-100">{group.name}</h3>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(group)} className="p-1.5 text-surface-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-all" title="Sửa">✏️</button>
                  <button onClick={() => handleDelete(group._id)} className="p-1.5 text-surface-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Xóa">🗑️</button>
                </div>
              </div>
              {group.description && <p className="text-surface-400 text-sm mb-4 line-clamp-2">{group.description}</p>}
              <div className="flex flex-wrap gap-1 mb-4">
                {group.members?.slice(0, 4).map((m) => (<span key={m._id} className="badge-info text-xs">{m.name}</span>))}
                {(group.members?.length || 0) > 4 && <span className="badge text-xs bg-surface-700 text-surface-400">+{group.members.length - 4}</span>}
              </div>
              <div className="flex items-center justify-between text-xs text-surface-500">
                <span>{group.members?.length || 0} thành viên</span>
                <span>{new Date(group.createdAt).toLocaleDateString("vi-VN")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
