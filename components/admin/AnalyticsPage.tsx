import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, Booking } from '../../types';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { getAllBookings } from '../../services/bookingService';
import { getAttendanceLogs } from '../../services/attendanceService';
import { getAllLabs } from '../../services/labService';
import { getAllUsers } from '../../services/userService';
import { getAllTasks, getAllSubmissions } from '../../services/taskService';

interface Props {
    user: User;
}

const AnalyticsPage: React.FC<Props> = ({ user }) => {
    const [timeRange, setTimeRange] = useState<'WEEK' | 'MONTH' | 'SEMESTER'>('WEEK');
    const [heatmapLab, setHeatmapLab] = useState('ALL');
    const [loading, setLoading] = useState(true);

    // State for dynamic data
    const [bookingsList, setBookingsList] = useState<Booking[]>([]); // Store raw bookings for heatmap
    const [bookingTrendsData, setBookingTrendsData] = useState<any[]>([]);
    const [labUtilizationData, setLabUtilizationData] = useState<any[]>([]);
    const [taskCompletionData, setTaskCompletionData] = useState<any[]>([]);
    const [attendanceTrendData, setAttendanceTrendData] = useState<any[]>([]);
    const [activeFaculty, setActiveFaculty] = useState<any[]>([]);
    const [activeStudents, setActiveStudents] = useState<any[]>([]);

    useEffect(() => {
        calculateAnalytics();
    }, [timeRange]);

    // FIX: Converted to Async Function
    const calculateAnalytics = async () => {
        setLoading(true);
        try {
            // Fetch ALL data in parallel for speed
            const [bookings, logs, labs, users, tasks, submissions] = await Promise.all([
                getAllBookings(),
                getAttendanceLogs(),
                getAllLabs(),
                getAllUsers(),
                getAllTasks(),
                getAllSubmissions()
            ]);

            setBookingsList(bookings); // Save for useMemo heatmap

            // 1. Calculate Booking Trends (Group by Day)
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const trendMap = new Array(7).fill(0).map((_, i) => ({ name: days[i], bookings: 0, cancellations: 0 }));

            bookings.forEach(b => {
                const d = new Date(b.startTime);
                const dayIdx = d.getDay();
                if (b.status === 'REJECTED') {
                    trendMap[dayIdx].cancellations++;
                } else {
                    trendMap[dayIdx].bookings++;
                }
            });
            setBookingTrendsData(trendMap);

            // 2. Calculate Lab Utilization
            const utilData = labs.map(lab => {
                const activeCount = logs.filter(l => l.labId === lab.id && l.status === 'PRESENT').length;
                const totalLogs = logs.filter(l => l.labId === lab.id).length;
                return {
                    name: lab.name.split(' - ')[0],
                    usage: totalLogs > 0 ? Math.min(100, Math.round((activeCount / lab.capacity) * 100) + (totalLogs * 1)) : 0,
                    capacity: lab.capacity
                };
            });
            setLabUtilizationData(utilData);

            // 3. Task Completion (Real-time)
            const approved = submissions.filter(s => s.status === 'APPROVED').length;
            const pendingReview = submissions.filter(s => s.status === 'SUBMITTED').length;
            const rejected = submissions.filter(s => s.status === 'REJECTED').length;

            setTaskCompletionData([
                { name: 'Graded', value: approved, color: '#22c55e' },
                { name: 'Pending Review', value: pendingReview, color: '#f97316' },
                { name: 'Rejected', value: rejected, color: '#ef4444' },
            ]);

            // 4. Attendance Trends
            const attendanceByDay = new Array(5).fill(0); // 5 days work week
            logs.forEach(l => {
                const d = new Date(l.checkInTime).getDay();
                if (d >= 1 && d <= 5) attendanceByDay[d - 1]++;
            });

            setAttendanceTrendData([
                { name: 'Mon', percentage: Math.min(100, attendanceByDay[0] * 5) },
                { name: 'Tue', percentage: Math.min(100, attendanceByDay[1] * 5) },
                { name: 'Wed', percentage: Math.min(100, attendanceByDay[2] * 5) },
                { name: 'Thu', percentage: Math.min(100, attendanceByDay[3] * 5) },
                { name: 'Fri', percentage: Math.min(100, attendanceByDay[4] * 5) },
            ]);

            // 5. Active Faculty Leaderboard
            const facultyUsage = users
                .filter(u => u.role === UserRole.FACULTY)
                .map(f => {
                    const facBookings = bookings.filter(b => b.userId === f.id);
                    const hours = facBookings.reduce((acc, b) => {
                        return acc + (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 3600000;
                    }, 0);
                    return { name: f.name, bookings: facBookings.length, hours: Math.round(hours) };
                })
                .sort((a, b) => b.bookings - a.bookings)
                .slice(0, 5);
            setActiveFaculty(facultyUsage);

            // 6. Active Students Leaderboard
            const studentUsage = users
                .filter(u => u.role === UserRole.STUDENT)
                .map(s => {
                    const stuLogs = logs.filter(l => l.studentId === s.id);
                    const stuSubs = submissions.filter(sub => sub.studentId === s.id).length;
                    return { name: s.name, attendance: stuLogs.length, submissions: stuSubs };
                })
                .sort((a, b) => b.attendance - a.attendance)
                .slice(0, 5);
            setActiveStudents(studentUsage);

        } catch (error) {
            console.error("Failed to load analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    // 7. Heatmap Data (Derived from stored bookingsList)
    const currentHeatmapData = useMemo(() => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        const times = ['09-11', '11-01', '02-04', '04-06'];
        const data: { day: string, time: string, value: number }[] = [];

        days.forEach(day => {
            times.forEach(time => {
                let count = 0;
                bookingsList.forEach(b => {
                    const bDate = new Date(b.startTime);
                    const bDay = bDate.toLocaleDateString('en-US', { weekday: 'short' });
                    const bHour = bDate.getHours();

                    if (bDay === day && (heatmapLab === 'ALL' || b.labId === heatmapLab)) {
                        if (time === '09-11' && bHour >= 9 && bHour < 11) count++;
                        if (time === '11-01' && bHour >= 11 && bHour < 13) count++;
                        if (time === '02-04' && bHour >= 14 && bHour < 16) count++;
                        if (time === '04-06' && bHour >= 16 && bHour < 18) count++;
                    }
                });
                data.push({ day, time, value: Math.min(100, count * 20) });
            });
        });
        return data;
    }, [heatmapLab, bookingsList]); // Depend on bookingsList

    // --- Handlers ---

    const handleExportCSV = () => {
        const headers = "Metric,Value\n";
        const rows = [
            `Total Bookings,${bookingTrendsData.reduce((a, b) => a + b.bookings, 0)}`,
            `Avg Lab Usage,${(labUtilizationData.reduce((a, b) => a + b.usage, 0) / (labUtilizationData.length || 1)).toFixed(2)}%`,
            `Top Faculty,${activeFaculty[0]?.name || 'N/A'}`
        ].join('\n');

        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'lab_analytics_report.csv';
        a.click();
    };

    const handleExportPDF = () => {
        alert("Exporting PDF report...");
    };

    const getHeatmapColor = (value: number) => {
        if (value >= 80) return 'bg-blue-700';
        if (value >= 60) return 'bg-blue-500';
        if (value >= 40) return 'bg-blue-300';
        if (value >= 20) return 'bg-blue-200';
        return 'bg-blue-50 dark:bg-blue-900/40';
    };

    if (loading) {
        return <div className="text-center py-20 text-slate-500"><i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Generating Analytics...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Analytics Dashboard</h1>
                    <p className="text-slate-500 dark:text-slate-400">Comprehensive system insights and performance metrics.</p>
                </div>

                <div className="flex gap-3">
                    <div className="bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex">
                        {['WEEK', 'MONTH', 'SEMESTER'].map(range => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range as any)}
                                className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${timeRange === range ? 'bg-slate-800 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                    <button onClick={handleExportCSV} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 shadow-sm">
                        <i className="fa-solid fa-file-csv"></i> CSV
                    </button>
                    <button onClick={handleExportPDF} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2 shadow-sm">
                        <i className="fa-solid fa-file-pdf"></i> PDF
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Total Bookings</p>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{bookingTrendsData.reduce((a, b) => a + b.bookings, 0)}</h3>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">This {timeRange.toLowerCase()}</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center text-lg">
                            <i className="fa-solid fa-calendar-check"></i>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Avg Attendance</p>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                                {attendanceTrendData.length > 0 ? Math.round(attendanceTrendData.reduce((a: any, b: any) => a + b.percentage, 0) / 5) : 0}%
                            </h3>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Current avg</p>
                        </div>
                        <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg flex items-center justify-center text-lg">
                            <i className="fa-solid fa-users"></i>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Task Completion</p>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                                {taskCompletionData.find(d => d.name === 'Graded')?.value || 0}
                            </h3>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Graded Tasks</p>
                        </div>
                        <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center text-lg">
                            <i className="fa-solid fa-list-check"></i>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Peak Usage</p>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mt-1">
                                {currentHeatmapData.every(d => d.value === 0) ? '-' : (currentHeatmapData.sort((a, b) => b.value - a.value)[0]?.day + ' ' + currentHeatmapData.sort((a, b) => b.value - a.value)[0]?.time)}
                            </h3>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Highest Activity</p>
                        </div>
                        <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg flex items-center justify-center text-lg">
                            <i className="fa-solid fa-fire"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 1: Trends & Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Booking Trends */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-6">Booking Trends (Weekly)</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={bookingTrendsData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', backgroundColor: '#fff', color: '#1e293b' }} />
                                <Legend />
                                <Line type="monotone" dataKey="bookings" name="Total Bookings" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="cancellations" name="Cancellations" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Peak Usage Heatmap */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white">Peak Usage Times</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Heatmap intensity based on activity</p>
                        </div>
                        <select
                            value={heatmapLab}
                            onChange={(e) => setHeatmapLab(e.target.value)}
                            className="text-xs border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-slate-600 dark:text-slate-300 font-medium"
                        >
                            <option value="ALL">All Labs</option>
                            <option value="l1">Lab 1 (Prog)</option>
                            <option value="l2">Lab 2 (AI/ML)</option>
                            <option value="l3">Lab 3 (Net)</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-5 gap-1 mb-1">
                        <div className="text-[10px] text-slate-400 font-bold text-center"></div>
                        <div className="text-[10px] text-slate-400 font-bold text-center">09-11</div>
                        <div className="text-[10px] text-slate-400 font-bold text-center">11-01</div>
                        <div className="text-[10px] text-slate-400 font-bold text-center">02-04</div>
                        <div className="text-[10px] text-slate-400 font-bold text-center">04-06</div>
                    </div>

                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
                        <div key={day} className="grid grid-cols-5 gap-1 mb-1">
                            <div className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center">{day}</div>
                            {['09-11', '11-01', '02-04', '04-06'].map(time => {
                                const dataPoint = currentHeatmapData.find(d => d.day === day && d.time === time);
                                return (
                                    <div
                                        key={time}
                                        className={`h-8 rounded ${getHeatmapColor(dataPoint?.value || 0)} relative group cursor-help transition-colors duration-500`}
                                    >
                                        <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10 shadow-md">
                                            Activity: {dataPoint?.value}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ))}

                    <div className="flex justify-between items-center mt-4 text-[10px] text-slate-400">
                        <span>Low Usage</span>
                        <div className="flex gap-1">
                            <div className="w-3 h-3 bg-blue-50 dark:bg-blue-900/20 rounded"></div>
                            <div className="w-3 h-3 bg-blue-200 dark:bg-blue-800 rounded"></div>
                            <div className="w-3 h-3 bg-blue-300 dark:bg-blue-600 rounded"></div>
                            <div className="w-3 h-3 bg-blue-500 rounded"></div>
                            <div className="w-3 h-3 bg-blue-700 rounded"></div>
                        </div>
                        <span>Peak</span>
                    </div>
                </div>
            </div>

            {/* Section 2: Lab Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-6">Lab Utilization (%)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={labUtilizationData} layout="vertical" margin={{ left: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#94a3b8" opacity={0.2} />
                                <XAxis type="number" domain={[0, 100]} hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} width={80} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', backgroundColor: '#fff', color: '#1e293b' }} />
                                <Bar dataKey="usage" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-6">Task Completion Rates</h3>
                    <div className="h-64 flex flex-col items-center justify-center">
                        {taskCompletionData.every(d => d.value === 0) ? (
                            <div className="text-slate-400 text-sm">No task data available</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={taskCompletionData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {taskCompletionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', backgroundColor: '#fff', color: '#1e293b' }} />
                                    <Legend verticalAlign="bottom" />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-6">Attendance Trend</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={attendanceTrendData}>
                                <defs>
                                    <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 100]} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', backgroundColor: '#fff', color: '#1e293b' }} />
                                <Area type="monotone" dataKey="percentage" stroke="#8884d8" fillOpacity={1} fill="url(#colorAtt)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Section 3: Leaderboards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                        <h3 className="font-bold text-slate-800 dark:text-white">Most Active Faculty</h3>
                    </div>
                    <div className="p-0">
                        <table className="w-full text-left">
                            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Bookings</th>
                                    <th className="px-6 py-3">Lab Hours</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {activeFaculty.length === 0 ? (
                                    <tr><td colSpan={3} className="px-6 py-4 text-center text-slate-400 text-sm">No data available</td></tr>
                                ) : (
                                    activeFaculty.map((fac, i) => (
                                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                            <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-slate-300' : 'bg-orange-300'}`}>{i + 1}</span>
                                                {fac.name}
                                            </td>
                                            <td className="px-6 py-3 text-slate-600 dark:text-slate-300">{fac.bookings}</td>
                                            <td className="px-6 py-3 text-slate-600 dark:text-slate-300">{fac.hours} hrs</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                        <h3 className="font-bold text-slate-800 dark:text-white">Top Performing Students</h3>
                    </div>
                    <div className="p-0">
                        <table className="w-full text-left">
                            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Attendance</th>
                                    <th className="px-6 py-3">Submissions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {activeStudents.length === 0 ? (
                                    <tr><td colSpan={3} className="px-6 py-4 text-center text-slate-400 text-sm">No data available</td></tr>
                                ) : (
                                    activeStudents.map((stu, i) => (
                                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                            <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                                <span className="w-6 h-6 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                                                {stu.name}
                                            </td>
                                            <td className="px-6 py-3 text-green-600 dark:text-green-400 font-bold">{stu.attendance}</td>
                                            <td className="px-6 py-3 text-slate-600 dark:text-slate-300">{stu.submissions}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;