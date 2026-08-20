import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Shield,
  UserCheck,
  UserX,
  Plus,
  Lock,
  Mail,
  Key,
  CheckCircle2,
  AlertCircle,
  LogOut,
} from 'lucide-react';
import { User, Role } from '../../types/index.js';
import { api } from '../../services/api.js';

interface AuthManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserSwitched: (user: User) => void;
  onLogout?: () => void;
}

export const AuthManagerModal: React.FC<AuthManagerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserSwitched,
  onLogout,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    full_name: '',
    role_id: 'member',
    password: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [uList, rList] = await Promise.all([
        api.auth.getUsers(),
        api.auth.getRoles(),
      ]);
      setUsers(uList);
      setRoles(rList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadData();
  }, [isOpen]);

  const handleToggleUserActive = async (user: User) => {
    try {
      await api.auth.updateUser(user.id, { is_active: !user.is_active });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleChange = async (userId: string, roleId: string) => {
    try {
      await api.auth.updateUser(userId, { role_id: roleId });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.email) return;
    if (!newUser.password || newUser.password.length < 6) {
      setCreateError('Password is required (minimum 6 characters)');
      return;
    }
    setCreateError(null);
    try {
      await api.auth.createUser(newUser);
      setIsCreating(false);
      setNewUser({ username: '', email: '', full_name: '', role_id: 'member', password: '' });
      await loadData();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create user account');
    }
  };

  const handleSwitchSession = async (userId: string) => {
    try {
      const res = await api.auth.switchUser(userId);
      onUserSwitched(res.user);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-neutral-800 flex items-start justify-between bg-neutral-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-950/80 border border-blue-800 text-blue-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                Multi-User & Role Governance
                <span className="text-xs px-2 py-0.5 rounded font-mono bg-blue-950 text-blue-300 border border-blue-800">
                  core.users & core.roles
                </span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Manage accounts, role assignments, user deactivation, and switch active session.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Active Session Card */}
          <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">
                {currentUser?.full_name?.charAt(0) || currentUser?.username?.charAt(0) || 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-neutral-100">{currentUser?.full_name}</span>
                  <span className="text-xs text-neutral-400 font-mono">@{currentUser?.username}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 uppercase">
                    {currentUser?.role_id}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">{currentUser?.email}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" /> Current Active Session
              </span>
            </div>
          </div>

          {/* User List & Create */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Registered Users ({users.length})
              </h3>
              <button
                type="button"
                onClick={() => setIsCreating(!isCreating)}
                className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add User
              </button>
            </div>

            {isCreating && (
              <form onSubmit={handleCreateUser} className="p-4 rounded-xl bg-neutral-950 border border-neutral-700 space-y-3 text-xs">
                <div className="font-semibold text-neutral-200">Create New Account</div>

                {createError && (
                  <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{createError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-neutral-400 block mb-1">Username</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. jdoe"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-neutral-100"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-400 block mb-1">Email</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. jdoe@lifehub.local"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-neutral-100"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-400 block mb-1">Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Minimum 6 characters"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-neutral-100"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-400 block mb-1">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={newUser.full_name}
                      onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-neutral-100"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-neutral-400 block mb-1">Assigned Role</label>
                    <select
                      value={newUser.role_id}
                      onChange={(e) => setNewUser({ ...newUser, role_id: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-neutral-100"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.id})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-3 py-1 text-neutral-400 hover:text-neutral-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium"
                  >
                    Create User
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-neutral-300 text-xs">
                      {u.full_name?.charAt(0) || u.username?.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-100">{u.full_name || u.username}</span>
                        <span className="text-neutral-500 font-mono text-[11px]">@{u.username}</span>
                        {!u.is_active && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-800">
                            Deactivated
                          </span>
                        )}
                      </div>
                      <span className="text-neutral-400 text-[11px]">{u.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={u.role_id}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-neutral-200 text-xs"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => handleToggleUserActive(u)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        u.is_active
                          ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-400'
                          : 'border-rose-800 bg-rose-950/50 text-rose-400'
                      }`}
                      title={u.is_active ? 'Deactivate user' : 'Reactivate user'}
                    >
                      {u.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                    </button>

                    {currentUser?.id !== u.id && u.is_active && (
                      <button
                        type="button"
                        onClick={() => handleSwitchSession(u.id)}
                        className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-indigo-300 font-medium transition-colors"
                      >
                        Switch To
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
          {onLogout ? (
            <button
              type="button"
              onClick={async () => {
                await api.auth.logout();
                onLogout();
                onClose();
              }}
              className="px-3.5 py-1.5 rounded-lg border border-red-900/60 bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          ) : <div />}
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
