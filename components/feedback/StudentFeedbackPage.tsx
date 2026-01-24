import React, { useState, useEffect } from 'react';
import { User, Feedback, Lab } from '../../types'; // Added Lab type
// FIX: Import from labService instead of bookingService
import { getAllLabs } from '../../services/labService';
import { createFeedback, getFeedbackByStudent } from '../../services/maintenanceService';
import { submitActivity } from '../../services/attendanceService';

interface Props {
    user: User;
}

const StudentFeedbackPage: React.FC<Props> = ({ user }) => {
    const [target, setTarget] = useState<'FACULTY' | 'ADMIN'>('FACULTY');
    const [category, setCategory] = useState<'GENERAL' | 'LAB_ISSUE' | 'TEACHING'>('TEACHING');
    const [labId, setLabId] = useState('');
    const [content, setContent] = useState('');
    const [rating, setRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [history, setHistory] = useState<Feedback[]>([]);

    // FIX: State for Labs (Async Data)
    const [labs, setLabs] = useState<Lab[]>([]);

    // 1. Fetch Labs on Mount
    useEffect(() => {
        const fetchLabs = async () => {
            try {
                const data = await getAllLabs();
                setLabs(data);
            } catch (error) {
                console.error("Failed to load labs for feedback form", error);
            }
        };
        fetchLabs();
    }, []);

    useEffect(() => {
        refreshHistory();
    }, [user.id]);

    const refreshHistory = () => {
        setHistory(getFeedbackByStudent(user.id));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) {
            setMsg({ type: 'error', text: 'Please enter feedback content.' });
            return;
        }

        setIsSubmitting(true);
        setTimeout(() => {
            createFeedback({
                studentId: user.id,
                studentName: user.name,
                target,
                category,
                labId: category === 'LAB_ISSUE' ? labId : undefined,
                content,
                rating: rating > 0 ? rating : undefined
            });

            // Background Activity Routing
            submitActivity(user, 'feedback', {
                target,
                category,
                rating,
                isAnonymous: false
            });

            setIsSubmitting(false);
            setMsg({ type: 'success', text: 'Feedback submitted successfully!' });
            setContent('');
            setRating(0);
            refreshHistory();
            setTimeout(() => setMsg(null), 3000);
        }, 1000);
    };

    const getStatusColor = (status?: string) => {
        if (status === 'RESOLVED') return 'bg-green-100 text-green-700';
        return 'bg-yellow-100 text-yellow-700';
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Feedback & Support</h1>
                <p className="text-slate-500 dark:text-slate-400">Share your suggestions, report issues, or rate your experience.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Submission Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sticky top-6">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <i className="fa-solid fa-paper-plane text-blue-600"></i> Submit Feedback
                        </h2>

                        {msg && (
                            <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                                <i className={`fa-solid ${msg.type === 'success' ? 'fa-check-circle' : 'fa-circle-exclamation'}`}></i>
                                {msg.text}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Recipient</label>
                                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setTarget('FACULTY')}
                                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${target === 'FACULTY' ? 'bg-white dark:bg-slate-600 shadow text-purple-600 dark:text-purple-300' : 'text-slate-500 dark:text-slate-400'}`}
                                    >
                                        <i className="fa-solid fa-chalkboard-user mr-2"></i> Faculty
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTarget('ADMIN')}
                                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${target === 'ADMIN' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}
                                    >
                                        <i className="fa-solid fa-shield-halved mr-2"></i> Admin
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value as any)}
                                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="TEACHING">Teaching / Coursework</option>
                                    <option value="LAB_ISSUE">Lab / Hardware Issue</option>
                                    <option value="GENERAL">General Suggestion</option>
                                </select>
                            </div>

                            {category === 'LAB_ISSUE' && (
                                <div className="animate-fade-in-down">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Affected Lab (Optional)</label>
                                    <select
                                        value={labId}
                                        onChange={(e) => setLabId(e.target.value)}
                                        className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="">-- Select Lab --</option>
                                        {labs.map(lab => (
                                            <option key={lab.id} value={lab.id}>{lab.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Rating (Optional)</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(rating === star ? 0 : star)}
                                            className={`text-xl transition-transform hover:scale-110 ${rating >= star ? 'text-yellow-400' : 'text-slate-200 dark:text-slate-600'}`}
                                        >
                                            <i className="fa-solid fa-star"></i>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Message</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder={target === 'FACULTY' ? "E.g., Needs more explanation on Recursion..." : "E.g., Mouse not working in System 10..."}
                                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-3 py-2 h-32 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <i className="fa-solid fa-paper-plane"></i>}
                                Submit Feedback
                            </button>
                        </form>
                    </div>
                </div>

                {/* History List */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                            <h3 className="font-bold text-slate-800 dark:text-white">Your Feedback History</h3>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                            {history.length === 0 ? (
                                <div className="p-12 text-center text-slate-400 dark:text-slate-500 italic">
                                    <i className="fa-regular fa-comments text-4xl mb-3 opacity-50"></i>
                                    <p>You haven't submitted any feedback yet.</p>
                                </div>
                            ) : (
                                history.map(fb => (
                                    <div key={fb.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${fb.target === 'ADMIN' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800' : 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-800'}`}>
                                                    To: {fb.target}
                                                </span>
                                                <span className="text-xs text-slate-400 dark:text-slate-500">• {new Date(fb.date).toLocaleDateString()}</span>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getStatusColor(fb.status)}`}>
                                                {fb.status}
                                            </span>
                                        </div>

                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">{fb.category.replace('_', ' ')}</h4>
                                        <p className="text-slate-600 dark:text-slate-300 text-sm mb-3 bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                            {fb.content}
                                        </p>

                                        {fb.rating && (
                                            <div className="flex text-yellow-400 gap-0.5 text-xs mb-3">
                                                {[...Array(5)].map((_, i) => (
                                                    <i key={i} className={`fa-solid fa-star ${i < fb.rating! ? '' : 'text-slate-200 dark:text-slate-600'}`}></i>
                                                ))}
                                            </div>
                                        )}

                                        {fb.adminReply && (
                                            <div className="mt-3 ml-4 pl-4 border-l-2 border-green-500">
                                                <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase mb-1">Reply from Admin/Faculty</p>
                                                <p className="text-sm text-slate-700 dark:text-slate-300">{fb.adminReply}</p>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentFeedbackPage;