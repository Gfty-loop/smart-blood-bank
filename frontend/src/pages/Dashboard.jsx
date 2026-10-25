import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Droplet,
  PackageCheck,
  Clock,
  AlertTriangle,
  HeartPulse,
  Send,
  Users,
  ChevronRight,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard');
      setData(res.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Failed to fetch real-time dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading && !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="w-8 h-8 text-blood-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Loading Real-Time Blood Bank Inventory...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center justify-between">
          <span>{error || 'Unable to connect to blood bank backend.'}</span>
          <button
            onClick={loadDashboard}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { metrics, groupStock, componentStock, trendData, activeEmergencies, recentActivity } = data;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Urgent Emergency Request Banner (High Priority) */}
      {activeEmergencies && activeEmergencies.length > 0 && (
        <div className="bg-gradient-to-r from-rose-600 to-red-600 rounded-2xl p-4 sm:p-5 text-white shadow-xl shadow-rose-900/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-rose-400/40 animate-pulse-subtle">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-white/20 rounded-xl mt-0.5 backdrop-blur-md">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold uppercase tracking-wide text-xs bg-white text-rose-700 px-2.5 py-0.5 rounded-full shadow-sm">
                  Priority 1: Emergency Blood Request
                </span>
                <span className="text-xs text-rose-100">{activeEmergencies.length} Active Request(s)</span>
              </div>
              <p className="text-sm font-bold text-white mt-1">
                {activeEmergencies[0].hospital_name} needs {activeEmergencies[0].units_required} unit(s) of{' '}
                <span className="underline decoration-2">{activeEmergencies[0].blood_group} {activeEmergencies[0].component_type}</span>{' '}
                (Patient: {activeEmergencies[0].patient_ref})
              </p>
              <p className="text-xs text-rose-100 mt-0.5">
                Required By: {new Date(activeEmergencies[0].required_by).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • FEFO compatibility match ready
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/requests')}
            className="w-full md:w-auto px-5 py-2.5 bg-white text-rose-700 hover:bg-rose-50 font-bold rounded-xl text-xs shadow-lg transition transform active:scale-95 flex items-center justify-center space-x-1.5 flex-shrink-0"
          >
            <span>Fulfill Emergency Dispatch</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Top Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Available Units */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Stock</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{metrics.total_available_units} <span className="text-xs font-semibold text-slate-500">units</span></h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Tested & Ready</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blood-50 text-blood-600 flex items-center justify-center">
            <Droplet className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Expiring Soon */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expiring in ≤ 5 Days</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{metrics.expiring_soon_count} <span className="text-xs font-semibold text-slate-500">units</span></h3>
            <p className={`text-[11px] font-semibold mt-1 ${metrics.expiring_soon_count > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
              {metrics.expiring_soon_count > 0 ? 'Prioritize FEFO dispatch' : 'No urgent shelf-life risks'}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${metrics.expiring_soon_count > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Pending Requests */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Requests</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{metrics.pending_requests} <span className="text-xs font-semibold text-slate-500">orders</span></h3>
            <p className="text-[11px] text-rose-600 font-semibold mt-1">
              {metrics.emergency_requests_count} Emergency Order(s)
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Send className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4: Today's Donations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Collections</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{metrics.today_donations} <span className="text-xs font-semibold text-slate-500">donations</span></h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {metrics.total_active_donors} Active Donors
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <HeartPulse className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Live Blood Group Inventory Cards (8 Blood Groups) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <span>Inventory by Blood Group</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                Threshold: 5 units
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Real-time status of available tested blood inventory</p>
          </div>
          <button
            onClick={() => navigate('/inventory')}
            className="text-xs font-bold text-blood-600 hover:text-blood-700 flex items-center space-x-1"
          >
            <span>View Full Inventory Table</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {groupStock.map((item) => {
            const isLow = item.is_low_stock;
            const progress = Math.min(100, Math.round((item.count / 10) * 100));

            return (
              <div
                key={item.blood_group}
                className={`p-3.5 rounded-xl border text-center transition ${
                  isLow
                    ? 'bg-rose-50/60 border-rose-200 shadow-sm shadow-rose-100'
                    : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-sm font-black px-2 py-0.5 rounded-lg border ${
                    isLow ? 'bg-rose-600 text-white border-rose-700' : 'bg-white text-slate-800 border-slate-300'
                  }`}>
                    {item.blood_group}
                  </span>
                  {isLow && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title="Low Stock Warning" />
                  )}
                </div>

                <div className="my-2">
                  <div className="text-xl font-black text-slate-900 leading-tight">
                    {item.count}
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold">Available Units</div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isLow ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="text-[10px] font-bold mt-2">
                  {isLow ? (
                    <span className="text-rose-600 flex items-center justify-center space-x-0.5">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span>Low Stock</span>
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-semibold">Adequate</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Charts & Trends Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Trend Chart (2 columns) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-blood-600" />
                <span>Collections & Issues (Past 7 Days)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Volume comparison of incoming donations vs hospital dispatches</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorIssues" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="donations" name="Donations Collected" stroke="#e11d48" strokeWidth={2} fillOpacity={1} fill="url(#colorDonations)" />
                <Area type="monotone" dataKey="issues" name="Blood Units Issued" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorIssues)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock by Component Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
              <PackageCheck className="w-4 h-4 text-blood-600" />
              <span>Available Components</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Distribution across blood products</p>

            <div className="space-y-3 mt-5">
              {componentStock.map((comp) => {
                const total = metrics.total_available_units || 1;
                const pct = Math.round((comp.count / total) * 100);

                return (
                  <div key={comp.component_type} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                    <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                      <span>{comp.component_type}</span>
                      <span>{comp.count} units ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-blood-600 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Shelf Life: RBC (42d) • PLT (5d) • FFP (365d)</span>
          </div>
        </div>
      </div>

      {/* 5. Quick Actions & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Operations Panel */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-4 h-4 text-blood-400" />
              <h3 className="font-extrabold text-sm text-white">Staff Quick Actions</h3>
            </div>
            <p className="text-xs text-slate-400 mb-5">Frequently accessed clinical and dispatch shortcuts</p>

            <div className="space-y-2.5">
              <button
                onClick={() => navigate('/screening')}
                className="w-full flex items-center justify-between p-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-xs font-semibold text-white transition text-left"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 rounded-lg bg-blood-500/20 text-blood-400">
                    <HeartPulse className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold">Donor Screening & Collection</div>
                    <div className="text-[10px] text-slate-400">Run eligibility check & log donation</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => navigate('/requests')}
                className="w-full flex items-center justify-between p-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-xs font-semibold text-white transition text-left"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold">Process Hospital Requests</div>
                    <div className="text-[10px] text-slate-400">Smart FEFO compatibility match & issue</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => navigate('/donors')}
                className="w-full flex items-center justify-between p-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-xs font-semibold text-white transition text-left"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold">Register New Donor</div>
                    <div className="text-[10px] text-slate-400">Add donor profile and health screening</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-700/60 text-[11px] text-slate-400 text-center">
            System Local Time: <span className="text-slate-200 font-mono">2026-10-25 16:45</span>
          </div>
        </div>

        {/* Recent Collections */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
              <Droplet className="w-4 h-4 text-blood-600" />
              <span>Recent Collections</span>
            </h3>
            <span className="text-xs text-slate-400">Latest</span>
          </div>

          <div className="space-y-3 flex-1">
            {recentActivity.donations.map((d) => (
              <div key={d.donation_id} className="p-3 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-200/60 flex items-center justify-between transition">
                <div>
                  <div className="text-xs font-bold text-slate-900">{d.donor_name}</div>
                  <div className="text-[11px] text-slate-500">{d.component_type} • {d.donation_date}</div>
                </div>
                <span className="px-2.5 py-1 bg-blood-100 text-blood-700 text-xs font-black rounded-lg border border-blood-200">
                  {d.blood_group}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Dispatches */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
              <Send className="w-4 h-4 text-blue-600" />
              <span>Recent Dispatches</span>
            </h3>
            <span className="text-xs text-slate-400">Fulfilled</span>
          </div>

          <div className="space-y-3 flex-1">
            {recentActivity.issues.map((iss) => (
              <div key={iss.allocation_id} className="p-3 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-200/60 flex items-center justify-between transition">
                <div className="min-w-0 pr-2">
                  <div className="text-xs font-bold text-slate-900 truncate">{iss.hospital_name}</div>
                  <div className="text-[11px] text-slate-500 truncate">Patient: {iss.patient_ref} • {iss.component_type}</div>
                </div>
                <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-black rounded-lg border border-blue-200 flex-shrink-0">
                  {iss.blood_group}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
