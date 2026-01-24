import React, { useState, useEffect } from 'react';
// FIX: Import from labService, not bookingService
import { getAllLabs } from '../../services/labService';
import { Lab } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCheckIn: (labId: string, systemNumber: number) => void;
  isLoading: boolean;
}

const CheckInModal: React.FC<Props> = ({ isOpen, onClose, onCheckIn, isLoading }) => {
  // 1. Add State for Labs
  const [labs, setLabs] = useState<Lab[]>([]);
  const [selectedLab, setSelectedLab] = useState('');
  const [systemNumber, setSystemNumber] = useState<string>('');
  const [loadingLabs, setLoadingLabs] = useState(true);

  // 2. Fetch Labs from DB
  useEffect(() => {
    const fetchLabs = async () => {
      try {
        const data = await getAllLabs();
        setLabs(data);
        if (data.length > 0) {
          setSelectedLab(data[0].id);
        }
      } catch (error) {
        console.error("Failed to load labs", error);
      } finally {
        setLoadingLabs(false);
      }
    };

    if (isOpen) {
      fetchLabs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!selectedLab || !systemNumber) return;
    onCheckIn(selectedLab, parseInt(systemNumber));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md animate-fade-in-up overflow-hidden transition-colors">
        <div className="bg-green-600 p-6 text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <i className="fa-solid fa-right-to-bracket"></i> Lab Check-In
          </h2>
          <p className="text-green-100 text-sm">Please verify your workstation location.</p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Select Lab</label>
            {loadingLabs ? (
              <div className="text-sm text-slate-500 animate-pulse">Loading labs...</div>
            ) : (
              <select
                value={selectedLab}
                onChange={(e) => setSelectedLab(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
              >
                {labs.map(lab => (
                  <option key={lab.id} value={lab.id}>{lab.name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">System Number</label>
            <div className="relative">
              <i className="fa-solid fa-desktop absolute left-3 top-3 text-slate-400"></i>
              <input
                type="number"
                min="1"
                max="100"
                value={systemNumber}
                onChange={(e) => setSystemNumber(e.target.value)}
                placeholder="e.g. 12"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Look for the sticker on your CPU or Monitor.</p>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading || !systemNumber || loadingLabs}
              className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-md disabled:opacity-70 flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
              Confirm Check-In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckInModal;