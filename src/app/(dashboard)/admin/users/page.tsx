"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

interface UserData { _id: string; name: string; username: string; password: string; role: string; approved: boolean; createdAt: string; }

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated") {
      if (session?.user?.role !== "admin") { router.push("/dashboard"); return; }
      fetchUsers();
    }
  }, [status, router, session, fetchUsers]);

  const handleApprove = async (userId: string, approved: boolean) => {
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, approved }),
      });
      if (res.ok) fetchUsers();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Bạn có chắc muốn xóa user này?")) return;
    try {
      const res = await fetch(`/api/users?userId=${userId}`, { method: "DELETE" });
      if (res.ok) fetchUsers();
    } catch (e) { console.error(e); }
  };

  if (status === "loading" || loading) {
    return (<div className="page-container"><div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></div></div>);
  }

  return (
    <div className="page-container">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-surface-100">⚙️ Quản lý User</h1>
        <p className="text-surface-400 mt-1">Phê duyệt và quản lý tài khoản người dùng</p>
      </div>

      <div className="glass-card overflow-hidden animate-fade-in">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-700/50">
                <th className="text-left p-4 text-surface-400 text-sm font-medium">Tên</th>
                <th className="text-left p-4 text-surface-400 text-sm font-medium">Username</th>
                <th className="text-left p-4 text-surface-400 text-sm font-medium">Mật khẩu</th>
                <th className="text-left p-4 text-surface-400 text-sm font-medium">Vai trò</th>
                <th className="text-left p-4 text-surface-400 text-sm font-medium">Trạng thái</th>
                <th className="text-left p-4 text-surface-400 text-sm font-medium">Ngày tạo</th>
                <th className="text-right p-4 text-surface-400 text-sm font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b border-surface-800/50 hover:bg-surface-800/30 transition-colors">
                  <td className="p-4 text-surface-200 font-medium">{user.name}</td>
                  <td className="p-4 text-surface-400 text-sm">{user.username}</td>
                  <td className="p-4 text-surface-400 text-sm font-mono">{user.password}</td>
                  <td className="p-4"><span className={user.role === "admin" ? "badge-warning" : "badge-info"}>{user.role}</span></td>
                  <td className="p-4"><span className={user.approved ? "badge-success" : "badge-danger"}>{user.approved ? "Đã duyệt" : "Chờ duyệt"}</span></td>
                  <td className="p-4 text-surface-500 text-sm">{new Date(user.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!user.approved && (<button onClick={() => handleApprove(user._id, true)} className="btn-success text-xs px-3 py-1.5">Duyệt</button>)}
                      {user.approved && user.role !== "admin" && (<button onClick={() => handleApprove(user._id, false)} className="btn-secondary text-xs px-3 py-1.5">Thu hồi</button>)}
                      {user.role !== "admin" && (<button onClick={() => handleDelete(user._id)} className="btn-danger text-xs px-3 py-1.5">Xóa</button>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-surface-800/50">
          {users.map((user) => (
            <div key={user._id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-surface-200 font-medium">{user.name}</p>
                  <p className="text-surface-500 text-sm">@{user.username}</p>
                  <p className="text-surface-600 text-xs font-mono">🔑 {user.password}</p>
                </div>
                <div className="flex gap-2">
                  <span className={user.role === "admin" ? "badge-warning" : "badge-info"}>{user.role}</span>
                  <span className={user.approved ? "badge-success" : "badge-danger"}>{user.approved ? "Đã duyệt" : "Chờ duyệt"}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {!user.approved && (<button onClick={() => handleApprove(user._id, true)} className="btn-success text-xs px-3 py-1.5">Duyệt</button>)}
                {user.approved && user.role !== "admin" && (<button onClick={() => handleApprove(user._id, false)} className="btn-secondary text-xs px-3 py-1.5">Thu hồi</button>)}
                {user.role !== "admin" && (<button onClick={() => handleDelete(user._id)} className="btn-danger text-xs px-3 py-1.5">Xóa</button>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
