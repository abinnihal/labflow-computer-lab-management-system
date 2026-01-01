
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { getPendingUsersByRole, updateUserStatus } from '../../services/userService';
import TerminalLoader from '../ui/TerminalLoader';

interface Props {
  targetRole: UserRole;
  department?: string;
  managedSemesters?: string[];
}

const ApprovalList: React.FC<Props> = ({ targetRole, department, managedSemesters }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, [targetRole, department, managedSemesters]);

  const fetchData = () => {
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
        setUsers(getPendingUsersByRole(targetRole, department, managedSemesters));
        setLoading(false);
    }, 800);
  };

  const handleAction = (userId: string, action: 'APPROVED' | 'REJECTED') => {
    setActionLoading(userId);
    setTimeout(() => {
        updateUserStatus(userId, action);
        setUsers(prev => prev.filter(u => u.id !== userId));
        setActionLoading(null);
        setMsg({ type: 'success', text: `User ${action === 'APPROVED' ? 'approved' : 'rejected'} successfully.` });
        setTimeout(() => setMsg(null), 3000);
    }, 1200);
  };

  if (loading) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 flex flex-col items-center justify-center">
            <TerminalLoader />
            <p className="text-slate-500 dark:text-slate-400 mt-4 text-sm font-medium">Loading pending approvals...</p>
        </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-white">
                Pending {targetRole === UserRole.FACULTY ? 'Faculty' : 'Student'} Registrations {department && `(${department})`}
            </h3>
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold px-2 py-1 rounded-full">
                {users.length} Pending
            </span>
        </div>

        {msg && (
            <div className={`mx-6 mt-4 p-3 rounded-lg text-sm flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'}`}>
                <i className={`fa-solid ${msg.type === 'success' ? 'fa-check-circle' : 'fa-circle-exclamation'}`}></i>
                {msg.text}
            </div>
        )}

        <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {users.length === 0 ? (
                <div className="p-12 text-center text-slate-400 dark:text-slate-500 italic">
                    <i className="fa-solid fa-clipboard-check text-4xl mb-3 opacity-50"></i>
                    <p>No pending approvals.</p>
                </div>
            ) : (
                users.map(user => (
                    <div key={user.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        {/* Summary Row */}
                        <div 
                            className="p-4 flex items-center justify-between cursor-pointer"
                            onClick={() => setExpandedId(expandedId === user.id ? null : user.id)}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${targetRole === UserRole.FACULTY ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'}`}>
                                    {user.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">{user.name}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                                </div>
                            </div>
                            
                            <div className="hidden sm:flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">External ID</p>
                                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        {user.studentId || user.facultyId || 'N/A'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Date</p>
                                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        {user.registrationDate ? new Date(user.registrationDate).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-transform duration-200 p-2">
                                <i className={`fa-solid fa-chevron-down ${expandedId === user.id ? 'rotate-180' : ''}`}></i>
                            </button>
                        </div>

                        {/* Expanded Details */}
                        {expandedId === user.id && (
                            <div className="px-6 pb-6 pt-0 bg-slate-50/50 dark:bg-slate-900/20 border-t border-slate-100 dark:border-slate-800 animate-fade-in-down">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                    <div className="space-y-3 text-sm">
                                        <h5 className="font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-2">User Details</h5>
                                        <div className="grid grid-cols-2 gap-2">
                                            <span className="text-slate-500 dark:text-slate-400">Phone:</span>
                                            <span className="font-medium text-slate-800 dark:text-slate-200">{user.phone || 'N/A'}</span>
                                            
                                            <span className="text-slate-500 dark:text-slate-400">Department:</span>
                                            <span className="font-medium text-slate-800 dark:text-slate-200">{user.department || 'N/A'}</span>
                                            
                                            {targetRole === UserRole.STUDENT && (
                                                <>
                                                    <span className="text-slate-500 dark:text-slate-400">Course:</span>
                                                    <span className="font-medium text-slate-800 dark:text-slate-200">{user.course || 'N/A'}</span>
                                                    
                                                    <span className="text-slate-500 dark:text-slate-400">Semester:</span>
                                                    <span className="font-medium text-slate-800 dark:text-slate-200">{user.semester || 'N/A'}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h5 className="font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-2">ID Proof</h5>
                                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 flex items-center justify-center h-32 w-full overflow-hidden relative group">
                                            {user.idProofUrl ? (
                                                <>
                                                    <img src={user.idProofUrl} alt="ID Proof" className="object-contain h-full w-full opacity-90 group-hover:opacity-100 transition-opacity" />
                                                    <a 
                                                        href={user.idProofUrl} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <span className="bg-white text-slate-900 px-3 py-1 rounded-full text-xs font-bold shadow-sm">View Full Image</span>
                                                    </a>
                                                </>
                                            ) : (
                                                <div className="text-slate-400 text-sm flex flex-col items-center">
                                                    <i className="fa-regular fa-image text-2xl mb-1"></i>
                                                    No ID uploaded
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
                                    <button 
                                        onClick={() => handleAction(user.id, 'REJECTED')}
                                        disabled={!!actionLoading}
                                        className="px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                                    >
                                        {actionLoading === user.id ? 'Processing...' : 'Reject'}
                                    </button>
                                    <button 
                                        onClick={() => handleAction(user.id, 'APPROVED')}
                                        disabled={!!actionLoading}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {actionLoading === user.id && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
                                        Approve Registration
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    </div>
  );
};

export default ApprovalList;
