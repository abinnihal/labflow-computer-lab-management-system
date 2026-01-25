import React, { useState, useEffect } from 'react';
import { User, Booking, Task, AttendanceLog } from '../../types';
import {
  getStudentStatus,
  checkInStudent,
  checkOutStudent,
  getLogsByStudent,
  submitActivity
} from '../../services/attendanceService';
import { getNextLabSession, getAllBookings } from '../../services/bookingService';
import { getTasksForStudent } from '../../services/taskService';
import { Link } from 'react-router-dom';
import CheckInModal from '../attendance/CheckInModal';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Props {
  user: User;
}

const MiniCalendar: React.FC = () => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const calendarDays = [];

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const isToday = i === today.getDate();
    calendarDays.push(
      <div
        key={i}
        className={`h-8 w-8 flex items-center justify-center text-xs rounded-full ${isToday
          ? 'bg-blue-600 text-white font-bold shadow-md'
          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
      >
        {i}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 h-full transition-colors">
      <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex justify-between items-center">
        <span>{today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
        <i className="fa-regular fa-calendar text-slate-400"></i>
      </h3>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {days.map(d => (
          <div key={d} className="text-[10px] font-bold text-slate-400 uppercase">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 place-items-center">
        {calendarDays}
      </div>
    </div>
  );
};

const StudentDashboard: React.FC<Props> = ({ user }) => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<AttendanceLog | null>(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [attendanceAvg, setAttendanceAvg] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [nextBooking, setNextBooking] = useState<Booking | null>(null);
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // 1. Status Check (Now Async)
      const status = await getStudentStatus(user.id);
      setIsCheckedIn(status.isCheckedIn);
      setCurrentRecord(status.currentRecord);

      // 2. Attendance Avg
      try {
        const allBookings = await getAllBookings();
        const now = new Date();
        const pastBookings = allBookings.filter(b => {
          return new Date(b.endTime) < now && (b.userId === user.id);
        });

        const logs = await getLogsByStudent(user.id); // Async
        const completed = logs.filter(l => l.status === 'COMPLETED' || l.status === 'PRESENT').length;
        const totalSessions = Math.max(pastBookings.length, 1);

        setAttendanceAvg(Math.min(100, Math.round((completed / totalSessions) * 100)));
      } catch (error) {
        console.error("Error fetching stats:", error);
      }

      // 3. Next Lab
      try {
        const next = await getNextLabSession(user.id);
        setNextBooking(next);
      } catch (error) {
        console.error("Error fetching next session:", error);
      }

      // 4. Pending Tasks (Async)
      try {
        const tasksData = await getTasksForStudent(user.id);
        const pending = tasksData
          .filter(t => !t.submission || t.submission.status === 'REJECTED')
          .map(t => t.task);
        setPendingTasks(pending);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };

    fetchDashboardData();

  }, [user.id, refreshTrigger]);

  const handleToggleAttendance = async () => {
    if (isCheckedIn) {
      setProcessing(true);
      try {
        await checkOutStudent(user.id);
        await submitActivity(user, 'checkout', {
          recordId: currentRecord?.id,
          duration: '2h'
        });

        setIsCheckedIn(false);
        setCurrentRecord(null);
        setRefreshTrigger(prev => prev + 1);
      } catch (error) {
        alert("Failed to checkout");
      } finally {
        setProcessing(false);
      }
    } else {
      setShowCheckInModal(true);
    }
  };

  const processCheckIn = async (labId: string, systemNumber: number) => {
    setProcessing(true);
    setShowCheckInModal(false);
    try {
      const record = await checkInStudent(user, labId, systemNumber);

      await submitActivity(user, 'checkin', {
        labId,
        systemNumber,
        recordId: record.id
      });

      setIsCheckedIn(true);
      setCurrentRecord(record);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      alert("Failed to check in");
    } finally {
      setProcessing(false);
    }
  };

  const attendanceData = [
    { name: 'Attended', value: attendanceAvg, color: '#2563eb' },
    { name: 'Missed', value: 100 - attendanceAvg, color: '#e2e8f0' },
  ];

  const getMotivationalText = (val: number) => {
    if (val === 0) return "No sessions yet. Start attending!";
    if (val < 75) return "Attendance low. Catch up soon!";
    return "You are doing great! Maintain above 85%.";
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-700 dark:to-blue-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-1">Welcome, {user.name.split(' ')[0]}</h1>
          <p className="opacity-90 text-sm">You have <span className="font-bold">{pendingTasks.length} pending tasks</span> today.</p>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 transform skew-x-12"></div>
      </div>

      {/* Active Class / Check In Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 transition-colors">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 rounded-xl flex items-center justify-center text-2xl">
              <i className="fa-solid fa-computer"></i>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isCheckedIn ? 'Current Session Active' : 'Ready for Lab?'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isCheckedIn && currentRecord
                  ? `Checked in at ${new Date(currentRecord.checkInTime).toLocaleTimeString()}`
                  : nextBooking
                    ? `Next: ${nextBooking.subject} at ${new Date(nextBooking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'No upcoming lab sessions scheduled.'
                }
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleAttendance}
            disabled={processing}
            className={`w-full md:w-64 py-3.5 rounded-xl font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 text-lg transform hover:scale-[1.02] ${processing ? 'bg-slate-400 dark:bg-slate-600 cursor-wait' :
              isCheckedIn ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-green-600 hover:bg-green-700 shadow-green-500/20'
              }`}
          >
            {processing ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Processing...</>
            ) : isCheckedIn ? (
              <><i className="fa-solid fa-right-from-bracket"></i> Check Out</>
            ) : (
              <><i className="fa-solid fa-right-to-bracket"></i> Check In</>
            )}
          </button>
        </div>

        {isCheckedIn && currentRecord && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-6 text-sm">
            <div>
              <span className="text-slate-400 text-xs uppercase font-bold">Lab</span>
              <p className="font-semibold text-slate-700 dark:text-slate-300">{currentRecord.labId}</p>
            </div>
            <div>
              <span className="text-slate-400 text-xs uppercase font-bold">System</span>
              <p className="font-semibold text-slate-700 dark:text-slate-300">#{currentRecord.systemNumber}</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto">
        {/* 1. Attendance Avg */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex flex-col items-center justify-center relative transition-colors">
          <h3 className="w-full text-left font-bold text-slate-800 dark:text-white mb-2">Attendance Avg</h3>
          <div className="h-40 w-40 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={70}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  stroke="none"
                >
                  {attendanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-slate-800 dark:text-white">{attendanceAvg}%</span>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Present</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2">{getMotivationalText(attendanceAvg)}</p>
        </div>

        {/* 2. Calendar */}
        <div className="lg:h-full">
          <MiniCalendar />
        </div>

        {/* 3. Tasks */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col transition-colors">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
            <h3 className="font-bold text-slate-800 dark:text-white">Pending Tasks</h3>
            <Link to="/dashboard/tasks" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">View All</Link>
          </div>
          <div className="flex-1 overflow-y-auto p-2 max-h-[300px] lg:max-h-none">
            {pendingTasks.length > 0 ? (
              <div className="space-y-2">
                {pendingTasks.slice(0, 4).map(task => (
                  <div key={task.id} className="p-3 rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{task.title}</h4>
                      <span className="text-[10px] bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded font-bold">Due {task.dueDate}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{task.description}</p>
                    <div className="mt-2 flex justify-end">
                      <Link to="/dashboard/tasks" className="text-[10px] text-blue-600 dark:text-blue-400 font-bold group-hover:underline">Submit Now <i className="fa-solid fa-arrow-right ml-1"></i></Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
                <i className="fa-solid fa-clipboard-check text-3xl mb-2 opacity-50"></i>
                <p className="text-sm">All caught up!</p>
              </div>
            )}
          </div>
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

export default StudentDashboard;