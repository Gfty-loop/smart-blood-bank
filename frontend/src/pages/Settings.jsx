import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
  Settings as SettingsIcon,
  Shield,
  Users,
  Sliders,
  History,
  CheckCircle,
  Plus,
  Lock,
  Mail,
  User,
  X,
  AlertCircle
} from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('thresholds');

  // Thresholds state
  const [settings, setSettings] = useState({});
  const [thresholdSaving, setThresholdSaving] = useState(false);
  const [thresholdSuccess, setThresholdSuccess] = useState('');

  // Users state
  const [users, setUsers] = useState([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({ name: '', email: '', password: '', role: 'staff' });
  const [userError, setUserError] = useState('');
  const [userSubmitting, setUserSubmitting] = useState(false);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSettings(res.data.settings || {});
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/settings/users');
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const fetchAuditLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await api.get('/settings/audit-logs');
      setAuditLogs(res.data.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchUsers();
    fetchAuditLogs();
  }, []);

  const handleSaveThresholds = async (e) => {
    e.preventDefault();
    setThresholdSaving(true);
    setThresholdSuccess('');

    try {
      await api.put('/settings', settings);
      setThresholdSuccess('System thresholds and business rules updated successfully.');
      setTimeout(() => setThresholdSuccess(''), 4000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setThresholdSaving(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserSubmitting(true);
    setUserError('');

    try {
      await api.post('/settings/users', newUserData);
      setShowAddUserModal(false);
      setNewUserData({ name: '', email: '', password: '', role: 'staff' });
      fetchUsers();
    } catch (err) {
      setUserError(err.response?.data?.error || 'Failed to create user account.');
    } finally {
      setUserSubmitting(false);
    }
  };

  const handleToggleUser = async (userId) => {
    try {
      await api.put(`/settings/users/${userId}/toggle`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update user status.');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
          <SettingsIcon className="w-6 h-6 text-blood-600" />
          <span>System Administration & Audit</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure business rules, manage staff accounts, and inspect cryptographic audit logs
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('thresholds')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'thresholds'
              ? 'bg-blood-600 text-white shadow-md shadow-blood-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Configurable Thresholds</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'users'
              ? 'bg-blood-600 text-white shadow-md shadow-blood-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Staff Accounts ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'audit'
              ? 'bg-blood-600 text-white shadow-md shadow-blood-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>System Audit Trail</span>
        </button>
      </div>

      {/* Tab 1: Configurable Thresholds */}
      {activeTab === 'thresholds' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Clinical & Inventory Thresholds</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize automated alerts, safe donation gaps, and donor screening criteria (PRD Section 9)
            </p>
          </div>

          {thresholdSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{thresholdSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSaveThresholds} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Low Stock Threshold (Units)
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings.low_stock_threshold || '5'}
                  onChange={(e) => setSettings({ ...settings, low_stock_threshold: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Default: 5 units. Raises warning if group dips below this.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  RBC / Whole Blood Expiry Alert Window (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings.expiry_alert_days_rbc || '5'}
                  onChange={(e) => setSettings({ ...settings, expiry_alert_days_rbc: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Default: 5 days prior to expiration.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Platelets Expiry Alert Window (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings.expiry_alert_days_platelets || '2'}
                  onChange={(e) => setSettings({ ...settings, expiry_alert_days_platelets: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Default: 2 days (due to short 5-day total shelf life).</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Minimum Donation Gap (Days)
                </label>
                <input
                  type="number"
                  min="30"
                  value={settings.min_donation_gap_days || '90'}
                  onChange={(e) => setSettings({ ...settings, min_donation_gap_days: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Configurable standard: 90 days between donations.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Minimum Donor Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={settings.min_donor_weight || '50'}
                  onChange={(e) => setSettings({ ...settings, min_donor_weight: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Default: 50.0 kg</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Minimum Haemoglobin (g/dL)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.min_hemoglobin || '12.5'}
                  onChange={(e) => setSettings({ ...settings, min_hemoglobin: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Default: 12.5 g/dL</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={thresholdSaving}
                className="px-5 py-2.5 bg-blood-600 hover:bg-blood-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blood-600/30 transition disabled:opacity-50"
              >
                {thresholdSaving ? 'Updating...' : 'Save Configuration Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: User Accounts */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Authorized Personnel</h2>
              <p className="text-xs text-slate-500">Only Admin and Staff roles have access (donors and hospitals do not log in)</p>
            </div>

            <button
              onClick={() => {
                setUserError('');
                setShowAddUserModal(true);
              }}
              className="px-3.5 py-2 bg-blood-600 hover:bg-blood-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blood-600/30 flex items-center space-x-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff Account</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.user_id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <span>{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleUser(u.user_id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                            u.is_active
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {u.is_active ? 'Deactivate' : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: System Audit Log */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Cryptographic System Audit Trail</h2>
            <p className="text-xs text-slate-500">Every donation, discard, dispatch, and administrative action is permanently logged</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logsLoading ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400">Loading audit trail...</td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400">No audit logs recorded yet.</td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.log_id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{log.timestamp}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{log.user_name || 'System / Automated Cron'}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-mono text-[10px] rounded font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-600">
                        {log.entity} #{log.entity_id}
                      </td>
                      <td className="py-3 px-4 text-slate-600 leading-snug">
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add User */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-extrabold text-sm text-slate-900">Add Staff User</h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-3.5">
              {userError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                  {userError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="alex.m@bloodbank.org"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Temporary Password *</label>
                <input
                  type="password"
                  required
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">System Role *</label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500"
                >
                  <option value="staff">Staff (Collection & Dispatch)</option>
                  <option value="technician">Technician (Lab & Quarantine Testing)</option>
                  <option value="admin">Admin (Manager)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={userSubmitting}
                  className="px-4 py-2 bg-blood-600 hover:bg-blood-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blood-600/30 transition disabled:opacity-50"
                >
                  {userSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
