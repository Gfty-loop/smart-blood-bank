import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
  Send,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  User,
  Droplet,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  FileText
} from 'lucide-react';

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');

  // Log Request Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    hospital_id: '',
    patient_ref: '',
    blood_group: 'O+',
    component_type: 'Red Blood Cells',
    units_required: 1,
    urgency: 'Normal',
    required_by: '',
    notes: ''
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  // Smart Fulfillment Modal (FEFO & Compatibility Engine)
  const [fulfillModalData, setFulfillModalData] = useState(null); // { request, allocations, compatibility }
  const [selectedUnitIds, setSelectedUnitIds] = useState([]);
  const [fulfillSubmitting, setFulfillSubmitting] = useState(false);
  const [fulfillError, setFulfillError] = useState('');

  // Reject Modal
  const [rejectRequestId, setRejectRequestId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const bloodGroups = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
  const components = ['Red Blood Cells', 'Whole Blood', 'Platelets', 'Plasma'];

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (urgencyFilter) params.urgency = urgencyFilter;

      const [reqRes, hospRes] = await Promise.all([
        api.get('/requests', { params }),
        api.get('/hospitals')
      ]);

      setRequests(reqRes.data.requests || []);
      setHospitals(hospRes.data.hospitals || []);
    } catch (err) {
      console.error('Failed to load blood requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, urgencyFilter]);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setCreateSubmitting(true);
    setCreateError('');

    try {
      await api.post('/requests', formData);
      setShowCreateModal(false);
      setFormData({
        hospital_id: '',
        patient_ref: '',
        blood_group: 'O+',
        component_type: 'Red Blood Cells',
        units_required: 1,
        urgency: 'Normal',
        required_by: '',
        notes: ''
      });
      fetchRequests();
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Failed to submit hospital blood request.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const openFulfillmentModal = async (requestId) => {
    setFulfillError('');
    setSelectedUnitIds([]);
    try {
      const res = await api.get(`/requests/${requestId}`);
      setFulfillModalData(res.data);
      // Auto-select top FEFO recommended units! (Fast-track emergency fulfillment in <= 3 clicks!)
      const recommended = res.data.compatibility?.recommended_selection || [];
      setSelectedUnitIds(recommended);
    } catch (err) {
      console.error('Failed to load request fulfillment details:', err);
    }
  };

  const handleToggleSelectUnit = (unitId) => {
    if (selectedUnitIds.includes(unitId)) {
      setSelectedUnitIds(selectedUnitIds.filter(id => id !== unitId));
    } else {
      setSelectedUnitIds([...selectedUnitIds, unitId]);
    }
  };

  const handleFulfillSubmit = async () => {
    if (!fulfillModalData || selectedUnitIds.length === 0) return;
    setFulfillSubmitting(true);
    setFulfillError('');

    try {
      await api.post(`/requests/${fulfillModalData.request.request_id}/fulfill`, {
        unit_ids: selectedUnitIds
      });
      setFulfillModalData(null);
      setSelectedUnitIds([]);
      fetchRequests();
    } catch (err) {
      setFulfillError(err.response?.data?.error || 'Failed to fulfill request.');
    } finally {
      setFulfillSubmitting(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectRequestId) return;
    try {
      await api.post(`/requests/${rejectRequestId}/reject`, {
        reason: rejectReason || 'Stock unavailable'
      });
      setRejectRequestId(null);
      setRejectReason('');
      fetchRequests();
    } catch (err) {
      console.error('Failed to reject request:', err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Send className="w-6 h-6 text-blood-600" />
            <span>Hospital Blood Requests & Dispatch</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Prioritised transfusion requests with automated FEFO compatibility matching and 3-click emergency issue
          </p>
        </div>

        <button
          onClick={() => {
            // Default required_by to 4 hours from now
            const fourHoursLater = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16);
            setFormData(prev => ({
              ...prev,
              hospital_id: hospitals[0]?.hospital_id || '',
              required_by: fourHoursLater
            }));
            setCreateError('');
            setShowCreateModal(true);
          }}
          className="px-4 py-2.5 bg-blood-600 hover:bg-blood-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blood-600/30 flex items-center space-x-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Log Hospital Blood Request</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Filter Queue:</span>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Partially Fulfilled">Partially Fulfilled</option>
            <option value="Fulfilled">Fulfilled</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none"
          >
            <option value="">All Urgencies</option>
            <option value="Emergency">Emergency (Priority 1)</option>
            <option value="Urgent">Urgent (Priority 2)</option>
            <option value="Normal">Normal (Priority 3)</option>
          </select>
        </div>

        <button
          onClick={fetchRequests}
          className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition"
        >
          Refresh Queue
        </button>
      </div>

      {/* Requests Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Urgency</th>
                <th className="py-3 px-4">Hospital</th>
                <th className="py-3 px-4">Patient Reference</th>
                <th className="py-3 px-4">Blood Needed</th>
                <th className="py-3 px-4">Units (Filled / Req)</th>
                <th className="py-3 px-4">Required By</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    Loading requests queue...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No hospital requests in the queue.
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const isEmergency = req.urgency === 'Emergency';
                  const isUrgent = req.urgency === 'Urgent';
                  const isPending = req.status === 'Pending' || req.status === 'Partially Fulfilled';

                  return (
                    <tr
                      key={req.request_id}
                      className={`hover:bg-slate-50/70 transition ${
                        isEmergency && isPending ? 'bg-rose-50/40 border-l-4 border-l-rose-600' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            isEmergency
                              ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30 animate-pulse-subtle'
                              : isUrgent
                              ? 'bg-amber-100 text-amber-800 border border-amber-300 font-bold'
                              : 'bg-slate-100 text-slate-700 font-bold'
                          }`}
                        >
                          {isEmergency && <AlertTriangle className="w-3 h-3 text-white" />}
                          <span>{req.urgency}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {req.hospital_name}
                        <span className="block font-normal text-[10px] text-slate-400">
                          {req.hospital_phone}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                        {req.patient_ref}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span className="px-2 py-0.5 bg-blood-50 text-blood-700 font-black rounded-md border border-blood-200">
                            {req.blood_group}
                          </span>
                          <span className="text-slate-600 font-medium">
                            {req.component_type}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold">
                        <span className={req.allocated_count >= req.units_required ? 'text-emerald-600' : 'text-slate-900'}>
                          {req.allocated_count}
                        </span>
                        <span className="text-slate-400 font-normal"> / {req.units_required} unit(s)</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1 text-slate-700 font-medium">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{new Date(req.required_by).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                            req.status === 'Fulfilled'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : req.status === 'Partially Fulfilled'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : req.status === 'Pending'
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-rose-100 text-rose-800 border-rose-200'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {isPending && (
                            <>
                              <button
                                onClick={() => openFulfillmentModal(req.request_id)}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center space-x-1 shadow-sm ${
                                  isEmergency
                                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
                                    : 'bg-blood-600 hover:bg-blood-700 text-white shadow-blood-600/30'
                                }`}
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Issue Blood</span>
                              </button>

                              <button
                                onClick={() => {
                                  setRejectRequestId(req.request_id);
                                  setRejectReason('');
                                }}
                                className="px-2 py-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                                title="Reject request"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {req.status === 'Fulfilled' && (
                            <button
                              onClick={() => openFulfillmentModal(req.request_id)}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition"
                            >
                              View Dispatch
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

      {/* Modal 1: Log Hospital Request */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blood-100 text-blood-600 rounded-xl">
                  <Send className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">Log Hospital Blood Request</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                  {createError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Requesting Hospital *</label>
                  <select
                    required
                    value={formData.hospital_id}
                    onChange={(e) => setFormData({ ...formData, hospital_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500 font-medium"
                  >
                    <option value="">-- Select Hospital --</option>
                    {hospitals.map((h) => (
                      <option key={h.hospital_id} value={h.hospital_id}>{h.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Patient Name or Ref # *</label>
                  <input
                    type="text"
                    required
                    value={formData.patient_ref}
                    onChange={(e) => setFormData({ ...formData, patient_ref: e.target.value })}
                    placeholder="e.g. ICU-PT-4019"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Urgency Priority *</label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-blood-500 text-slate-800"
                  >
                    <option value="Normal">Normal (Routine Transfusion)</option>
                    <option value="Urgent">Urgent (Surgical / Oncology)</option>
                    <option value="Emergency">Emergency (Immediate Trauma / MTP)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group Needed *</label>
                  <select
                    value={formData.blood_group}
                    onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold text-blood-700 focus:outline-none"
                  >
                    {bloodGroups.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Component Type *</label>
                  <select
                    value={formData.component_type}
                    onChange={(e) => setFormData({ ...formData, component_type: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
                  >
                    {components.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Units Required *</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={formData.units_required}
                    onChange={(e) => setFormData({ ...formData, units_required: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Required By (Date & Time) *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.required_by}
                    onChange={(e) => setFormData({ ...formData, required_by: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Indication / Notes</label>
                  <textarea
                    rows="2"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g. Pre-operative crossmatch, massive hemorrhage protocol activated"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-5 py-2 bg-blood-600 hover:bg-blood-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blood-600/30 transition disabled:opacity-50"
                >
                  {createSubmitting ? 'Submitting...' : 'Register Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Smart Fulfillment (FEFO & Compatibility Engine) */}
      {fulfillModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-xl text-white ${
                  fulfillModalData.request.urgency === 'Emergency' ? 'bg-rose-600' : 'bg-blood-600'
                }`}>
                  <Droplet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-slate-900 text-base">Blood Allocation & Issue</h3>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                      Req #{fulfillModalData.request.request_id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Patient {fulfillModalData.request.patient_ref} • {fulfillModalData.request.hospital_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFulfillModalData(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {fulfillError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                  {fulfillError}
                </div>
              )}

              {/* Requirement Summary Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Requested Blood</span>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="px-2.5 py-1 bg-blood-100 text-blood-700 font-black rounded-lg text-sm border border-blood-200">
                      {fulfillModalData.request.blood_group}
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      {fulfillModalData.request.component_type}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Target Quantity</span>
                  <span className="font-black text-slate-900 text-sm">
                    {fulfillModalData.request.units_required} unit(s)
                  </span>
                  <span className="text-slate-500 block text-[10px]">
                    ({fulfillModalData.allocations.length} already allocated)
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Compatible Groups</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {fulfillModalData.compatibility.compatible_groups.map(g => (
                      <span key={g} className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-semibold text-slate-700">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Selected Units</span>
                  <span className="font-black text-blood-600 text-sm">
                    {selectedUnitIds.length} / {fulfillModalData.request.remaining_needed}
                  </span>
                </div>
              </div>

              {/* Prior Allocations if any */}
              {fulfillModalData.allocations.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Already Dispatched Units:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {fulfillModalData.allocations.map(al => (
                      <div key={al.allocation_id} className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs flex justify-between">
                        <div>
                          <span className="font-mono font-bold text-blue-900">{al.unit_id}</span>
                          <span className="block text-[10px] text-blue-700">{al.blood_group} {al.component_type}</span>
                        </div>
                        <span className="text-[10px] text-blue-600 font-semibold self-center">Issued by {al.issued_by_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Compatible Units Selection Table (FEFO Sorted) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blood-600" />
                      <span>Smart FEFO Recommendations (Earliest Expiry First)</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Exact match prioritised first, compatible secondary, ranked by earliest expiry date
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const rec = fulfillModalData.compatibility.recommended_selection || [];
                      setSelectedUnitIds(rec);
                    }}
                    className="px-2.5 py-1 bg-blood-50 hover:bg-blood-100 text-blood-700 border border-blood-200 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-Pick Top {fulfillModalData.request.remaining_needed} FEFO</span>
                  </button>
                </div>

                {fulfillModalData.compatibility.units.length === 0 ? (
                  <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-2">
                    <XCircle className="w-8 h-8 text-rose-500 mx-auto" />
                    <p className="text-xs font-bold text-rose-900">Zero Compatible Units Available in Stock</p>
                    <p className="text-[11px] text-rose-700 max-w-sm mx-auto">
                      All matching or compatible blood units are either depleted, expired, or in quarantine. Contact partner blood banks or organize immediate donor collection.
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3">Select</th>
                          <th className="py-2.5 px-3">Unit ID</th>
                          <th className="py-2.5 px-3">Blood Group</th>
                          <th className="py-2.5 px-3">Match Type</th>
                          <th className="py-2.5 px-3">Expiry Date (FEFO)</th>
                          <th className="py-2.5 px-3">Days Left</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {fulfillModalData.compatibility.units.map(unit => {
                          const isSelected = selectedUnitIds.includes(unit.unit_id);
                          const isExact = unit.is_exact_match;

                          return (
                            <tr
                              key={unit.unit_id}
                              onClick={() => handleToggleSelectUnit(unit.unit_id)}
                              className={`cursor-pointer transition ${
                                isSelected
                                  ? 'bg-blood-50/70 border-l-4 border-l-blood-600 font-medium'
                                  : 'hover:bg-slate-50'
                              }`}
                            >
                              <td className="py-2.5 px-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelectUnit(unit.unit_id)}
                                  className="rounded text-blood-600 focus:ring-blood-500"
                                />
                              </td>

                              <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                {unit.unit_id}
                              </td>

                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-black rounded border border-slate-200">
                                  {unit.blood_group}
                                </span>
                              </td>

                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isExact
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : unit.is_universal_donor
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {unit.match_type}
                                </span>
                              </td>

                              <td className="py-2.5 px-3 font-semibold text-slate-800">
                                {unit.expires_on}
                              </td>

                              <td className="py-2.5 px-3">
                                <span className={`font-semibold ${
                                  unit.days_until_expiry <= 3 ? 'text-amber-600' : 'text-slate-600'
                                }`}>
                                  {unit.days_until_expiry} day(s)
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer with 1-click Dispatch */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Selected: <strong className="text-slate-900">{selectedUnitIds.length}</strong> unit(s)
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setFulfillModalData(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFulfillSubmit}
                  disabled={fulfillSubmitting || selectedUnitIds.length === 0}
                  className="px-5 py-2 bg-gradient-to-r from-blood-600 to-blood-500 hover:from-blood-500 hover:to-blood-600 text-white rounded-xl text-xs font-black shadow-lg shadow-blood-600/30 transition transform active:scale-95 disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {fulfillSubmitting
                      ? 'Dispatching in Transaction...'
                      : `Confirm & Issue ${selectedUnitIds.length} Unit(s)`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Reject Request */}
      {rejectRequestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900">Reject Request #{rejectRequestId}</h3>
            <p className="text-xs text-slate-500">
              Provide a documented reason why this hospital blood request cannot be fulfilled.
            </p>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Unfulfillable rare group, hospital cancelled"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setRejectRequestId(null)}
                className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
