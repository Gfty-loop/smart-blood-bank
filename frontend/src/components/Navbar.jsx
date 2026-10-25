import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertContext';
import {
  Bell,
  LogOut,
  User,
  Shield,
  HelpCircle,
  AlertTriangle,
  Clock,
  RotateCw,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import CompatibilityMatrixModal from './CompatibilityMatrixModal';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { alerts, unreadCount, markAsRead, markAllAsRead, triggerScan, loading } = useAlerts();

  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);

  const alertRef = useRef(null);
  const userRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (alertRef.current && !alertRef.current.contains(e.target)) {
        setShowAlertsDropdown(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-6">
        {/* Left: Branding & Tagline */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blood-700 to-blood-500 flex items-center justify-center text-white shadow-md shadow-blood-500/20">
            <span className="text-xl leading-none">🩸</span>
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg flex items-center space-x-1.5">
              <span>Smart Blood Bank</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blood-100 text-blood-700 font-semibold border border-blood-200">
                SBBMS
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">Inventory, Compatibility & Dispatch Management</p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Compatibility Matrix Guide Button */}
          <button
            onClick={() => setShowMatrix(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition"
            title="Blood Transfusion Compatibility Rules"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blood-600" />
            <span className="hidden md:inline">Compatibility Guide</span>
          </button>

          {/* Alerts Bell & Dropdown */}
          <div className="relative" ref={alertRef}>
            <button
              onClick={() => setShowAlertsDropdown(prev => !prev)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
              title="System Alerts & Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-blood-600 rounded-full px-1 border-2 border-white shadow-sm animate-pulse-subtle">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showAlertsDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-fade-in">
                <div className="p-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-800 text-sm">System Alerts</span>
                    {unreadCount > 0 && (
                      <span className="text-xs px-2 py-0.5 bg-blood-100 text-blood-700 font-semibold rounded-full">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => triggerScan()}
                      disabled={loading}
                      title="Run Expiry & Stock Scan Now"
                      className="p-1 text-slate-500 hover:text-slate-800 rounded transition disabled:opacity-50"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blood-600 hover:text-blood-800 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {alerts.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                      All clear! No pending alerts or low-stock warnings.
                    </div>
                  ) : (
                    alerts.slice(0, 8).map(alert => (
                      <div
                        key={alert.alert_id}
                        onClick={() => !alert.is_read && markAsRead(alert.alert_id)}
                        className={`p-3 text-xs flex items-start space-x-3 cursor-pointer transition ${
                          alert.is_read ? 'bg-white opacity-70' : 'bg-slate-50/80 hover:bg-slate-100/80 font-medium'
                        }`}
                      >
                        <div className="mt-0.5">
                          {alert.type === 'EMERGENCY_REQUEST' ? (
                            <span className="p-1 rounded-md bg-rose-100 text-rose-600 inline-block">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            </span>
                          ) : alert.type === 'LOW_STOCK' ? (
                            <span className="p-1 rounded-md bg-amber-100 text-amber-700 inline-block">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            </span>
                          ) : (
                            <span className="p-1 rounded-md bg-blue-100 text-blue-700 inline-block">
                              <Clock className="w-3.5 h-3.5 text-blue-600" />
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-800 line-clamp-2 leading-relaxed">{alert.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(alert.created_at).toLocaleString()}
                          </span>
                        </div>
                        {!alert.is_read && (
                          <span className="w-2 h-2 rounded-full bg-blood-600 flex-shrink-0 mt-1" />
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                  <a
                    href="/alerts"
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
                  >
                    View All Alert History &rarr;
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setShowUserDropdown(prev => !prev)}
              className="flex items-center space-x-2 pl-2 pr-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition border border-slate-200/60"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">{user?.name}</div>
                <div className="text-[10px] text-slate-500 capitalize">{user?.role}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-fade-in">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    user?.role === 'admin'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {user?.role}
                  </span>
                </div>

                <div className="py-1">
                  {isAdmin && (
                    <a
                      href="/settings"
                      className="flex items-center space-x-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Shield className="w-3.5 h-3.5 text-slate-500" />
                      <span>Admin Settings & Users</span>
                    </a>
                  )}
                  <button
                    onClick={logout}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Compatibility Guide Modal */}
      <CompatibilityMatrixModal isOpen={showMatrix} onClose={() => setShowMatrix(false)} />
    </>
  );
}
