import React, { useState, useEffect } from 'react';
import { User, AttendanceLog, UserRole } from '../../types';
import { getStudentAttendance } from '../../services/attendanceService';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface Props {
   user: User;
}

const AttendanceProgressPage: React.FC<Props> = ({ user }) => {
   const [logs, setLogs] = useState<AttendanceLog[]>([]);
   const [loading, setLoading] = useState(true);

   // Stats
   const [stats, setStats] = useState({ present: 0, late: 0, absent: 0, totalHours: 0 });

   // Get Active Context (For Faculty)
   const currentSubjectId = localStorage.getItem('activeSubjectId');
   const currentSubjectName = localStorage.getItem('activeSubjectName') || 'Class';

   useEffect(() => {
      fetchData();
   }, [user, currentSubjectId]);

   const fetchData = async () => {
      setLoading(true);
      try {
         if (user.role === UserRole.STUDENT) {
            // 1. Student: Fetch OWN logs (Can optionally filter by subject here too)
            const data = await getStudentAttendance(user.id);
            const safeData = Array.isArray(data) ? data : [];
            setLogs(safeData);
            calculateStats(safeData);
         } else {
            // 2. Faculty: Fetch Logs for the ACTIVE SUBJECT only
            if (!currentSubjectId) {
               setLogs([]);
               setLoading(false);
               return;
            }

            const q = query(
               collection(db, 'attendance_logs'),
               where('subjectId', '==', currentSubjectId), // <--- SUBJECT CENTRIC FILTER
               orderBy('checkInTime', 'desc')
            );

            const snapshot = await getDocs(q);
            const subjectLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceLog));

            setLogs(subjectLogs);
            calculateStats(subjectLogs);
         }
      } catch (error) {
         console.error("Failed to load attendance", error);
         setLogs([]);
      } finally {
         setLoading(false);
      }
   };

   const calculateStats = (data: AttendanceLog[]) => {
      const present = data.filter(l => l.status === 'PRESENT' || l.status === 'COMPLETED').length;
      const late = data.filter(l => l.status === 'LATE').length;

      // Calculate hours (rough estimate based on checked out logs)
      const hours = data.reduce((acc, log) => {
         if (log.checkInTime && log.checkOutTime) {
            const start = new Date(log.checkInTime).getTime();
            const end = new Date(log.checkOutTime).getTime();
            return acc + ((end - start) / (1000 * 60 * 60));
         }
         return acc;
      }, 0);

      setStats({
         present,
         late,
         absent: 0, // Absent logic usually requires a schedule comparison
         totalHours: Math.round(hours * 10) / 10
      });
   };

   return (
      <div className="space-y-6">
         <div className="flex justify-between items-end">
            <div>
               <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Attendance & Participation</h1>
               <p className="text-slate-500 dark:text-slate-400">
                  {user.role === UserRole.STUDENT
                     ? 'Track your lab hours and punctuality.'
                     : `Monitoring records for: ${currentSubjectName}`}
               </p>
            </div>
            {user.role === UserRole.FACULTY && (
               <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full uppercase">
                  {currentSubjectName}
               </span>
            )}
         </div>

         {/* Stats Cards */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
               <p className="text-xs font-bold text-slate-400 uppercase mb-1">Classes Attended</p>
               <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.present}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
               <p className="text-xs font-bold text-slate-400 uppercase mb-1">Late Arrivals</p>
               <p className="text-2xl font-bold text-orange-500">{stats.late}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
               <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Hours</p>
               <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalHours}h</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
               <p className="text-xs font-bold text-slate-400 uppercase mb-1">Attendance Rate</p>
               <p className="text-2xl font-bold text-slate-800 dark:text-white">
                  {stats.present + stats.late > 0 ? '100%' : '0%'}
               </p>
            </div>
         </div>

         {/* Logs Table */}
         <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
               <h3 className="font-bold text-slate-800 dark:text-white">Detailed Logs</h3>
            </div>

            {loading ? (
               <div className="p-10 text-center text-slate-500">Loading records...</div>
            ) : (
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <tr>
                           <th className="px-6 py-3">Date</th>
                           {user.role !== UserRole.STUDENT && <th className="px-6 py-3">Student</th>}
                           <th className="px-6 py-3">Lab</th>
                           <th className="px-6 py-3">Check In</th>
                           <th className="px-6 py-3">Check Out</th>
                           <th className="px-6 py-3">Status</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                        {logs.length === 0 ? (
                           <tr><td colSpan={6} className="p-8 text-center text-slate-400">No attendance records found for this subject.</td></tr>
                        ) : (
                           logs.map(log => (
                              <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                 <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                    {new Date(log.checkInTime).toLocaleDateString()}
                                 </td>
                                 {user.role !== UserRole.STUDENT && (
                                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-white">
                                       {(log as any).studentName || 'Unknown'}
                                    </td>
                                 )}
                                 <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                    {log.labId || 'General'} <span className="text-slate-400 text-xs">#{log.systemNumber}</span>
                                 </td>
                                 <td className="px-6 py-4 font-mono text-slate-500">
                                    {new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </td>
                                 <td className="px-6 py-4 font-mono text-slate-500">
                                    {log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                 </td>
                                 <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${log.status === 'LATE' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                       {log.status}
                                    </span>
                                 </td>
                              </tr>
                           ))
                        )}
                     </tbody>
                  </table>
               </div>
            )}
         </div>
      </div>
   );
};

export default AttendanceProgressPage;