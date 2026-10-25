import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertContext';
import {
  LayoutDashboard,
  Users,
  Droplet,
  Package,
  Send,
  Building2,
  BellRing,
  FileSpreadsheet,
  Settings,
  ShieldAlert
} from 'lucide-react';

export default function Sidebar() {
  const { isAdmin } = useAuth();
  const { unreadCount } = useAlerts();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/donors', label: 'Donors', icon: Users },
    { to: '/screening', label: 'Screening & Donation', icon: Droplet },
    { to: '/inventory', label: 'Blood Inventory', icon: Package },
    { to: '/requests', label: 'Hospital Requests', icon: Send },
    { to: '/hospitals', label: 'Hospitals', icon: Building2 },
    { to: '/alerts', label: 'Alerts & Expiry', icon: BellRing, badge: unreadCount },
    { to: '/reports', label: 'Reports & CSV', icon: FileSpreadsheet },
  ];

  if (isAdmin) {
    navItems.push({ to: '/settings', label: 'Admin Settings', icon: Settings });
  }

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-800">
      <div className="p-4">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Core Operations
        </div>
        <nav className="space-y-1 mt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blood-600 text-white shadow-lg shadow-blood-900/30 font-bold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blood-500 text-white shadow-sm">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-slate-800/80">
        <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>FEFO Transfusion Engine</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-snug">
            Automated compatibility verification & earliest-expiry allocation active.
          </p>
        </div>
      </div>
    </aside>
  );
}
