
import React, { useState, useEffect } from 'react';
import { User, Booking, UserRole } from '../../types';
import { getLabs, checkConflict, createBooking, updateBooking, ConflictResult } from '../../services/bookingService';
import TerminalLoader from '../ui/TerminalLoader';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSuccess?: () => void;
  bookingToEdit?: Booking | null;
}

const BookingModal: React.FC<Props> = ({ isOpen, onClose, user, onSuccess, bookingToEdit }) => {
  const labs = getLabs();
  const [step, setStep] = useState<'FORM' | 'CONFIRM' | 'CONFLICT'>('FORM');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    subject: '',
    labId: labs[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '11:00',
    systemCount: 30,
    reminder: true
  });

  const [conflictResult, setConflictResult] = useState<ConflictResult | null>(null);

  useEffect(() => {
    if (bookingToEdit) {
      const start = new Date(bookingToEdit.startTime);
      const end = new Date(bookingToEdit.endTime);
      setFormData({
        subject: bookingToEdit.subject,
        labId: bookingToEdit.labId,
        date: start.toISOString().split('T')[0],
        startTime: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        endTime: end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        systemCount: bookingToEdit.systemCount || 30,
        reminder: bookingToEdit.reminder || false
      });
    } else {
        // Reset defaults on new booking
        setFormData({
            subject: '',
            labId: labs[0]?.id || '',
            date: new Date().toISOString().split('T')[0],
            startTime: '09:00',
            endTime: '11:00',
            systemCount: 30,
            reminder: true
        });
        setStep('FORM');
    }
  }, [bookingToEdit, isOpen]);

  if (!isOpen) return null;

  const handleCheckConflict = () => {
    setLoading(true);
    setTimeout(() => {
        const result = checkConflict({
            ...formData,
            userId: user.id,
            userName: user.name,
            userRole: user.role
        }, bookingToEdit?.id); // Pass ID to exclude self if editing
        
        setConflictResult(result);
        setLoading(false);
        
        if (result.hasConflict) {
            setStep('CONFLICT');
        } else {
            setStep('CONFIRM');
        }
    }, 1500);
  };

  const executeBooking = (isOverride: boolean = false) => {
      setLoading(true);
      setTimeout(() => {
          try {
            if (bookingToEdit) {
                updateBooking(bookingToEdit.id, {
                ...formData,
                userId: user.id, // Keeping original owner might be better, but for edit keeping simple
                userName: user.name,
                userRole: user.role
                }, user.id, user.name);
            } else {
                createBooking({
                ...formData,
                userId: user.id,
                userName: user.name,
                userRole: user.role
                }, isOverride);
            }
            
            setLoading(false);
            if (onSuccess) onSuccess();
            onClose();
            // Reset
            setStep('FORM');
            setConflictResult(null);
          } catch (error: any) {
            setLoading(false);
            setConflictResult({ hasConflict: true, message: error.message });
            setStep('CONFLICT');
          }
      }, 1500);
  };

  const isMaintenance = conflictResult?.message?.toLowerCase().includes('maintenance');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className={`p-6 text-white flex justify-between items-center shrink-0 ${isMaintenance ? 'bg-gradient-to-r from-orange-600 to-red-600' : 'bg-gradient-to-r from-blue-600 to-indigo-700'}`}>
            <div>
                <h2 className="text-xl font-bold">{bookingToEdit ? 'Edit Session' : 'Book Lab Session'}</h2>
                <p className="text-white/80 text-sm">{bookingToEdit ? 'Modify details or view logs' : 'Schedule a lab for your class'}</p>
            </div>
            <button onClick={onClose} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors">
                <i className="fa-solid fa-xmark"></i>
            </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-4">
                    <TerminalLoader />
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Processing request...</p>
                </div>
            ) : (
            <>
            {step === 'FORM' && (
                <div className="space-y-4 animate-fade-in-up">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Class / Subject Name</label>
                        <input 
                            type="text" 
                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            placeholder="e.g. Advanced Java Lab"
                            value={formData.subject}
                            onChange={e => setFormData({...formData, subject: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Lab</label>
                            <select 
                                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                value={formData.labId}
                                onChange={e => setFormData({...formData, labId: e.target.value})}
                            >
                                {labs.map(lab => (
                                    <option key={lab.id} value={lab.id}>{lab.name} (Cap: {lab.capacity})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Systems Needed</label>
                            <input 
                                type="number" 
                                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                value={formData.systemCount}
                                onChange={e => setFormData({...formData, systemCount: parseInt(e.target.value)})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                        <input 
                            type="date" 
                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            value={formData.date}
                            onChange={e => setFormData({...formData, date: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
                            <input 
                                type="time" 
                                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                value={formData.startTime}
                                onChange={e => setFormData({...formData, startTime: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">End Time</label>
                            <input 
                                type="time" 
                                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                value={formData.endTime}
                                onChange={e => setFormData({...formData, endTime: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input 
                            type="checkbox" 
                            id="reminder" 
                            checked={formData.reminder}
                            onChange={e => setFormData({...formData, reminder: e.target.checked})}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-600 focus:ring-blue-500 dark:bg-slate-700"
                        />
                        <label htmlFor="reminder" className="text-sm text-slate-700 dark:text-slate-300">Set a reminder 15 mins before</label>
                    </div>

                    <button 
                        onClick={handleCheckConflict}
                        disabled={!formData.subject}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 dark:shadow-none transition-all mt-4 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <i className="fa-solid fa-magnifying-glass"></i>
                        Check Availability
                    </button>
                </div>
            )}

            {step === 'CONFLICT' && (
                <div className="text-center space-y-6 animate-fade-in-up">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto animate-shake ${isMaintenance ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                        <i className={`fa-solid ${isMaintenance ? 'fa-screwdriver-wrench' : 'fa-triangle-exclamation'}`}></i>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">{isMaintenance ? 'Maintenance Undergoing' : 'Booking Issue Detected'}</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-xs mx-auto">{conflictResult?.message}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <button 
                            onClick={() => { setStep('FORM'); setConflictResult(null); }}
                            className="w-full border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            {isMaintenance ? 'Select Another Lab / Time' : 'Change Time/Date'}
                        </button>
                        
                        {user.role === UserRole.ADMIN && !isMaintenance && (
                            <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-2">
                                <p className="text-xs text-red-500 font-bold uppercase mb-2">Admin Actions</p>
                                <button 
                                    onClick={() => executeBooking(true)}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                    <i className="fa-solid fa-gavel"></i> Override & Force Book
                                </button>
                                <p className="text-[10px] text-slate-400 mt-2">This will double-book the lab. The conflicting user will be notified.</p>
                            </div>
                        )}
                        {/* Allow Admin to override maintenance too if needed, but keeping it strict for now for Faculty */}
                        {user.role === UserRole.ADMIN && isMaintenance && (
                             <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-2">
                                <p className="text-xs text-orange-500 font-bold uppercase mb-2">Admin Privilege</p>
                                <button 
                                    onClick={() => executeBooking(true)}
                                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                    <i className="fa-solid fa-unlock"></i> Book Despite Maintenance
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {step === 'CONFIRM' && (
                <div className="text-center space-y-6 animate-fade-in-up">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-4xl mx-auto">
                        <i className="fa-solid fa-check"></i>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Slot Available!</h3>
                        <p className="text-slate-500 dark:text-slate-400">No conflicts found for this schedule.</p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 text-left space-y-2 border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400 text-sm">Subject:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{formData.subject}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400 text-sm">Lab:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{labs.find(l => l.id === formData.labId)?.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400 text-sm">Time:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{formData.startTime} - {formData.endTime}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400 text-sm">Systems:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{formData.systemCount}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => { setStep('FORM'); setConflictResult(null); }}
                            className="w-full border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            Back
                        </button>
                        <button 
                            onClick={() => executeBooking(false)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
                        >
                             <i className={`fa-solid ${bookingToEdit ? 'fa-pen-to-square' : 'fa-calendar-check'}`}></i>
                            {bookingToEdit ? 'Update Booking' : user.role === UserRole.ADMIN ? 'Confirm Booking' : 'Request Booking'}
                        </button>
                    </div>
                </div>
            )}
            </>
            )}

            {/* Logs Section (Only for Edit) */}
            {bookingToEdit && bookingToEdit.logs && bookingToEdit.logs.length > 0 && step === 'FORM' && !loading && (
                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">Booking History Log</h4>
                    <div className="space-y-3">
                        {bookingToEdit.logs.map((log, idx) => (
                            <div key={idx} className="flex gap-3 text-xs">
                                <div className="text-slate-400 min-w-[70px]">{new Date(log.timestamp).toLocaleDateString()}</div>
                                <div>
                                    <p className="font-semibold text-slate-700 dark:text-slate-200">
                                        <span className={`mr-1 px-1.5 rounded-[2px] text-[9px] text-white ${
                                            log.action === 'CREATED' ? 'bg-blue-500' :
                                            log.action === 'APPROVED' ? 'bg-green-500' :
                                            log.action === 'REJECTED' ? 'bg-red-500' :
                                            log.action === 'OVERRIDE' ? 'bg-orange-600' :
                                            'bg-slate-500'
                                        }`}>{log.action}</span>
                                        by {log.byUserName}
                                    </p>
                                    <p className="text-slate-500 dark:text-slate-400">{log.details}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
