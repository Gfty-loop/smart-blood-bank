import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
  Package,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  Trash2,
  CheckCircle,
  X,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Droplet
} from 'lucide-react';

export default function Inventory() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  // Filters
  const [bloodGroup, setBloodGroup] = useState('');
  const [componentType, setComponentType] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [expiringWithinDays, setExpiringWithinDays] = useState('');

  // Modals
  const [discardTargetUnit, setDiscardTargetUnit] = useState(null);
  const [discardReason, setDiscardReason] = useState('');
  const [discardSubmitting, setDiscardSubmitting] = useState(false);
  const [discardError, setDiscardError] = useState('');

  const [quarantineTargetUnit, setQuarantineTargetUnit] = useState(null);
  const [quarantineSubmitting, setQuarantineSubmitting] = useState(false);

  const bloodGroups = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
  const components = ['Whole Blood', 'Red Blood Cells', 'Platelets', 'Plasma'];
  const statuses = ['Available', 'Quarantine', 'Issued', 'Expired', 'Discarded'];

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = {};
      if (bloodGroup) params.blood_group = bloodGroup;
      if (componentType) params.component_type = componentType;
      if (status) params.status = status;
      if (search) params.search = search;
      if (expiringWithinDays) params.expiring_within_days = expiringWithinDays;

      const [resUnits, resSummary] = await Promise.all([
        api.get('/inventory', { params }),
        api.get('/inventory/summary')
      ]);

      setUnits(resUnits.data.units || []);
      setSummary(resSummary.data);
    } catch (err) {
      console.error('Failed to load blood inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [bloodGroup, componentType, status, expiringWithinDays]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInventory();
  };

  const handleDiscard = async (e) => {
    e.preventDefault();
    if (!discardTargetUnit || !discardReason.trim()) return;
    setDiscardSubmitting(true);
    setDiscardError('');

    try {
      await api.post(`/inventory/${discardTargetUnit.unit_id}/discard`, {
        reason: discardReason.trim()
      });
      setDiscardTargetUnit(null);
      setDiscardReason('');
      fetchInventory();
    } catch (err) {
      setDiscardError(err.response?.data?.error || 'Failed to discard unit.');
    } finally {
      setDiscardSubmitting(false);
    }
  };

  const handleReleaseQuarantine = async () => {
    if (!quarantineTargetUnit) return;
    setQuarantineSubmitting(true);
    try {
      await api.put(`/inventory/${quarantineTargetUnit.unit_id}/release-quarantine`);
      setQuarantineTargetUnit(null);
      fetchInventory();
    } catch (err) {
      console.error('Failed to release quarantine unit:', err);
    } finally {
      setQuarantineSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Package className="w-6 h-6 text-blood-600" />
            <span>Blood Inventory & Storage</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor shelf life, quarantine tests, FEFO allocation queue, and manage blood discards
          </p>
        </div>

        {summary && (
          <div className="flex items-center space-x-2">
            <div className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{summary.totalAvailable} Available Units</span>
            </div>
            {summary.expiringSoonCount > 0 && (
              <button
                onClick={() => setExpiringWithinDays('5')}
                className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
              >
                <Clock className="w-4 h-4 text-amber-600" />
                <span>{summary.expiringSoonCount} Expiring Soon</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Unit ID (e.g. WB-20261015-01) or Donor name..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500 focus:bg-white transition"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Blood group */}
          <select
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none"
          >
            <option value="">All Groups</option>
            {bloodGroups.map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>

          {/* Component */}
          <select
            value={componentType}
            onChange={(e) => setComponentType(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none"
          >
            <option value="">All Components</option>
            {components.map((comp) => (
              <option key={comp} value={comp}>{comp}</option>
            ))}
          </select>

          {/* Status */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none"
          >
            <option value="">All Statuses</option>
            {statuses.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>

          {/* Expiring Soon Quick Toggle */}
          <button
            onClick={() => setExpiringWithinDays(expiringWithinDays ? '' : '5')}
            className={`px-3 py-2 text-xs font-bold rounded-xl border transition ${
              expiringWithinDays
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            ≤ 5 Days Expiry
          </button>

          <button
            onClick={fetchInventory}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Unit Identifier</th>
                <th className="py-3 px-4">Blood Group</th>
                <th className="py-3 px-4">Component</th>
                <th className="py-3 px-4">Collected On</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Shelf-Life Status</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    Loading blood inventory...
                  </td>
                </tr>
              ) : units.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No units found matching filter criteria.
                  </td>
                </tr>
              ) : (
                units.map((unit) => {
                  const daysRemaining = unit.days_until_expiry;
                  const isExpiringSoon = unit.is_expiring_soon;
                  const isExpired = unit.is_expired;

                  return (
                    <tr
                      key={unit.unit_id}
                      className={`hover:bg-slate-50/70 transition ${
                        isExpiringSoon && unit.status === 'Available' ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {unit.unit_id}
                        {unit.donor_name && (
                          <span className="block font-sans text-[10px] text-slate-400 font-normal">
                            Donor: {unit.donor_name}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 bg-blood-50 text-blood-700 font-black rounded-lg border border-blood-200">
                          {unit.blood_group}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {unit.component_type}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {unit.collected_on}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`font-semibold ${isExpired ? 'text-rose-600' : isExpiringSoon ? 'text-amber-600 font-bold' : 'text-slate-800'}`}>
                          {unit.expires_on}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {unit.status === 'Issued' ? (
                          <span className="text-slate-400 font-medium">Dispatched</span>
                        ) : unit.status === 'Discarded' ? (
                          <span className="text-slate-400 font-medium truncate max-w-[150px] block" title={unit.discard_reason}>
                            {unit.discard_reason || 'Discarded'}
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center space-x-1 text-rose-600 font-bold">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Expired ({Math.abs(daysRemaining)}d ago)</span>
                          </span>
                        ) : isExpiringSoon ? (
                          <span className="inline-flex items-center space-x-1 text-amber-600 font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{daysRemaining} day(s) left</span>
                          </span>
                        ) : (
                          <span className="text-slate-600 font-medium">
                            {daysRemaining} days safe
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                            unit.status === 'Available'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : unit.status === 'Quarantine'
                              ? 'bg-purple-100 text-purple-800 border-purple-200'
                              : unit.status === 'Issued'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : unit.status === 'Expired'
                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                              : 'bg-slate-100 text-slate-600 border-slate-300'
                          }`}
                        >
                          {unit.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {unit.status === 'Quarantine' && (
                            <button
                              onClick={() => setQuarantineTargetUnit(unit)}
                              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold transition flex items-center space-x-1"
                            >
                              <CheckCircle className="w-3 h-3" />
                              <span>Release</span>
                            </button>
                          )}

                          {['Available', 'Quarantine', 'Expired'].includes(unit.status) && (
                            <button
                              onClick={() => {
                                setDiscardTargetUnit(unit);
                                setDiscardReason('');
                                setDiscardError('');
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 rounded-lg text-[11px] font-semibold transition flex items-center space-x-1"
                              title="Discard unit"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Discard</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Discard Unit with Reason */}
      {discardTargetUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center space-x-2 text-rose-600">
                <Trash2 className="w-5 h-5" />
                <h3 className="font-extrabold text-slate-900 text-sm">Discard Blood Unit</h3>
              </div>
              <button
                onClick={() => setDiscardTargetUnit(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDiscard} className="p-6 space-y-4">
              {discardError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                  {discardError}
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div>Unit ID: <strong className="font-mono text-blood-600">{discardTargetUnit.unit_id}</strong></div>
                <div>Blood Group: <strong>{discardTargetUnit.blood_group}</strong> ({discardTargetUnit.component_type})</div>
                <div>Expiry Date: <strong>{discardTargetUnit.expires_on}</strong></div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Document Discard Reason *
                </label>
                <select
                  value={discardReason}
                  onChange={(e) => setDiscardReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500 mb-2"
                >
                  <option value="">-- Choose Standard Clinical Reason --</option>
                  <option value="Shelf-life expired">Shelf-life expired</option>
                  <option value="Visual hemolysis observed">Visual hemolysis observed</option>
                  <option value="Damaged bag seam or packaging breach">Damaged bag seam or packaging breach</option>
                  <option value="Cold-chain temperature deviation">Cold-chain temperature deviation</option>
                  <option value="Clot or fibrin strand formed during collection">Clot or fibrin strand formed during collection</option>
                  <option value="Infectious marker reactive on lab re-test">Infectious marker reactive on lab re-test</option>
                </select>

                <textarea
                  rows="2"
                  value={discardReason}
                  onChange={(e) => setDiscardReason(e.target.value)}
                  placeholder="Or enter custom detailed disposal observation..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setDiscardTargetUnit(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={discardSubmitting || !discardReason.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 transition disabled:opacity-50"
                >
                  {discardSubmitting ? 'Discarding...' : 'Confirm Discard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Release Quarantine Unit */}
      {quarantineTargetUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center space-x-2 text-purple-600">
                <CheckCircle className="w-5 h-5" />
                <h3 className="font-extrabold text-slate-900 text-sm">Release Unit from Quarantine</h3>
              </div>
              <button
                onClick={() => setQuarantineTargetUnit(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Confirm that laboratory viral screening tests (HIV, Hepatitis B/C, Syphilis, Malaria) have passed successfully for unit <strong className="font-mono text-slate-900">{quarantineTargetUnit.unit_id}</strong>.
              </p>

              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs space-y-1">
                <div>Blood Group: <strong>{quarantineTargetUnit.blood_group}</strong></div>
                <div>Component: <strong>{quarantineTargetUnit.component_type}</strong></div>
                <div>Status will become: <strong className="text-emerald-700">Available (Ready for Dispatch)</strong></div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setQuarantineTargetUnit(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReleaseQuarantine}
                  disabled={quarantineSubmitting}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/30 transition disabled:opacity-50"
                >
                  {quarantineSubmitting ? 'Releasing...' : 'Approve & Release to Stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
