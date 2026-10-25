import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Plus,
  History,
  X,
  Send,
  AlertCircle
} from 'lucide-react';

export default function Hospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Hospital Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Hospital History Modal
  const [selectedHospitalHistory, setSelectedHospitalHistory] = useState(null);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/hospitals');
      setHospitals(res.data.hospitals || []);
    } catch (err) {
      console.error('Failed to load hospitals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const handleCreateHospital = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      await api.post('/hospitals', formData);
      setShowAddModal(false);
      setFormData({ name: '', contact_person: '', phone: '', email: '', address: '' });
      fetchHospitals();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to add hospital.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenHistory = async (hospitalId) => {
    try {
      const res = await api.get(`/hospitals/${hospitalId}/history`);
      setSelectedHospitalHistory(res.data);
    } catch (err) {
      console.error('Failed to load hospital request history:', err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-blood-600" />
            <span>Hospital Partners & Procurement</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Partner hospital accounts, authorized contact coordinators, and historical transfusion dispatches
          </p>
        </div>

        <button
          onClick={() => {
            setFormError('');
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 bg-blood-600 hover:bg-blood-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blood-600/30 flex items-center space-x-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Hospital</span>
        </button>
      </div>

      {/* Hospital Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-slate-400 text-xs">
            Loading hospital directory...
          </div>
        ) : hospitals.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-slate-400 text-xs">
            No partner hospitals registered.
          </div>
        ) : (
          hospitals.map((h) => (
            <div
              key={h.hospital_id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>

                  {h.pending_requests > 0 ? (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold text-[10px] rounded-full border border-rose-200">
                      {h.pending_requests} Active Request(s)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-full font-semibold">
                      All Orders Fulfilled
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-sm text-slate-900 mt-3">{h.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Coord: {h.contact_person || 'Clinical Liaison'}</p>

                <div className="space-y-1.5 mt-4 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{h.phone}</span>
                  </div>
                  {h.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{h.email}</span>
                    </div>
                  )}
                  {h.address && (
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                      <span className="text-[11px] text-slate-500">{h.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  {h.total_requests || 0} Total Orders
                </span>
                <button
                  onClick={() => handleOpenHistory(h.hospital_id)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition flex items-center space-x-1"
                >
                  <History className="w-3 h-3" />
                  <span>Order History</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal 1: Register Hospital */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-blood-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">Register Partner Hospital</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateHospital} className="p-6 space-y-3.5">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hospital / Clinic Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. St. Jude Memorial Hospital"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person / Liaison</label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  placeholder="e.g. Dr. Aris Thorne (Blood Bank Coord)"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (Emergency / Orders) *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1-555-0101"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="orders@hospital.org"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Address / Dispatch Delivery Dock</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Hospital Ave, Delivery Bay 2"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blood-600 hover:bg-blood-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blood-600/30 transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Hospital'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Hospital Request & Allocation History */}
      {selectedHospitalHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  {selectedHospitalHistory.hospital.name}
                </h3>
                <p className="text-xs text-slate-500">Transfusion Request & Dispatch History</p>
              </div>
              <button
                onClick={() => setSelectedHospitalHistory(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {selectedHospitalHistory.requests.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No requests recorded from this hospital yet.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Req ID</th>
                        <th className="py-2.5 px-3">Patient</th>
                        <th className="py-2.5 px-3">Blood Group</th>
                        <th className="py-2.5 px-3">Units</th>
                        <th className="py-2.5 px-3">Urgency</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedHospitalHistory.requests.map((r) => (
                        <tr key={r.request_id}>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800">#{r.request_id}</td>
                          <td className="py-2.5 px-3 font-medium">{r.patient_ref}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 bg-blood-50 text-blood-700 font-bold rounded">
                              {r.blood_group} {r.component_type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-bold">{r.allocated_count} / {r.units_required}</td>
                          <td className="py-2.5 px-3 font-semibold">{r.urgency}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.status === 'Fulfilled' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedHospitalHistory(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
