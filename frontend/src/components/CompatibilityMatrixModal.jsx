import React, { useState } from 'react';
import { X, Check, Droplets, Info } from 'lucide-react';

const RED_CELL_MATRIX = [
  { recipient: 'O-', canReceive: ['O-'], universal: true },
  { recipient: 'O+', canReceive: ['O+', 'O-'], universal: false },
  { recipient: 'A-', canReceive: ['A-', 'O-'], universal: false },
  { recipient: 'A+', canReceive: ['A+', 'A-', 'O+', 'O-'], universal: false },
  { recipient: 'B-', canReceive: ['B-', 'O-'], universal: false },
  { recipient: 'B+', canReceive: ['B+', 'B-', 'O+', 'O-'], universal: false },
  { recipient: 'AB-', canReceive: ['AB-', 'A-', 'B-', 'O-'], universal: false },
  { recipient: 'AB+', canReceive: ['All Groups (O-, O+, A-, A+, B-, B+, AB-, AB+)'], universal: true, note: 'Universal Recipient' }
];

const PLASMA_MATRIX = [
  { recipient: 'O-', canReceive: ['All Groups (Universal Recipient for Plasma)'], note: 'Universal Recipient' },
  { recipient: 'O+', canReceive: ['All Groups (Universal Recipient for Plasma)'], note: 'Universal Recipient' },
  { recipient: 'A-', canReceive: ['A-', 'AB-'] },
  { recipient: 'A+', canReceive: ['A+', 'A-', 'AB+', 'AB-'] },
  { recipient: 'B-', canReceive: ['B-', 'AB-'] },
  { recipient: 'B+', canReceive: ['B+', 'B-', 'AB+', 'AB-'] },
  { recipient: 'AB-', canReceive: ['AB-'] },
  { recipient: 'AB+', canReceive: ['AB+', 'AB-'], note: 'AB is Universal Plasma Donor' }
];

export default function CompatibilityMatrixModal({ isOpen, onClose }) {
  const [tab, setTab] = useState('redcell');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blood-100 text-blood-600 rounded-xl">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Blood Compatibility Matrix</h3>
              <p className="text-xs text-slate-500">Transfusion matching rules enforced by SBBMS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 px-6 pt-3 space-x-4 bg-white">
          <button
            onClick={() => setTab('redcell')}
            className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center space-x-2 ${
              tab === 'redcell'
                ? 'border-blood-600 text-blood-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Red Blood Cells & Whole Blood</span>
          </button>
          <button
            onClick={() => setTab('plasma')}
            className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center space-x-2 ${
              tab === 'plasma'
                ? 'border-blood-600 text-blood-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Plasma Transfusion (Reverse)</span>
          </button>
        </div>

        {/* Content Table */}
        <div className="p-6 overflow-y-auto flex-1">
          {tab === 'redcell' ? (
            <div>
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                <div>
                  <span className="font-semibold">Red Cell Rule:</span> <strong>O-</strong> is the Universal Donor (can be given to any patient in emergency trauma). <strong>AB+</strong> is the Universal Recipient. FEFO allocation prioritizes exact match first, then compatible.
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Patient (Recipient)</th>
                      <th className="py-2.5 px-4">Can Receive From</th>
                      <th className="py-2.5 px-4">Clinical Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {RED_CELL_MATRIX.map((row) => (
                      <tr key={row.recipient} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          <span className="inline-block px-2.5 py-0.5 bg-slate-100 rounded-md border border-slate-300">
                            {row.recipient}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex flex-wrap gap-1.5">
                            {row.canReceive.map((g, i) => (
                              <span
                                key={i}
                                className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  g === 'O-'
                                    ? 'bg-rose-100 text-rose-700 font-semibold'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {g}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-xs text-slate-500">
                          {row.note || (row.recipient === 'O-' ? 'O- can only receive O-' : 'Standard compatibility')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <span className="font-semibold">Plasma Transfusion Rule:</span> Plasma contains antibodies rather than antigens, reversing compatibility. <strong>AB</strong> donors are Universal Plasma Donors, and <strong>O</strong> recipients can receive plasma from any group.
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Patient (Recipient)</th>
                      <th className="py-2.5 px-4">Compatible Plasma Donors</th>
                      <th className="py-2.5 px-4">Clinical Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {PLASMA_MATRIX.map((row) => (
                      <tr key={row.recipient} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          <span className="inline-block px-2.5 py-0.5 bg-slate-100 rounded-md border border-slate-300">
                            {row.recipient}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex flex-wrap gap-1.5">
                            {row.canReceive.map((g, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-xs font-medium"
                              >
                                {g}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-xs text-slate-500">
                          {row.note || 'Reverse pattern applies'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-xl transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
