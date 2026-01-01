
import React, { useEffect, useState } from 'react';
import { Booking, Task } from '../../types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { getLogsByDate, AttendanceRecord } from '../../services/attendanceService';
import { getTasksByFaculty, getTaskStats } from '../../services/taskService';
import TerminalLoader from '../ui/TerminalLoader';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
}

const BookingReportModal: React.FC<Props> = ({ isOpen, onClose, booking }) => {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [relatedTasks, setRelatedTasks] = useState<{ task: Task, stats: any }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (booking && isOpen) {
      setLoading(true);
      // Simulate data fetching/aggregation
      setTimeout(() => {
        const dateStr = new Date(booking.startTime).toISOString().split('T')[0];
        
        // 1. Fetch Attendance for this date
        // In a real app, we would filter by specific booking ID, but date serves for the demo
        const logs = getLogsByDate(dateStr);
        setAttendanceData(logs);

        // 2. Fetch related tasks (assigned by this faculty)
        const tasks = getTasksByFaculty(booking.userId);
        // Filter tasks that might be relevant (e.g., active or due around this time)
        // For demo, just taking the recent 2
        const relevantTasks = tasks.slice(0, 2).map(t => ({
            task: t,
            stats: getTaskStats(t.id)
        }));
        setRelatedTasks(relevantTasks);

        setLoading(false);
      }, 2000);
    }
  }, [booking, isOpen]);

  if (!isOpen || !booking) return null;

  // Chart Data Preparation
  const presentCount = attendanceData.filter(a => a.status === 'PRESENT' || a.status === 'COMPLETED').length;
  // Mocking absent count derived from capacity or fixed class size (e.g. 40)
  const totalClassSize = 40; 
  const absentCount = Math.max(0, totalClassSize - presentCount);

  const pieData = [
    { name: 'Present', value: presentCount },
    { name: 'Absent', value: absentCount },
  ];
  const COLORS = ['#22c55e', '#ef4444'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex justify-between items-center shrink-0">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="bg-blue-600 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">Lab Report</span>
                    <span className="text-slate-400 text-sm">{new Date(booking.startTime).toLocaleDateString()}</span>
                </div>
                <h2 className="text-xl font-bold">{booking.subject}</h2>
                <p className="text-slate-400 text-sm">Faculty: {booking.userName} • Lab: {booking.labId === 'l1' ? 'Lab 1' : booking.labId === 'l2' ? 'Lab 2' : 'Lab 3'}</p>
            </div>
            <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                <i className="fa-solid fa-xmark"></i>
            </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/50">
            {loading ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-4">
                    <TerminalLoader />
                    <p>Processing Data Logs...</p>
                </div>
            ) : (
                <div className="space-y-6 animate-fade-in-up">
                    {/* Top Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Attendance Rate</p>
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{Math.round((presentCount / totalClassSize) * 100)}%</h3>
                                <p className="text-xs text-green-600 dark:text-green-400 font-medium">{presentCount} / {totalClassSize} Students</p>
                            </div>
                            <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-xl">
                                <i className="fa-solid fa-users"></i>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Session Duration</p>
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                                    {Math.round((new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / (1000 * 60 * 60))} Hrs
                                </h3>
                                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Completed</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xl">
                                <i className="fa-regular fa-clock"></i>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">System Usage</p>
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{booking.systemCount}</h3>
                                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Allocated Nodes</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-xl">
                                <i className="fa-solid fa-computer"></i>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Attendance Chart */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h3 className="font-bold text-slate-800 dark:text-white mb-6">Attendance Distribution</h3>
                            <div className="h-64 w-full flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', backgroundColor: '#fff', color: '#1e293b'}} />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Related Tasks Stats */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h3 className="font-bold text-slate-800 dark:text-white mb-4">Performance on Related Tasks</h3>
                            {relatedTasks.length > 0 ? (
                                <div className="space-y-4">
                                    {relatedTasks.map((item, idx) => (
                                        <div key={idx} className="border border-slate-100 dark:border-slate-700 rounded-lg p-4">
                                            <div className="flex justify-between mb-2">
                                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[200px]">{item.task.title}</span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">Due: {item.task.dueDate}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs mb-2">
                                                <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">Approved: {item.stats.approved}</span>
                                                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded">Submitted: {item.stats.submitted}</span>
                                                <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">Pending: {item.stats.pending}</span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                                <div 
                                                    className="bg-green-500 h-full" 
                                                    style={{ width: `${(item.stats.approved / (item.stats.submitted + item.stats.pending || 1)) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm italic">
                                    No active tasks linked to this session.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Student List Table */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 dark:text-white">Attendance Log</h3>
                            <button className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">
                                <i className="fa-solid fa-download mr-1"></i> Export CSV
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-3">Student</th>
                                        <th className="px-6 py-3">Time In</th>
                                        <th className="px-6 py-3">Time Out</th>
                                        <th className="px-6 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {attendanceData.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center text-xs font-bold">
                                                        {log.studentName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{log.studentName}</p>
                                                        <p className="text-[10px] text-slate-400">{log.studentId}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400 font-mono">{new Date(log.checkInTime).toLocaleTimeString()}</td>
                                            <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400 font-mono">{log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString() : '-'}</td>
                                            <td className="px-6 py-3">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${log.status === 'PRESENT' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {attendanceData.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500 italic">No attendance records found for this date.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end shrink-0 bg-white dark:bg-slate-800">
            <button onClick={onClose} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-lg transition-colors">
                Close Report
            </button>
        </div>

      </div>
    </div>
  );
};

export default BookingReportModal;
