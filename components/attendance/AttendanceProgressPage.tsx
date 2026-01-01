
import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { getLogsByDate, AttendanceRecord } from '../../services/attendanceService';
import { MOCK_ROSTER } from '../../constants';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface Props {
  user: User;
}

interface StudentStatus {
  id: string;
  name: string;
  email: string;
  status: 'PRESENT' | 'ABSENT' | 'COMPLETED' | 'LATE';
  checkInTime?: string;
  checkOutTime?: string | null;
  labName?: string;
  systemNumber?: number;
}

const AttendanceProgressPage: React.FC<Props> = ({ user }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('BCA - 3rd Sem');
  const [studentStatuses, setStudentStatuses] = useState<StudentStatus[]>([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, completed: 0 });

  useEffect(() => {
    refreshData();
  }, [selectedDate, selectedClass]);

  const refreshData = () => {
    // 1. Get actual logs for the date
    const logs = getLogsByDate(selectedDate);
    
    // 2. Merge with Roster to find Absentees
    // In a real app, fetch roster by Class ID. Here we use MOCK_ROSTER for demo.
    const mergedData: StudentStatus[] = MOCK_ROSTER.map(student => {
      const log = logs.find(l => l.studentId === student.id);
      if (log) {
        return {
          id: student.id,
          name: student.name,
          email: student.email,
          status: log.status, // PRESENT or COMPLETED
          checkInTime: log.checkInTime,
          checkOutTime: log.checkOutTime,
          labName: log.labName,
          systemNumber: log.systemNumber
        };
      } else {
        return {
          id: student.id,
          name: student.name,
          email: student.email,
          status: 'ABSENT',
        };
      }
    });

    setStudentStatuses(mergedData);

    // Calculate Stats
    setStats({
      present: mergedData.filter(s => s.status === 'PRESENT' || s.status === 'LATE').length,
      completed: mergedData.filter(s => s.status === 'COMPLETED').length,
      absent: mergedData.filter(s => s.status === 'ABSENT').length
    });
  };

  const pieData = [
    { name: 'Active', value: stats.present, color: '#3b82f6' },
    { name: 'Completed', value: stats.completed, color: '#22c55e' },
    { name: 'Absent', value: stats.absent, color: '#ef4444' },
  ];

  // Mock data for check-in timeline (Distribution of arrival times)
  const timelineData = [
    { time: '08:45', count: 2 },
    { time: '09:00', count: 15 },
    { time: '09:15', count: 8 },
    { time: '09:30', count: 4 },
    { time: 'Late', count: 1 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Check-In & Progress</h1>
          <p className="text-slate-500 dark:text-slate-400">Real-time monitoring of student attendance and lab usage.</p>
        </div>
        
        <div className="flex gap-3 bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
            <select 
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="text-sm border-none bg-transparent focus:ring-0 font-medium text-slate-700 dark:text-slate-200 outline-none"
            >
               <option className="dark:bg-slate-800">BCA - 3rd Sem</option>
               <option className="dark:bg-slate-800">MCA - 1st Sem</option>
               <option className="dark:bg-slate-800">BSC - 5th Sem</option>
            </select>
            <div className="w-px bg-slate-200 dark:bg-slate-700 my-1"></div>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm border-none bg-transparent focus:ring-0 font-medium text-slate-600 dark:text-slate-300 outline-none"
            />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Analytics Column */}
         <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
               <h3 className="font-bold text-slate-800 dark:text-white mb-4">Session Summary</h3>
               <div className="flex items-center justify-center h-48">
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
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#fff', color: '#1e293b' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
               </div>
               <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                   <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.present}</p>
                      <p className="text-[10px] uppercase font-bold text-blue-400 dark:text-blue-300">Active</p>
                   </div>
                   <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
                      <p className="text-[10px] uppercase font-bold text-green-400 dark:text-green-300">Done</p>
                   </div>
                   <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <p className="text-xl font-bold text-red-600 dark:text-red-400">{stats.absent}</p>
                      <p className="text-[10px] uppercase font-bold text-red-400 dark:text-red-300">Absent</p>
                   </div>
               </div>
            </div>

            {/* Arrival Timeline */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
               <h3 className="font-bold text-slate-800 dark:text-white mb-4">Arrival Distribution</h3>
               <div className="h-40">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timelineData}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
                       <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                       <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', backgroundColor: '#fff', color: '#1e293b'}} />
                       <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>
         </div>

         {/* Roster Table */}
         <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
               <h3 className="font-bold text-slate-800 dark:text-white">Student Roster</h3>
               <div className="flex gap-2">
                  <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><i className="fa-solid fa-filter"></i></button>
                  <button className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"><i className="fa-solid fa-download"></i></button>
               </div>
            </div>
            <div className="overflow-x-auto flex-1">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                     <tr>
                        <th className="px-6 py-3">Student Name</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Timestamps (In / Out)</th>
                        <th className="px-6 py-3">System Info</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                     {studentStatuses.map(student => (
                        <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                    student.status === 'ABSENT' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                 }`}>
                                    {student.name.charAt(0)}
                                 </div>
                                 <div>
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{student.name}</p>
                                    <p className="text-[10px] text-slate-400">{student.email}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                 student.status === 'PRESENT' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                 student.status === 'LATE' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                                 student.status === 'COMPLETED' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                              }`}>
                                 {student.status}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-xs font-mono text-slate-600 dark:text-slate-400">
                              {student.checkInTime ? (
                                 <div className="flex flex-col gap-1">
                                    <span className="flex items-center gap-1 text-green-700 dark:text-green-400">
                                       <i className="fa-solid fa-arrow-right-to-bracket text-[10px]"></i>
                                       {new Date(student.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                                    </span>
                                    {student.checkOutTime && (
                                       <span className="flex items-center gap-1 text-red-500 dark:text-red-400">
                                          <i className="fa-solid fa-arrow-right-from-bracket text-[10px]"></i>
                                          {new Date(student.checkOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                                       </span>
                                    )}
                                 </div>
                              ) : (
                                 <span className="text-slate-400">-</span>
                              )}
                           </td>
                           <td className="px-6 py-4">
                              {student.labName ? (
                                 <div>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{student.labName}</p>
                                    <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                                       <i className="fa-solid fa-desktop"></i>
                                       System #{student.systemNumber}
                                    </div>
                                 </div>
                              ) : (
                                 <span className="text-slate-400 text-xs italic">N/A</span>
                              )}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
    </div>
  );
};

export default AttendanceProgressPage;
