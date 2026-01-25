import React, { useState, useEffect } from 'react';
// FIX: Changed from '../../' to '../' because file is in 'components/' not 'components/attendance/'
import { User, AttendanceLog } from '../types';
import { getLogsByStudent } from '../services/attendanceService';
import { getAllBookings } from '../services/bookingService';

interface Props {
  user: User;
}

const AttendancePage: React.FC<Props> = ({ user }) => {
  // 1. Initialize with empty array (Critical)
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    attendanceRate: 0,
    classesAttended: 0,
    hoursSpent: 0
  });

  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts

    const fetchData = async () => {
      setLoading(true);
      try {
        // 2. Fetch Data
        const rawLogs = await getLogsByStudent(user.id);
        const rawBookings = await getAllBookings();

        if (!isMounted) return;

        // 3. STRICT SAFETY CHECK: Force to Array
        // If the service returns null/undefined, default to []
        const safeLogs = Array.isArray(rawLogs) ? rawLogs : [];
        const safeBookings = Array.isArray(rawBookings) ? rawBookings : [];

        setLogs(safeLogs);

        // 4. Calculate Stats (Only use safe variables)
        const attended = safeLogs.filter(l => l && (l.status === 'PRESENT' || l.status === 'COMPLETED')).length;

        const hours = safeLogs.reduce((acc, log) => {
          if (log && log.checkOutTime && log.checkInTime) {
            const start = new Date(log.checkInTime).getTime();
            const end = new Date(log.checkOutTime).getTime();
            const diff = end - start;
            // Only add positive, realistic durations (e.g. > 1 min)
            if (diff > 60000) {
              return acc + (diff / (1000 * 60 * 60));
            }
          }
          return acc + (log.status === 'PRESENT' ? 1 : 0); // Default 1h for active
        }, 0);

        // Filter bookings safely
        const pastBookings = safeBookings.filter(b =>
          b && b.userId === user.id && b.endTime && new Date(b.endTime) < new Date()
        ).length;

        const totalSessions = Math.max(pastBookings, 1);

        setStats({
          attendanceRate: Math.round((attended / totalSessions) * 100),
          classesAttended: attended,
          hoursSpent: Math.round(hours * 10) / 10
        });

      } catch (error) {
        console.error("Attendance Data Error:", error);
        if (isMounted) setLogs([]); // Reset to empty on error
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => { isMounted = false; };
  }, [user.id]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">My Attendance</h1>
          <p className="text-slate-500 dark:text-slate-400">Track your lab presence and hours.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500">
          <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Loading attendance...
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Attendance Rate</p>
                <h3 className={`text-3xl font-bold mt-1 ${stats.attendanceRate >= 75 ? 'text-green-600' : 'text-orange-500'}`}>
                  {stats.attendanceRate}%
                </h3>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${stats.attendanceRate >= 75 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-500'}`}>
                <i className="fa-solid fa-chart-pie"></i>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Sessions Attended</p>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{stats.classesAttended}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl">
                <i className="fa-solid fa-calendar-check"></i>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Total Hours</p>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{stats.hoursSpent}h</h3>
              </div>
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xl">
                <i className="fa-solid fa-clock"></i>
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-800 dark:text-white">History Log</h3>
            </div>

            {/* 5. Render Check: Verify 'logs' is an array before mapping */}
            {!Array.isArray(logs) || logs.length === 0 ? (
              <div className="p-10 text-center text-slate-400 dark:text-slate-500 italic">
                No attendance records found. Check in to a lab to see data here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Lab</th>
                      <th className="px-6 py-3">Check In</th>
                      <th className="px-6 py-3">Check Out</th>
                      <th className="px-6 py-3">Duration</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {logs.map((log) => {
                      if (!log) return null; // Skip undefined entries

                      let duration = '-';
                      if (log.checkOutTime && log.checkInTime) {
                        const diff = new Date(log.checkOutTime).getTime() - new Date(log.checkInTime).getTime();
                        if (!isNaN(diff) && diff > 0) {
                          const hrs = Math.floor(diff / (1000 * 60 * 60));
                          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                          duration = `${hrs}h ${mins}m`;
                        }
                      }

                      return (
                        <tr key={log.id || Math.random()} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                          <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">
                            {log.checkInTime ? new Date(log.checkInTime).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                            {log.labId || 'General Lab'}
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-500">
                            {log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-500">
                            {log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : <span className="text-blue-500 italic">Active</span>}
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{duration}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${log.status === 'PRESENT' || log.status === 'COMPLETED' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                log.status === 'LATE' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                                  'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              }`}>
                              {log.status === 'COMPLETED' ? 'PRESENT' : log.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AttendancePage;