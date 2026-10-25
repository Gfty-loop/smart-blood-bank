import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAlerts } from '../context/AlertContext';
import {
  BellRing,
  AlertTriangle,
  Clock,
  RotateCw,
  CheckCircle2,
  Filter,
  Check,
  ShieldAlert,
  Flame,
  Droplet
} from 'lucide-react';

export default function Alerts() {
  const { alerts, unreadCount, fetchAlerts, markAsRead, markAllAsRead, triggerScan, loading } = useAlerts();
  const [selectedType, setSelectedType] = useState('');
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleRunScan = async () => {
    try {
      const res = await triggerScan();
      setScanResult(res.result);
      setTimeout(() => setScanResult(null), 7000);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAlerts = selectedType
    ? alerts.filter(a => a.type === selectedType)
    : alerts;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <BellRing className="w-6 h-6 text-blood-600" />
            <span>Alerts & Inventory Monitoring</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated alerts for expiring units, critical inventory deficits, and emergency trauma dispatches
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
            >
              Mark All Read ({unreadCount})
            </button>
          )}

          <button
            onClick={handleRunScan}
            disabled={loading}
            className="px-4 py-2 bg-blood-600 hover:bg-blood-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blood-600/30 flex items-center space-x-2 transition disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Scanning Inventory...' : 'Trigger Scan Now'}</span>
          </button>
        </div>
      </div>

      {/* Manual Scan Results Notification */}
      {scanResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center justify-between animate-fade-in shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>
              <strong>Inventory Audit Complete:</strong> {scanResult.expired_units_updated} expired unit(s) updated to Expired status • {scanResult.new_expiry_alerts} expiry alerts generated • {scanResult.new_low_stock_alerts} low stock alerts raised.
            </span>
          </div>
          <button onClick={() => setScanResult(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedType('')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            selectedType === ''
              ? 'bg-slate-900 text-white'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Alerts ({alerts.length})
        </button>

        <button
          onClick={() => setSelectedType('EMERGENCY_REQUEST')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            selectedType === 'EMERGENCY_REQUEST'
              ? 'bg-rose-600 text-white'
              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
          }`}
        >
          Emergency Orders
        </button>

        <button
          onClick={() => setSelectedType('LOW_STOCK')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            selectedType === 'LOW_STOCK'
              ? 'bg-amber-600 text-white'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
          }`}
        >
          Low Stock Warnings
        </button>

        <button
          onClick={() => setSelectedType('EXPIRY_WARNING')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            selectedType === 'EXPIRY_WARNING'
              ? 'bg-blue-600 text-white'
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          }`}
        >
          Expiry Warnings
        </button>

        <button
          onClick={() => setSelectedType('EXPIRED')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            selectedType === 'EXPIRED'
              ? 'bg-purple-600 text-white'
              : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
          }`}
        >
          Expired Units
        </button>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
            <p className="text-xs font-bold text-slate-700">No active alerts</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Inventory levels are safe and no expiry risks are flagged.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isUnread = !alert.is_read;

            return (
              <div
                key={alert.alert_id}
                className={`p-4 rounded-2xl border transition flex items-start justify-between gap-4 ${
                  isUnread
                    ? 'bg-white border-slate-300 shadow-md ring-1 ring-slate-200/50'
                    : 'bg-slate-50/70 border-slate-200 opacity-75'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div className="mt-0.5">
                    {alert.type === 'EMERGENCY_REQUEST' ? (
                      <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                        <Flame className="w-5 h-5 text-rose-600" />
                      </div>
                    ) : alert.type === 'LOW_STOCK' ? (
                      <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      </div>
                    ) : alert.type === 'EXPIRY_WARNING' ? (
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                        <ShieldAlert className="w-5 h-5 text-purple-600" />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        alert.type === 'EMERGENCY_REQUEST'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : alert.type === 'LOW_STOCK'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : alert.type === 'EXPIRY_WARNING'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        {alert.type.replace(/_/g, ' ')}
                      </span>

                      {alert.related_unit_or_group && (
                        <span className="font-mono text-xs font-bold text-slate-700">
                          Target: {alert.related_unit_or_group}
                        </span>
                      )}

                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-blood-600" title="Unread" />
                      )}
                    </div>

                    <p className="text-xs font-semibold text-slate-800 mt-1.5 leading-relaxed">
                      {alert.message}
                    </p>

                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Logged at: {new Date(alert.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {isUnread && (
                  <button
                    onClick={() => markAsRead(alert.alert_id)}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition flex items-center space-x-1 flex-shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mark Read</span>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
