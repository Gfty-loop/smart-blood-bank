import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
  Droplet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Heart,
  Calendar,
  Activity,
  User,
  ShieldAlert,
  ArrowRight,
  FileCheck
} from 'lucide-react';

export default function DonationScreening() {
  const [donors, setDonors] = useState([]);
  const [selectedDonorId, setSelectedDonorId] = useState('');
  const [donorData, setDonorData] = useState(null);

  // Screening / Vitals State
  const [hemoglobin, setHemoglobin] = useState('13.5');
  const [bp, setBp] = useState('120/80');
  const [feelingWell, setFeelingWell] = useState(true);
  const [recentIllness, setRecentIllness] = useState(false);
  const [recentSurgery, setRecentSurgery] = useState(false);
  const [medications, setMedications] = useState(false);

  // Donation collection state
  const [componentType, setComponentType] = useState('Whole Blood');
  const [volumeMl, setVolumeMl] = useState(450);
  const [testStatus, setTestStatus] = useState('Passed');
  const [notes, setNotes] = useState('');

  // Eligibility evaluation state
  const [eligibilityResult, setEligibilityResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch donors list
  useEffect(() => {
    api.get('/donors').then(res => {
      setDonors(res.data.donors || []);
    }).catch(err => console.error(err));
  }, []);

  // When donor selected, load full donor details
  useEffect(() => {
    if (!selectedDonorId) {
      setDonorData(null);
      setEligibilityResult(null);
      return;
    }

    const donor = donors.find(d => String(d.donor_id) === String(selectedDonorId));
    if (donor) {
      setDonorData(donor);
    }
  }, [selectedDonorId, donors]);

  // Recalculate eligibility whenever vitals, questions, or donor changes
  useEffect(() => {
    if (!donorData) return;

    api.post('/donors/check-eligibility', {
      dob: donorData.dob,
      weight_kg: donorData.weight_kg,
      hemoglobin,
      last_donation_date: donorData.last_donation_date,
      feeling_well: feelingWell,
      recent_illness: recentIllness,
      recent_surgery: recentSurgery,
      on_antibiotics_or_meds: medications
    }).then(res => {
      setEligibilityResult(res.data);
    }).catch(err => console.error(err));
  }, [donorData, hemoglobin, feelingWell, recentIllness, recentSurgery, medications]);

  const handleSubmitDonation = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessInfo(null);
    setSubmitting(true);

    try {
      const res = await api.post('/donations', {
        donor_id: selectedDonorId,
        donation_date: new Date().toISOString().split('T')[0],
        component_type: componentType,
        volume_ml: volumeMl,
        hemoglobin: parseFloat(hemoglobin),
        bp,
        test_status: testStatus,
        notes,
        override_eligibility: !eligibilityResult?.is_eligible
      });

      setSuccessInfo(res.data);
      // Refresh donors
      const donorsRes = await api.get('/donors');
      setDonors(donorsRes.data.donors || []);
    } catch (err) {
      setErrorMessage(err.response?.data?.error || err.response?.data?.reasons?.join(', ') || 'Failed to record donation.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSuccessInfo(null);
    setSelectedDonorId('');
    setDonorData(null);
    setEligibilityResult(null);
    setNotes('');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
          <Droplet className="w-6 h-6 text-blood-600" />
          <span>Donor Eligibility Screening & Collection</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Enforce automated 90-day intervals, weight & haemoglobin thresholds, questionnaire pass/fail, and create inventory units
        </p>
      </div>

      {successInfo ? (
        <div className="bg-white rounded-2xl border border-emerald-200 p-8 shadow-lg text-center space-y-4 animate-fade-in">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Donation Successfully Cataloged</span>
            <h2 className="text-2xl font-black text-slate-900 mt-1">Blood Unit Generated</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Collected from {donorData?.name} ({donorData?.blood_group}). Unit has been added to inventory under status <strong className="text-slate-800">{successInfo.unit.status}</strong>.
            </p>
          </div>

          <div className="max-w-md mx-auto bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Assigned Unit ID</span>
              <span className="font-mono font-black text-blood-600 text-sm">{successInfo.unit.unit_id}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Blood Group & Component</span>
              <span className="font-bold text-slate-800">{successInfo.unit.blood_group} • {successInfo.unit.component_type}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Collection Date</span>
              <span className="font-semibold text-slate-800">{successInfo.unit.collected_on}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Calculated Expiry</span>
              <span className="font-semibold text-rose-600">{successInfo.unit.expires_on}</span>
            </div>
          </div>

          <div className="pt-2 flex justify-center space-x-3">
            <button
              onClick={resetForm}
              className="px-5 py-2.5 bg-blood-600 hover:bg-blood-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blood-600/30 transition"
            >
              Screen Another Donor
            </button>
            <a
              href="/inventory"
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
            >
              View in Inventory Table
            </a>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmitDonation} className="space-y-6">
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Donor Selection & Current Stats */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
              <User className="w-4 h-4 text-blood-600" />
              <span>Step 1: Select Donor for Screening</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Search & Select Donor *</label>
                <select
                  required
                  value={selectedDonorId}
                  onChange={(e) => setSelectedDonorId(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500 font-medium"
                >
                  <option value="">-- Choose Registered Donor --</option>
                  {donors.map((d) => (
                    <option key={d.donor_id} value={d.donor_id}>
                      {d.name} ({d.blood_group}) • Last: {d.last_donation_date || 'Never'} • {d.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New to blood bank?</label>
                <a
                  href="/donors"
                  className="inline-block w-full py-2.5 text-center text-xs font-bold text-blood-600 bg-blood-50 hover:bg-blood-100 border border-blood-200 rounded-xl transition"
                >
                  + Register New Donor First
                </a>
              </div>
            </div>

            {donorData && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Blood Group</span>
                  <span className="font-black text-blood-700 text-sm">{donorData.blood_group}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Age</span>
                  <span className="font-bold text-slate-800">{eligibilityResult?.age || '—'} years</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Weight</span>
                  <span className="font-bold text-slate-800">{donorData.weight_kg} kg</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Last Donation</span>
                  <span className="font-bold text-slate-800">{donorData.last_donation_date || 'First-time donor'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Clinical Vitals & Medical Screening Questionnaire */}
          {donorData && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blood-600" />
                <span>Step 2: Medical Vitals & Health Questionnaire</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Haemoglobin Level (g/dL) * <span className="text-slate-400 font-normal">(Min threshold: 12.5 g/dL)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={hemoglobin}
                    onChange={(e) => setHemoglobin(e.target.value)}
                    placeholder="e.g. 13.5"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Blood Pressure (BP) * <span className="text-slate-400 font-normal">(Systolic/Diastolic)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bp}
                    onChange={(e) => setBp(e.target.value)}
                    placeholder="120/80"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500 font-medium"
                  />
                </div>
              </div>

              {/* Health Questionnaire Checklist */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Screening Checklist (Mandatory Clinical Questions)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center space-x-2.5 p-2 bg-white rounded-lg border border-slate-200/70 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={feelingWell}
                      onChange={(e) => setFeelingWell(e.target.checked)}
                      className="rounded text-blood-600 focus:ring-blood-500"
                    />
                    <span className="text-slate-700 font-medium">Donor feels completely well and fit today</span>
                  </label>

                  <label className="flex items-center space-x-2.5 p-2 bg-white rounded-lg border border-slate-200/70 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recentIllness}
                      onChange={(e) => setRecentIllness(e.target.checked)}
                      className="rounded text-blood-600 focus:ring-blood-500"
                    />
                    <span className="text-slate-700 font-medium">Recent fever, infection or illness in last 14d</span>
                  </label>

                  <label className="flex items-center space-x-2.5 p-2 bg-white rounded-lg border border-slate-200/70 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recentSurgery}
                      onChange={(e) => setRecentSurgery(e.target.checked)}
                      className="rounded text-blood-600 focus:ring-blood-500"
                    />
                    <span className="text-slate-700 font-medium">Major dental or surgical procedure in last 6 mos</span>
                  </label>

                  <label className="flex items-center space-x-2.5 p-2 bg-white rounded-lg border border-slate-200/70 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={medications}
                      onChange={(e) => setMedications(e.target.checked)}
                      className="rounded text-blood-600 focus:ring-blood-500"
                    />
                    <span className="text-slate-700 font-medium">Currently taking prescription antibiotics</span>
                  </label>
                </div>
              </div>

              {/* Automatic Eligibility Decision Box */}
              {eligibilityResult && (
                <div className={`p-4 rounded-xl border ${
                  eligibilityResult.is_eligible
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-rose-50 border-rose-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {eligibilityResult.is_eligible ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-600" />
                      )}
                      <div>
                        <h4 className={`text-xs font-black uppercase tracking-wider ${
                          eligibilityResult.is_eligible ? 'text-emerald-900' : 'text-rose-900'
                        }`}>
                          {eligibilityResult.is_eligible
                            ? 'ELIGIBILITY CHECK PASSED: Cleared for Collection'
                            : 'ELIGIBILITY CHECK FAILED: Temporary Deferral Required'}
                        </h4>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Age: {eligibilityResult.age}y (Req: 18-65) • Weight: {donorData.weight_kg}kg (Req: ≥50kg) • Hb: {hemoglobin} g/dL (Req: ≥12.5)
                        </p>
                      </div>
                    </div>

                    {!eligibilityResult.is_eligible && (
                      <span className="text-xs font-bold text-rose-700 bg-white px-2.5 py-1 rounded-lg border border-rose-200">
                        Next Eligible: {eligibilityResult.next_eligible_date}
                      </span>
                    )}
                  </div>

                  {eligibilityResult.reasons.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-rose-200/80">
                      <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Deferral Grounds:</span>
                      <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs text-rose-700 font-medium">
                        {eligibilityResult.reasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Section 3: Donation Collection & Unit Generation */}
          {donorData && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-blood-600" />
                <span>Step 3: Blood Collection Details</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Component to Collect *</label>
                  <select
                    value={componentType}
                    onChange={(e) => setComponentType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500 font-medium"
                  >
                    <option value="Whole Blood">Whole Blood (Shelf Life: 42 days)</option>
                    <option value="Red Blood Cells">Red Blood Cells (RBC) (Shelf Life: 42 days)</option>
                    <option value="Platelets">Platelets (Shelf Life: 5 days)</option>
                    <option value="Plasma">Fresh Frozen Plasma (Shelf Life: 365 days)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Volume (ml) *</label>
                  <select
                    value={volumeMl}
                    onChange={(e) => setVolumeMl(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500 font-medium"
                  >
                    <option value="450">450 ml (Standard adult whole blood bag)</option>
                    <option value="350">350 ml (Small collection bag)</option>
                    <option value="300">300 ml (Apheresis Platelets)</option>
                    <option value="500">500 ml (Plasma collection)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Testing / Screening Status *</label>
                  <select
                    value={testStatus}
                    onChange={(e) => setTestStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500 font-bold text-slate-800"
                  >
                    <option value="Passed">Passed (Immediately Available in Stock)</option>
                    <option value="Pending">Pending (Placed in Quarantine awaiting Lab)</option>
                    <option value="Failed">Failed / Reactive (Auto Discarded)</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phlebotomy Notes & Observations</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Left antecubital fossa, collection completed in 7 mins with no adverse reaction"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blood-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  {!eligibilityResult?.is_eligible && (
                    <span className="text-xs font-semibold text-rose-600 flex items-center space-x-1">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Warning: Submitting will record donation under medical override exception.</span>
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-blood-600 hover:bg-blood-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-blood-600/30 transition transform active:scale-95 disabled:opacity-50 flex items-center space-x-2"
                >
                  <span>{submitting ? 'Cataloging Unit...' : 'Confirm Collection & Generate Unit'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
