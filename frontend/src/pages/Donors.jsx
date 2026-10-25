import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
  Users,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  XCircle,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Heart,
  Droplet,
  History,
  X,
  AlertCircle
} from 'lucide-react';

export default function Donors() {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDonorDetail, setSelectedDonorDetail] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // New Donor Form State
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    gender: 'Male',
    blood_group: 'O+',
    phone: '',
    email: '',
    address: '',
    weight_kg: '65'
  });
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Live eligibility screening calculation while typing in registration modal
  const [liveEligibility, setLiveEligibility] = useState(null);

  const bloodGroups = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

  const fetchDonors = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedGroup) params.blood_group = selectedGroup;

      const res = await api.get('/donors', { params });
      setDonors(res.data.donors || []);
    } catch (err) {
      console.error('Failed to load donors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, [selectedGroup]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDonors();
  };

  // Run live eligibility test when dob or weight changes in the registration form
  useEffect(() => {
    if (formData.dob && formData.weight_kg) {
      api.post('/donors/check-eligibility', {
        dob: formData.dob,
        weight_kg: formData.weight_kg,
        last_donation_date: null
      }).then(res => {
        setLiveEligibility(res.data);
      }).catch(err => console.error(err));
    } else {
      setLiveEligibility(null);
    }
  }, [formData.dob, formData.weight_kg]);

  const handleCreateDonor = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      await api.post('/donors', formData);
      setShowAddModal(false);
      setFormData({
        name: '',
        dob: '',
        gender: 'Male',
        blood_group: 'O+',
        phone: '',
        email: '',
        address: '',
        weight_kg: '65'
      });
      fetchDonors();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to register donor.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleOpenDetail = async (donorId) => {
    setHistoryLoading(true);
    setSelectedDonorDetail(null);
    try {
      const res = await api.get(`/donors/${donorId}`);
      setSelectedDonorDetail(res.data);
    } catch (err) {
      console.error('Failed to fetch donor details:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Users className="w-6 h-6 text-blood-600" />
            <span>Donor Registry & Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain donor medical profiles, track donation intervals, and enforce eligibility rules
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
          <span>Register New Donor</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search donors by full name, phone number, or email..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500 focus:bg-white transition"
          />
        </form>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-blood-500"
          >
            <option value="">All Blood Groups</option>
            {bloodGroups.map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>

          <button
            onClick={fetchDonors}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition"
          >
            Filter
          </button>
        </div>
      </div>

      {/* Donors Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Donor Name</th>
                <th className="py-3 px-4">Blood Group</th>
                <th className="py-3 px-4">Age / Gender</th>
                <th className="py-3 px-4">Weight</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Last Donation</th>
                <th className="py-3 px-4">Current Eligibility</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    Loading registered donors...
                  </td>
                </tr>
              ) : donors.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No donors found matching criteria.
                  </td>
                </tr>
              ) : (
                donors.map((d) => (
                  <tr key={d.donor_id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                          {d.name.charAt(0)}
                        </div>
                        <div>
                          <span>{d.name}</span>
                          <span className="block text-[10px] text-slate-400 font-normal">ID #{d.donor_id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 bg-blood-50 text-blood-700 font-black rounded-lg border border-blood-200">
                        {d.blood_group}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {d.age !== null ? `${d.age} yrs` : '—'} • {d.gender}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {d.weight_kg} kg
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center space-x-1 text-slate-700">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{d.phone}</span>
                      </div>
                      {d.email && (
                        <div className="flex items-center space-x-1 text-slate-500 text-[10px] mt-0.5 truncate max-w-[150px]">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{d.email}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {d.last_donation_date ? (
                        <div>
                          <div className="font-semibold text-slate-800">{d.last_donation_date}</div>
                          <div className="text-[10px] text-slate-400">Recorded</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">First-time donor</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {d.is_eligible ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Eligible</span>
                        </span>
                      ) : (
                        <div>
                          <span
                            className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200 cursor-help"
                            title={d.eligibility_reasons?.join('\n')}
                          >
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Ineligible</span>
                          </span>
                          {d.next_eligible_date && (
                            <span className="block text-[10px] text-slate-500 mt-0.5">
                              Next: {d.next_eligible_date}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(d.donor_id)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition"
                      >
                        Profile & History
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Register New Donor */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blood-100 text-blood-600 rounded-xl">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Register New Donor</h3>
                  <p className="text-xs text-slate-500">Enter personal and medical parameters</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDonor} className="p-6 overflow-y-auto space-y-4 flex-1">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Jane Doe"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group *</label>
                  <select
                    value={formData.blood_group}
                    onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold text-blood-700 focus:outline-none focus:border-blood-500"
                  >
                    {bloodGroups.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Body Weight (kg) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formData.weight_kg}
                    onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                    placeholder="≥ 50 kg"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1-555-0199"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="donor@example.com"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Residential Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street, City, Postal Code"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500"
                  />
                </div>
              </div>

              {/* Real-time eligibility feedback during registration */}
              {liveEligibility && (
                <div className={`p-3 rounded-xl border text-xs ${
                  liveEligibility.is_eligible
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <div className="font-bold flex items-center space-x-1.5 mb-1">
                    {liveEligibility.is_eligible ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Pre-Screening: Eligible to Donate (Age: {liveEligibility.age} yrs)</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>Pre-Screening Deferral: Ineligible</span>
                      </>
                    )}
                  </div>
                  {liveEligibility.reasons.length > 0 && (
                    <ul className="list-disc list-inside text-[11px] space-y-0.5 text-rose-700">
                      {liveEligibility.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

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
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-blood-600 hover:bg-blood-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blood-600/30 transition disabled:opacity-50"
                >
                  {formSubmitting ? 'Registering...' : 'Save & Register Donor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Donor Profile & Donation History */}
      {selectedDonorDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blood-100 text-blood-700 flex items-center justify-center font-black text-sm">
                  {selectedDonorDetail.donor.blood_group}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">{selectedDonorDetail.donor.name}</h3>
                  <p className="text-xs text-slate-500">Donor Profile & Transfusion Audit Trail</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDonorDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Eligibility card */}
              <div className={`p-4 rounded-xl border ${
                selectedDonorDetail.eligibility.is_eligible
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : 'bg-rose-50/70 border-rose-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {selectedDonorDetail.eligibility.is_eligible ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600" />
                    )}
                    <span className="font-black text-xs uppercase tracking-wider">
                      {selectedDonorDetail.eligibility.is_eligible ? 'Eligible for Donation' : 'Currently Ineligible'}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-700">
                    Next Date: {selectedDonorDetail.eligibility.next_eligible_date}
                  </span>
                </div>

                {selectedDonorDetail.eligibility.reasons.length > 0 && (
                  <div className="mt-2 text-xs text-rose-700">
                    <p className="font-semibold mb-0.5">Eligibility Deferral Details:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                      {selectedDonorDetail.eligibility.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Personal Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Age</span>
                  <span className="font-bold text-slate-800">{selectedDonorDetail.eligibility.age} years</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Weight</span>
                  <span className="font-bold text-slate-800">{selectedDonorDetail.donor.weight_kg} kg</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Gender</span>
                  <span className="font-bold text-slate-800">{selectedDonorDetail.donor.gender}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Phone</span>
                  <span className="font-bold text-slate-800">{selectedDonorDetail.donor.phone}</span>
                </div>
              </div>

              {/* Donation History Table */}
              <div>
                <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                  <History className="w-3.5 h-3.5 text-blood-600" />
                  <span>Donation History ({selectedDonorDetail.donations.length})</span>
                </h4>

                {selectedDonorDetail.donations.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                    No past donations recorded yet for this donor.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Component</th>
                          <th className="py-2.5 px-3">Volume</th>
                          <th className="py-2.5 px-3">Hb / BP</th>
                          <th className="py-2.5 px-3">Unit ID</th>
                          <th className="py-2.5 px-3">Unit Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedDonorDetail.donations.map((don) => (
                          <tr key={don.donation_id}>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">{don.donation_date}</td>
                            <td className="py-2.5 px-3">{don.component_type}</td>
                            <td className="py-2.5 px-3 font-mono">{don.volume_ml} ml</td>
                            <td className="py-2.5 px-3">{don.hemoglobin} g/dL • {don.bp}</td>
                            <td className="py-2.5 px-3 font-mono font-semibold text-blood-600">{don.unit_id || '—'}</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                don.unit_status === 'Available'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : don.unit_status === 'Issued'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {don.unit_status || 'Archived'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedDonorDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
