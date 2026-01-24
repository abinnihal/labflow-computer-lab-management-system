import React, { useState, useEffect } from 'react';
import {
    User,
    Booking,
    UserRole,
    Lab,
    ConflictResult
} from '../../types';
import { getAllLabs } from '../../services/labService';
import {
    checkConflict,
    createBooking,
    updateBooking
} from '../../services/bookingService';
import TerminalLoader from '../ui/TerminalLoader';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    onSuccess?: () => void;
    bookingToEdit?: Booking | null;
}

const BookingModal: React.FC<Props> = ({ isOpen, onClose, user, onSuccess, bookingToEdit }) => {
    const [labs, setLabs] = useState<Lab[]>([]);
    const [step, setStep] = useState<'FORM' | 'CONFIRM' | 'CONFLICT'>('FORM');
    const [loading, setLoading] = useState(false);
    const [conflictResult, setConflictResult] = useState<ConflictResult | null>(null);

    const [formData, setFormData] = useState({
        subject: '',
        labId: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '11:00',
        systemCount: 30,
        reminder: true
    });

    // Fetch Labs on Open
    useEffect(() => {
        const fetchLabs = async () => {
            const data = await getAllLabs();
            setLabs(data);
            if (!bookingToEdit && data.length > 0 && !formData.labId) {
                setFormData(prev => ({ ...prev, labId: data[0].id }));
            }
        };
        if (isOpen) fetchLabs();
    }, [isOpen]);

    // Set Form Data on Edit
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
            setFormData(prev => ({
                ...prev,
                subject: '',
                date: new Date().toISOString().split('T')[0],
                startTime: '09:00',
                endTime: '11:00'
            }));
            setStep('FORM');
        }
    }, [bookingToEdit, isOpen]);

    if (!isOpen) return null;

    const handleCheckConflict = async () => {
        setLoading(true);
        try {
            const result = await checkConflict({
                ...formData,
                userId: user.id,
                userName: user.name,
                userRole: user.role
            }, bookingToEdit?.id);

            setConflictResult(result);
            if (result.hasConflict) setStep('CONFLICT');
            else setStep('CONFIRM');
        } catch (error: any) {
            alert("Error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const executeBooking = async (isOverride: boolean = false) => {
        setLoading(true);
        try {
            if (bookingToEdit) {
                await updateBooking(bookingToEdit.id, {
                    ...formData,
                    userId: user.id,
                    userName: user.name,
                    userRole: user.role
                }, user.id, user.name);
            } else {
                await createBooking({
                    ...formData,
                    userId: user.id,
                    userName: user.name,
                    userRole: user.role
                }, isOverride);
            }
            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            setConflictResult({ hasConflict: true, message: error.message });
            setStep('CONFLICT');
        } finally {
            setLoading(false);
        }
    };

    const isMaintenance = conflictResult?.message?.toLowerCase().includes('maintenance');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

                {/* HEADER */}
                <div className={`p-6 text-white flex justify-between items-center shrink-0 ${isMaintenance ? 'bg-gradient-to-r from-orange-600 to-red-600' : 'bg-gradient-to-r from-blue-600 to-indigo-700'}`}>
                    <div>
                        <h2 className="text-xl font-bold">{bookingToEdit ? 'Edit Session' : 'Book Lab Session'}</h2>
                        <p className="text-white/80 text-sm">{bookingToEdit ? 'Modify details' : 'Schedule a lab for your class'}</p>
                    </div>
                    <button onClick={onClose} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                {/* CONTENT BODY */}
                <div className="p-6 overflow-y-auto custom-scrollbar relative">

                    {/* 1. LOADING STATE */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-10 gap-4">
                            <TerminalLoader />
                            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Processing request...</p>
                        </div>
                    )}

                    {/* 2. FORM STATE */}
                    {!loading && step === 'FORM' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Class / Subject Name</label>
                                <input
                                    type="text"
                                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    placeholder="e.g. Advanced Java Lab"
                                    value={formData.subject}
                                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Lab</label>
                                    <select
                                        className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                        value={formData.labId}
                                        onChange={e => setFormData({ ...formData, labId: e.target.value })}
                                    >
                                        {labs.map(lab => (
                                            <option key={lab.id} value={lab.id}>{lab.name} (Cap: {lab.capacity})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Systems</label>
                                    <input
                                        type="number"
                                        className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                        value={formData.systemCount}
                                        onChange={e => setFormData({ ...formData, systemCount: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                                <input
                                    type="date"
                                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
                                    <input
                                        type="time"
                                        className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                        value={formData.startTime}
                                        onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">End Time</label>
                                    <input
                                        type="time"
                                        className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                        value={formData.endTime}
                                        onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleCheckConflict}
                                disabled={!formData.subject || labs.length === 0}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <i className="fa-solid fa-magnifying-glass"></i> Check Availability
                            </button>
                        </div>
                    )}

                    {/* 3. CONFLICT STATE */}
                    {!loading && step === 'CONFLICT' && (
                        <div className="text-center space-y-6">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto ${isMaintenance ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>
                                <i className={`fa-solid ${isMaintenance ? 'fa-screwdriver-wrench' : 'fa-triangle-exclamation'}`}></i>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{isMaintenance ? 'Maintenance' : 'Conflict Detected'}</h3>
                                <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">{conflictResult?.message}</p>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => { setStep('FORM'); setConflictResult(null); }}
                                    className="w-full border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700"
                                >
                                    Change Details
                                </button>

                                {user.role === UserRole.ADMIN && (
                                    <button
                                        onClick={() => executeBooking(true)}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-md"
                                    >
                                        <i className="fa-solid fa-gavel mr-2"></i> Override & Book
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 4. CONFIRM STATE */}
                    {!loading && step === 'CONFIRM' && (
                        <div className="text-center space-y-6">
                            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto">
                                <i className="fa-solid fa-check"></i>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Slot Available!</h3>
                                <p className="text-slate-500 dark:text-slate-400">No conflicts found.</p>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 text-left space-y-2 border border-slate-100 dark:border-slate-700">
                                <p><span className="text-slate-500">Subject:</span> <span className="font-bold dark:text-white">{formData.subject}</span></p>
                                <p><span className="text-slate-500">Lab:</span> <span className="font-bold dark:text-white">{labs.find(l => l.id === formData.labId)?.name}</span></p>
                                <p><span className="text-slate-500">Time:</span> <span className="font-bold dark:text-white">{formData.startTime} - {formData.endTime}</span></p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setStep('FORM')}
                                    className="w-full border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold py-3 rounded-xl"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={() => executeBooking(false)}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-md"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 5. LOGS (Bottom of Modal) */}
                    {!loading && bookingToEdit?.logs && step === 'FORM' && (
                        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">History Log</h4>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {bookingToEdit.logs.map((log, idx) => (
                                    <div key={idx} className="text-xs text-slate-500 dark:text-slate-400">
                                        <span className="font-mono mr-2">{new Date(log.timestamp).toLocaleDateString()}</span>
                                        <span className="font-bold text-slate-700 dark:text-slate-300">{log.action}</span> by {log.byUserName}
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