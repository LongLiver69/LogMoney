"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface UserData { _id: string; name: string; username: string; }
interface GroupData { _id: string; name: string; members: UserData[]; description?: string; createdBy: UserData; }

export default function GroupsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupData | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", members: [] as string[] });
  const [submitting, setSubmitting] = useState(false);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupData | null>(null);
  const [groupMembersToAdd, setGroupMembersToAdd] = useState<string[]>([]);
  const [groupMembersToRemove, setGroupMembersToRemove] = useState<string[]>([]);
  const [updatingGroup, setUpdatingGroup] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/groups");
      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setAllUsers(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated") { fetchGroups(); fetchUsers(); }
  }, [status, router, fetchGroups, fetchUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      const url = editingGroup ? `/api/groups/${editingGroup._id}` : "/api/groups";
      const method = editingGroup ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      if (res.ok) {
        setShowForm(false);
        setEditingGroup(null);
        setFormData({ name: "", description: "", members: [] });
        fetchGroups();
      }
    } catch (e) { console.error(e); }
    finally { setLoadingAction(false); }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Bạn có chắc muốn xóa nhóm này?")) return;
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
      if (res.ok) fetchGroups();
    } catch (e) { console.error(e); }
    finally { setLoadingAction(false); }
  };

  const handleAddMembers = async () => {
    if (!selectedGroup || groupMembersToAdd.length === 0) return;
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/groups/${selectedGroup._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addMembers", membersToAdd: groupMembersToAdd }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedGroup(updated);
        setGroupMembersToAdd([]);
        fetchGroups();
      }
    } catch (e) { console.error(e); }
    finally { setLoadingAction(false); }
  };

  const handleRemoveMembers = async () => {
    if (!selectedGroup || groupMembersToRemove.length === 0) return;
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/groups/${selectedGroup._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "removeMembers", membersToRemove: groupMembersToRemove }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedGroup(updated);
        setGroupMembersToRemove([]);
        fetchGroups();
      }
    } catch (e) { console.error(e); }
    finally { setLoadingAction(false); }
  };

  const openGroupDetails = (group: GroupData) => {
    setSelectedGroup(group);
    setGroupMembersToAdd([]);
    setGroupMembersToRemove([]);
  };

  const canEditGroup = (group: GroupData) => {
    return session?.user?.role === "admin" || group.createdBy?._id === session?.user?.id;
  };

  if (status === "loading" || loading) {
    return (<div className="page-container"><div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></div></div>);
  }

  return (
    <div className="page-container">
      {/* Loading overlay for actions */}
      {loadingAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 p-8 glass-card">
            <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
            <p className="text-surface-200 font-medium">Đang xử lý...</p>
          </div>
        </div>
      )}

      <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 mb-8 animate-fade-in">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-3xl font-bold text-surface-100 truncate">👥 Quản lý Nhóm</h1>
        </div>
        <div className="flex gap-1 sm:gap-2 shrink-0">
          <Link href="/expenses" className="btn-secondary whitespace-nowrap px-2 sm:px-3 text-sm sm:text-base bg-surface-800 hover:bg-surface-700">
            ← Chi tiêu
          </Link>
          {session?.user?.role === "admin" && (
            <button onClick={() => { setEditingGroup(null); setFormData({ name: "", description: "", members: session?.user?.id ? [session.user.id] : [] }); setShowForm(true); }} className="btn-primary whitespace-nowrap px-2 sm:px-4 text-sm sm:text-base">
              + Tạo nhóm
            </button>
          )}
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="glass-card p-12 text-center animate-fade-in">
          <span className="text-6xl">👥</span>
          <h3 className="text-xl font-semibold text-surface-200 mt-4">Chưa có nhóm nào</h3>
          <p className="text-surface-400 mt-2">Tạo nhóm để quản lý chi tiêu cùng bạn bè</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group, i) => (
            <div key={group._id} className="glass-card-hover p-5 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-surface-100 font-semibold text-lg">{group.name}</h3>
                  {group.description && <p className="text-surface-500 text-sm mt-1">{group.description}</p>}
                </div>
                <span className="badge-info text-xs">{group.members.length} thành viên</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-4">
                {group.members.slice(0, 5).map((m) => (
                  <span key={m._id} className="text-xs bg-surface-800 text-surface-300 px-2 py-1 rounded-full">
                    {m.name}
                  </span>
                ))}
                {group.members.length > 5 && (
                  <span className="text-xs bg-surface-800 text-surface-400 px-2 py-1 rounded-full">+{group.members.length - 5}</span>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openGroupDetails(group)} className="btn-secondary flex-1 py-2 text-sm">Xem chi tiết</button>
                {session?.user?.role === "admin" && (
                  <>
                    <button onClick={() => { setEditingGroup(group); setFormData({ name: group.name, description: group.description || "", members: group.members.map(m => m._id) }); setShowForm(true); }} className="p-2 text-surface-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-all">✏️</button>
                    <button onClick={() => handleDeleteGroup(group._id)} className="p-2 text-surface-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">🗑️</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Group Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-surface-400 hover:text-surface-200 text-2xl">×</button>
            <h2 className="text-xl font-semibold text-surface-100 mb-6">{editingGroup ? "✏️ Sửa nhóm" : "➕ Tạo nhóm mới"}</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label-text">Tên nhóm</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="Ví dụ: Nhóm bạn bè, Gia đình..." required />
              </div>
              <div>
                <label className="label-text">Mô tả</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field" placeholder="Mô tả nhóm (tùy chọn)" rows={2} />
              </div>
              {allUsers.length > 0 && (
                <div>
                  <label className="label-text">Thành viên</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto p-2 bg-surface-800/50 rounded-xl border border-surface-700/50">
                    {allUsers.map((user) => (
                      <label key={user._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-700/50 cursor-pointer transition-colors">
                        <input type="checkbox" checked={formData.members.includes(user._id)} onChange={() => setFormData(prev => ({ ...prev, members: prev.members.includes(user._id) ? prev.members.filter(id => id !== user._id) : [...prev.members, user._id] }))} className="w-5 h-5 rounded accent-primary-500" />
                        <div><p className="text-surface-200 text-sm font-medium">{user.name}</p></div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1 py-3 text-base shadow-lg">{loadingAction ? "Đang xử lý..." : editingGroup ? "Cập nhật" : "Tạo nhóm"}</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary py-3 text-base">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Group Details Modal */}
      {selectedGroup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
            <button onClick={() => setSelectedGroup(null)} className="absolute top-4 right-4 text-surface-400 hover:text-surface-200 text-2xl">×</button>
            <h2 className="text-xl font-semibold text-surface-100 mb-2">👥 {selectedGroup.name}</h2>
            {selectedGroup.description && <p className="text-surface-400 text-sm mb-4">{selectedGroup.description}</p>}
            
            <div className="mb-6">
              <h3 className="text-surface-200 font-medium mb-3">Danh sách thành viên ({selectedGroup.members.length})</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto p-2 bg-surface-800/50 rounded-xl border border-surface-700/50">
                {selectedGroup.members.map((member) => (
                  <div key={member._id} className="flex items-center justify-between p-2 rounded-lg bg-surface-800/50">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 text-sm font-medium">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className="text-surface-200 text-sm font-medium">{member.name}</p>
                        <p className="text-surface-500 text-xs">@{member.username}</p>
                      </div>
                    </div>
                    {member._id === selectedGroup.createdBy?._id && (
                      <span className="text-xs bg-primary-600/20 text-primary-400 px-2 py-1 rounded-full">Creator</span>
                    )}
                  </div>
                ))}
              </div>
            </div>


          </div>
        </div>
      )}
    </div>
  );
}