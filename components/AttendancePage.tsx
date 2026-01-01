
import React, { useState, useEffect } from 'react';
import { User, Booking } from '../types';
import { checkInStudent, checkOutStudent, getLogsByStudent, getStudentStatus, AttendanceRecord } from '../services/attendanceService';
import { getNextLabSession } from '../services/bookingService';
import CheckInModal from './attendance/CheckInModal';

interface Props {
  user: User;
}

const AttendancePage: React.FC<Props> = ({ user }) => {
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [currentSession, setCurrentSession] = useState<AttendanceRecord | null>(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [nextLab, setNextLab] = useState<Booking | null>(null);

  useEffect(() => {
    // Load initial data
    refreshData();
  }, [user.id]);

  const refreshData = () => {
    const status = getStudentStatus(user.id);
    setIsCheckedIn(status.isCheckedIn);
    setCurrentSession(status.currentRecord);
    setLogs(getLogsByStudent(user.id));
    
    // Fetch dynamic next lab
    const next = getNextLabSession(user.id);
    setNextLab(next);
  };

  const handleToggleAttendance = () => {
    if (isCheckedIn) {
      setProcessing(true);
      setTimeout(() => {
        checkOutStudent(user.id);
        refreshData();
        setProcessing(false);
      }, 1000);
    } else {
      setShowCheckInModal(true);
    }
  };

  const processCheckIn = (labId: string, systemNumber: number) => {
     setProcessing(true);
     setShowCheckInModal(false);
     setTimeout(() => {
       checkInStudent(user, labId, systemNumber);
       refreshData();
       setProcessing(false);
     }, 1000);
  };

  const formatFullDateTime = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Dynamic Calculation for stats
  const completedSessions = logs.filter(l => l.status === 'COMPLETED').length;
  // Using 10 as standard denominator for demo progress tracking
  const totalExpectedSessions = 10; 
  const attendanceRate = Math.min(100, Math.round((completedSessions / totalExpectedSessions) * 100));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Attendance Manager</h1>
        <p className="text-slate-500 dark:text-slate-400">Track your lab sessions and manage check-ins.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Action Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 flex flex-col items-center justify-center text-center transition-colors">
           <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl mb-6 transition-all duration-500 ${isCheckedIn ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
              <i className={`fa-solid ${isCheckedIn ? 'fa-fingerprint' : 'fa-power-off'}`}></i>
           </div>
           
           <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
             {isCheckedIn ? 'You are Checked In' : 'Not Checked In'}
           </h2>
           <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs">
             {isCheckedIn 
               ? `Session active since ${new Date(currentSession!.checkInTime).toLocaleTimeString()}. Using System #${currentSession?.systemNumber || '?'}` 
               : 'Please check in when you arrive at the lab to mark your attendance.'}
           </p>

           <button 
             onClick={handleToggleAttendance}
             disabled={processing}
             className={`w-full max-w-sm py-4 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3 ${
               processing ? 'bg-slate-400 dark:bg-slate-600 cursor-wait' : 
               isCheckedIn ? 'bg-red-500 hover:bg-red-600 shadow-red-200 dark:shadow-none' : 'bg-green-600 hover:bg-green-700 shadow-green-200 dark:shadow-none'
             }`}
           >
             {processing ? (
               <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Processing...</>
             ) : isCheckedIn ? (
               <><i className="fa-solid fa-right-from-bracket text-lg"></i> CHECK OUT</>
             ) : (
               <><i className="fa-solid fa-right-to-bracket text-lg"></i> CHECK IN</>
             )}
           </button>
           
           {isCheckedIn && (
             <p className="mt-4 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded-full border border-green-100 dark:border-green-800 animate-pulse">
               <i className="fa-solid fa-clock mr-1"></i> Recording time...
             </p>
           )}
        </div>

        {/* Stats Card */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between transition-colors">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4"><i className="fa-solid fa-calendar-check"></i></div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{completedSessions}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Completed Sessions</p>
              </div>
           </div>
           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between transition-colors">
              <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4"><i className="fa-solid fa-clock"></i></div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{attendanceRate}%</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Attendance Rate</p>
              </div>
           </div>
           <div className="col-span-2 bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-800 rounded-xl p-6 text-white shadow-lg">
              <h3 className="font-bold mb-2">Next Scheduled Lab</h3>
              {nextLab ? (
                  <>
                    <p className="text-2xl font-bold mb-1">
                        {new Date(nextLab.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                    <p className="opacity-80 text-sm">
                        {getRelativeDate(nextLab.startTime)} • {nextLab.subject}
                    </p>
                  </>
              ) : (
                  <p className="text-lg opacity-80 mt-2">No upcoming labs scheduled.</p>
              )}
           </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
           <h3 className="font-bold text-slate-800 dark:text-white">Attendance History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800">
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Course / Lab</th>
                <th className="px-6 py-3">Check In</th>
                <th className="px-6 py-3">Check Out</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-200">{log.date}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                     {log.course}
                     <div className="text-xs text-slate-400 mt-0.5">{log.labName} (Sys #{log.systemNumber})</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-mono text-xs">{formatFullDateTime(log.checkInTime).split(' ')[1]} {formatFullDateTime(log.checkInTime).split(' ')[2]}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-mono text-xs">
                    {log.checkOutTime ? (
                      <>
                        {formatFullDateTime(log.checkOutTime).split(' ')[1]} {formatFullDateTime(log.checkOutTime).split(' ')[2]}
                      </>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      log.status === 'PRESENT' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 
                      log.status === 'COMPLETED' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}>
                      {log.status === 'PRESENT' ? 'Active' : 'Present'}
                    </span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 italic">No attendance records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CheckInModal 
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        onCheckIn={processCheckIn}
        isLoading={processing}
      />
    </div>
  );
};

export default AttendancePage;
