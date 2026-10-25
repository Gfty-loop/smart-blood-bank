import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  Package,
  Droplet,
  Building2,
  Trash2,
  RefreshCw
} from 'lucide-react';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('donations');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      let endpoint = '/reports/donations';
      if (activeTab === 'inventory') endpoint = '/reports/inventory';
      if (activeTab === 'issues') endpoint = '/reports/issues';
      if (activeTab === 'discards') endpoint = '/reports/discards';

      const res = await api.get(endpoint, { params });
      setReportData(res.data.data || []);
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [activeTab]);

  const handleDownloadCSV = () => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    params.append('format', 'csv');

    let endpoint = '/reports/donations';
    if (activeTab === 'inventory') endpoint = '/reports/inventory';
    if (activeTab === 'issues') endpoint = '/reports/issues';
    if (activeTab === 'discards') endpoint = '/reports/discards';

    // Trigger download via link
    const url = `/api${endpoint}?${params.toString()}`;
    const token = localStorage.getItem('token');

    // Use fetch with token to download blob
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.blob())
      .then(blob => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${activeTab}_report_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(err => console.error('Failed to download CSV:', err));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <FileSpreadsheet className="w-6 h-6 text-blood-600" />
            <span>Auditing & Analytical Reports</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time compliance reports, transfusion history, stock snapshots, and raw CSV exports
          </p>
        </div>

        <button
          onClick={handleDownloadCSV}
          disabled={loading || reportData.length === 0}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/30 flex items-center space-x-2 transition disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>Export Current Report to CSV</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('donations')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'donations'
              ? 'bg-blood-600 text-white shadow-md shadow-blood-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Droplet className="w-3.5 h-3.5" />
          <span>Donations Log</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'inventory'
              ? 'bg-blood-600 text-white shadow-md shadow-blood-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Stock Snapshot</span>
        </button>

        <button
          onClick={() => setActiveTab('issues')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'issues'
              ? 'bg-blood-600 text-white shadow-md shadow-blood-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Hospital Dispatches</span>
        </button>

        <button
          onClick={() => setActiveTab('discards')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'discards'
              ? 'bg-blood-600 text-white shadow-md shadow-blood-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Expired & Discarded Units</span>
        </button>
      </div>

      {/* Date Range Filter Bar */}
      {(activeTab === 'donations' || activeTab === 'issues') && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Date Range:</span>
          </span>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
          />

          <span className="text-xs text-slate-400">to</span>

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
          />

          <button
            onClick={loadReport}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition"
          >
            Apply Date Filter
          </button>
        </div>
      )}

      {/* Report Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              Generating report data...
            </div>
          ) : reportData.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No records found for this reporting period.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                {activeTab === 'donations' && (
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Donor Name</th>
                    <th className="py-3 px-4">Blood Group</th>
                    <th className="py-3 px-4">Component</th>
                    <th className="py-3 px-4">Volume</th>
                    <th className="py-3 px-4">Hb / BP</th>
                    <th className="py-3 px-4">Test Status</th>
                    <th className="py-3 px-4">Assigned Unit</th>
                  </tr>
                )}
                {activeTab === 'inventory' && (
                  <tr>
                    <th className="py-3 px-4">Unit Identifier</th>
                    <th className="py-3 px-4">Blood Group</th>
                    <th className="py-3 px-4">Component</th>
                    <th className="py-3 px-4">Collected On</th>
                    <th className="py-3 px-4">Expires On</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                )}
                {activeTab === 'issues' && (
                  <tr>
                    <th className="py-3 px-4">Dispatch Timestamp</th>
                    <th className="py-3 px-4">Hospital Name</th>
                    <th className="py-3 px-4">Patient Reference</th>
                    <th className="py-3 px-4">Requested Group</th>
                    <th className="py-3 px-4">Dispatched Unit ID</th>
                    <th className="py-3 px-4">Unit Group & Component</th>
                    <th className="py-3 px-4">Issued By Staff</th>
                  </tr>
                )}
                {activeTab === 'discards' && (
                  <tr>
                    <th className="py-3 px-4">Unit Identifier</th>
                    <th className="py-3 px-4">Blood Group</th>
                    <th className="py-3 px-4">Component</th>
                    <th className="py-3 px-4">Expiry Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Documented Discard Reason</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    {activeTab === 'donations' && (
                      <>
                        <td className="py-3 px-4 font-semibold text-slate-800">{row.donation_date}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{row.donor_name}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-blood-50 text-blood-700 font-bold rounded">
                            {row.blood_group}
                          </span>
                        </td>
                        <td className="py-3 px-4">{row.component_type}</td>
                        <td className="py-3 px-4 font-mono">{row.volume_ml} ml</td>
                        <td className="py-3 px-4">{row.hemoglobin} g/dL • {row.bp}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.test_status === 'Passed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {row.test_status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">{row.unit_id || '—'}</td>
                      </>
                    )}

                    {activeTab === 'inventory' && (
                      <>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{row.unit_id}</td>
                        <td className="py-3 px-4 font-bold text-blood-700">{row.blood_group}</td>
                        <td className="py-3 px-4">{row.component_type}</td>
                        <td className="py-3 px-4 text-slate-600">{row.collected_on}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{row.expires_on}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </>
                    )}

                    {activeTab === 'issues' && (
                      <>
                        <td className="py-3 px-4 text-slate-600">{row.issued_at}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{row.hospital_name}</td>
                        <td className="py-3 px-4 font-mono">{row.patient_ref}</td>
                        <td className="py-3 px-4 font-bold text-blood-700">{row.requested_group}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{row.unit_id}</td>
                        <td className="py-3 px-4">{row.unit_group} • {row.component_type}</td>
                        <td className="py-3 px-4 text-slate-600">{row.issued_by_name}</td>
                      </>
                    )}

                    {activeTab === 'discards' && (
                      <>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{row.unit_id}</td>
                        <td className="py-3 px-4 font-bold text-blood-700">{row.blood_group}</td>
                        <td className="py-3 px-4">{row.component_type}</td>
                        <td className="py-3 px-4 text-slate-600">{row.expires_on}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.status === 'Expired' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">{row.discard_reason || '—'}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
