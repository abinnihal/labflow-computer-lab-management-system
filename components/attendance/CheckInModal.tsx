import React, { useState, useEffect } from 'react';
import { getAllLabs } from '../../services/labService';
import { Lab, User } from '../../types';
import SelfieCamera from './SelfieCamera';
import { uploadSelfie } from '../../services/storageService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  // FIX: Updated signature to accept labName so we save "Programming Lab" not "l1"
  onCheckIn: (labId: string, systemNumber: number, proofUrl: string, labName: string) => Promise<void>;
  isLoading: boolean;
  user: User;
}

const CheckInModal: React.FC<Props> = ({ isOpen, onClose, onCheckIn, isLoading, user }) => {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [selectedLab, setSelectedLab] = useState('');
  const [systemNumber, setSystemNumber] = useState<string>('1');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadLabs();
      setProofImage(null);
    }
  }, [isOpen]);

  const loadLabs = async () => {
    try {
      const data = await getAllLabs();
      setLabs(data);
      // Default to the first lab if available
      if (data.length > 0) setSelectedLab(data[0].id);
    } catch (error) {
      console.error("Failed to load labs", error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedLab || !proofImage || !systemNumber) return;

    setUploading(true);
    try {
      const url = await uploadSelfie(proofImage);

      // FIX: Find the human-readable lab name
      const selectedLabObj = labs.find(l => l.id === selectedLab);
      const labName = selectedLabObj ? selectedLabObj.name : selectedLab;

      // Pass labName to the parent component
      await onCheckIn(selectedLab, parseInt(systemNumber), url, labName);
    } catch (error) {
      alert("Upload failed. Please check internet connection.");
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Lab Check-In</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Verify your presence</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Select Lab</label>
              <select
                value={selectedLab}
                onChange={(e) => setSelectedLab(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                {labs.length === 0 && <option value="">Loading labs...</option>}
                {labs.map(lab => <option key={lab.id} value={lab.id}>{lab.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">System Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fa-solid fa-desktop text-slate-400"></i>
                </div>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={systemNumber}
                  onChange={(e) => setSystemNumber(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="e.g. 15"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-700 my-4"></div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex justify-between">
              <span>Selfie Verification</span>
              <span className="text-red-500 text-[10px]">* Required</span>
            </label>
            <SelfieCamera onCapture={setProofImage} onRetake={() => setProofImage(null)} />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={handleSubmit}
            disabled={isLoading || uploading || !proofImage || !systemNumber}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {isLoading || uploading ? (
              <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Verifying...</>
            ) : (
              <><i className="fa-solid fa-check-circle"></i> Confirm Presence</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckInModal;