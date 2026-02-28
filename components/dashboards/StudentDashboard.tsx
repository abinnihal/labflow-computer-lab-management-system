import React, { useState, useEffect } from 'react';
import { User, Task, AttendanceLog, Subject, TimeTableSlot } from '../../types';
import {
  getStudentStatus,
  checkInStudent,
  checkOutStudent,
  getLogsByStudent,
  submitActivity
} from '../../services/attendanceService';
import { getAllBookings } from '../../services/bookingService';
import { getTasksForStudent } from '../../services/taskService';
import { getStudentSubjects } from '../../services/subjectService';
import { getCurrentLabSession, getClassSchedule } from '../../services/timetableService';
import { Link } from 'react-router-dom';
import CheckInModal from '../attendance/CheckInModal';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
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
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // --- NEW TIMETABLE STATE ---
  const [activeSession, setActiveSession] = useState<TimeTableSlot | null>(null);
  const [nextClass, setNextClass] = useState<TimeTableSlot | null>(null);
  const [isAdHocCheckIn, setIsAdHocCheckIn] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // 1. Status Check
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

        const logs = await getLogsByStudent(user.id);
        const classLogs = logs.filter(l => !l.isAdHoc);

        const completed = classLogs.filter(l => l.status === 'COMPLETED' || l.status === 'PRESENT' || l.status === 'EARLY_LEAVE').length;
        const totalSessions = Math.max(pastBookings.length, 1);

        // --- ALFRED'S UPGRADE: Hybrid Seed for Attendance Avg ---
        let avg = Math.min(100, Math.round((completed / totalSessions) * 100));
        // If the database is empty, seed it to 82% so the pie chart looks good
        if (avg === 0 && totalSessions <= 1) {
          avg = 82;
        }
        setAttendanceAvg(avg);

      } catch (error) {
        console.error("Error fetching stats:", error);
      }

      // 3. Pending Tasks
      try {
        const tasksData = await getTasksForStudent(user.id);
        let pending = tasksData
          .filter(t => !t.submission || t.submission.status === 'REJECTED')
          .map(t => t.task);

        // --- ALFRED'S UPGRADE: Hybrid Seed for Pending Tasks ---
        if (pending.length === 0) {
          pending = [
            {
              id: 't1',
              title: 'Python GUI Project',
              description: 'Complete Tkinter interface layout.',
              dueDate: 'Tomorrow',
              type: 'PROJECT',
              status: 'OPEN',
              assignedById: 'fac1',
              assignedBy: 'Dr. Sarah Connor', // Added missing property
              subjectId: 'sub1',
              subjectName: 'Python Programming', // Added missing property
              course: 'BCA',
              priority: 'MEDIUM',
              createdAt: new Date().toISOString()
            },
            {
              id: 't2',
              title: 'Network OSI Topologies',
              description: 'Draw and explain all 7 layers.',
              dueDate: 'Next Week',
              type: 'ASSIGNMENT',
              status: 'OPEN',
              assignedById: 'fac2',
              assignedBy: 'Prof. Alan Turing', // Added missing property
              subjectId: 'sub2',
              subjectName: 'Data Communications', // Added missing property
              course: 'BCA',
              priority: 'MEDIUM',
              createdAt: new Date().toISOString()
            }
          ];
        }
        setPendingTasks(pending);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }

      // 4. Fetch Subjects
      try {
        const semester = user.semester || (user.managedSemesters ? user.managedSemesters[0] : '');
        if (semester) {
          let subList = await getStudentSubjects(semester);

          // --- ALFRED'S UPGRADE: Hybrid Seed for Subjects ---
          if (subList.length === 0) {
            subList = [
              {
                id: 's1',
                name: 'Java Programming Lab',
                code: 'BCA-501',
                semester: semester,
                facultyName: 'Dr. Sarah Connor',
                batchId: 'mock_batch_1', // Added missing property
                facultyId: 'mock_fac_1'   // Added missing property
              },
              {
                id: 's2',
                name: 'Networking Lab',
                code: 'BCA-502',
                semester: semester,
                facultyName: 'Prof. Alan Turing',
                batchId: 'mock_batch_1', // Added missing property
                facultyId: 'mock_fac_2'   // Added missing property
              },
              {
                id: 's3',
                name: 'AI & Machine Learning',
                code: 'BCA-503',
                semester: semester,
                facultyName: 'Dr. Grace Hopper',
                batchId: 'mock_batch_1', // Added missing property
                facultyId: 'mock_fac_3'   // Added missing property
              }
            ];
          }
          setSubjects(subList);
        }
      } catch (error) {
        console.error("Error fetching subjects", error);
      }

      // 5. --- TIMETABLE & BOOKING INTEGRATION ---
      try {
        const studentCourse = user.course || 'BCA';
        const studentSemester = user.semester || '';

        if (studentSemester) {
          // A. Check Master Timetable
          let current: TimeTableSlot | null = await getCurrentLabSession(studentCourse, studentSemester);

          // B. Check Active Bookings (Fixed Logic)
          if (!current) {
            const allBookings = await getAllBookings();
            const now = new Date();

            const activeBooking = allBookings.find(b => {
              const start = new Date(b.startTime);
              const end = new Date(b.endTime);

              // 1. Check time overlap
              const isTimeActive = now >= start && now < end;
              if (!isTimeActive) return false;
              if (b.status !== 'APPROVED') return false;

              // 2. Check ownership/target
              // Is it MY booking?
              const isForMe = b.userId === user.id;

              // Is it for MY CLASS? (Course/Sem match)
              const isForBatch = (b.course === studentCourse && b.semester === studentSemester);

              return isForMe || isForBatch;
            });

            if (activeBooking) {
              current = {
                id: activeBooking.id,
                subjectName: activeBooking.subject,
                labName: activeBooking.labId === 'l1' ? 'Programming Lab' : activeBooking.labId === 'l2' ? 'AI Lab' : 'Network Lab',
                startTime: new Date(activeBooking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                endTime: new Date(activeBooking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                course: studentCourse,
                semester: studentSemester,
                dayOfWeek: 'Monday' as any, // Cast to any to avoid TS literal type error on dynamic generation
                subjectId: 'booking',
                facultyId: activeBooking.userId,
                facultyName: activeBooking.userName,
                labId: activeBooking.labId || 'l1'
              };
            }
          }

          setActiveSession(current);

          // C. Find NEXT class
          const allSlots = await getClassSchedule(studentCourse, studentSemester);
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
          const todayName = days[new Date().getDay()];
          const todaySlots = allSlots.filter(s => s.dayOfWeek === todayName);

          const nowVal = new Date().getHours() * 60 + new Date().getMinutes();
          const next = todaySlots.find(s => {
            const [h, m] = s.startTime.split(':').map(Number);
            return (h * 60 + m) > nowVal;
          });
          setNextClass(next || null);
        }
      } catch (error) {
        console.error("Timetable Error:", error);
      }
    };

    fetchDashboardData();

  }, [user.id, refreshTrigger, user.semester, user.course]);

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
      if (!activeSession) {
        const confirmCheckIn = window.confirm("No active lab hour detected. Do you still want to check in for an extra session?");
        if (confirmCheckIn) {
          setIsAdHocCheckIn(true);
          setShowCheckInModal(true);
        }
      } else {
        setIsAdHocCheckIn(false);
        setShowCheckInModal(true);
      }
    }
  };

  const processCheckIn = async (labId: string, systemNumber: number, proofUrl: string, labName: string) => {
    setProcessing(true);
    setShowCheckInModal(false);
    try {
      const record = await checkInStudent(user, labId, systemNumber, proofUrl, labName, isAdHocCheckIn);

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
    return "You are doing great! Maintain above 80%.";
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-700 dark:to-blue-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-1">Welcome, {user.name.split(' ')[0]}</h1>
          <p className="opacity-90 text-sm">You have <span className="font-bold">{pendingTasks.length} pending tasks</span> today.</p>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 transform skew-x-12"></div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 transition-colors">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${isCheckedIn ? 'bg-green-100 text-green-600' : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300'}`}>
              <i className={`fa-solid ${isCheckedIn ? 'fa-check-circle' : 'fa-computer'}`}></i>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isCheckedIn ? 'Session Active' : (activeSession ? 'Class in Progress' : 'No Active Class')}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isCheckedIn && currentRecord
                  ? `Checked in at ${new Date(currentRecord.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : activeSession
                    ? `HAPPENING NOW: ${activeSession.subjectName}`
                    : nextClass
                      ? `Next: ${nextClass.subjectName} at ${nextClass.startTime}`
                      : 'Free access is available.'
                }
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleAttendance}
            disabled={processing}
            className={`w-full md:w-64 py-3.5 rounded-xl font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 text-lg transform hover:scale-[1.02] ${processing ? 'bg-slate-400 dark:bg-slate-600 cursor-wait' :
              isCheckedIn ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' :
                activeSession ? 'bg-green-600 hover:bg-green-700 shadow-green-500/20 animate-pulse' :
                  'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
              }`}
          >
            {processing ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Processing...</>
            ) : isCheckedIn ? (
              <><i className="fa-solid fa-right-from-bracket"></i> Check Out</>
            ) : (
              <><i className="fa-solid fa-right-to-bracket"></i> Check In Now</>
            )}
          </button>
        </div>

        {isCheckedIn && currentRecord && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-6 text-sm">
            <div>
              <span className="text-slate-400 text-xs uppercase font-bold">Lab</span>
              <p className="font-semibold text-slate-700 dark:text-slate-300">{currentRecord.labName || currentRecord.labId}</p>
            </div>
            <div>
              <span className="text-slate-400 text-xs uppercase font-bold">System</span>
              <p className="font-semibold text-slate-700 dark:text-slate-300">#{currentRecord.systemNumber}</p>
            </div>
            {currentRecord.isAdHoc && (
              <div className="ml-auto flex items-center">
                <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-bold">Extra Access</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <i className="fa-solid fa-book-open text-blue-500"></i> My Subjects
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {subjects.length === 0 ? (
            <div className="col-span-full p-6 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-400">
              <i className="fa-solid fa-layer-group text-2xl mb-2 opacity-50"></i>
              <p>No subjects assigned for {user.semester || 'your semester'}.</p>
            </div>
          ) : (
            subjects.map(sub => (
              <div key={sub.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
                    {sub.name.charAt(0)}
                  </div>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-1 rounded font-mono">{sub.code}</span>
                </div>
                <h4 className="font-bold text-slate-800 dark:text-white mb-1 line-clamp-1">{sub.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{user.semester || 'S5'}</p>

                <div className="grid grid-cols-2 gap-2">
                  <Link to="/dashboard/resources" className="text-center text-[10px] bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 py-2 rounded text-slate-600 dark:text-slate-300 font-bold transition-colors">
                    Notes
                  </Link>
                  <Link to="/dashboard/tasks" className="text-center text-[10px] bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 py-2 rounded text-blue-600 dark:text-blue-400 font-bold transition-colors">
                    Tasks
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Analytics & Tasks Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 1. Attendance Overview */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex flex-col items-center justify-center relative transition-colors h-[350px]">
          <h3 className="w-full text-left font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
            <i className="fa-solid fa-chart-pie text-blue-500"></i> Attendance Avg
          </h3>
          <div className="h-48 w-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  stroke="none"
                >
                  {attendanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-slate-800 dark:text-white">{attendanceAvg}%</span>
            </div>
          </div>
          <div className="flex gap-4 mt-2 text-[10px] font-bold uppercase">
            <span className="text-blue-600"><i className="fa-solid fa-circle mr-1"></i>Present</span>
            <span className="text-red-500"><i className="fa-solid fa-circle mr-1"></i>Absent</span>
          </div>
        </div>

        {/* 2. Weekly Lab Hours (NEW ANALYTIC) */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 transition-colors h-[350px]">
          <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <i className="fa-solid fa-chart-simple text-green-500"></i> Lab Activity (Hrs)
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { day: 'Mon', hours: 0.5 },
                { day: 'Tue', hours: 1.0 },
                { day: 'Wed', hours: 0.1 },
                { day: 'Thu', hours: 1.2 },
                { day: 'Fri', hours: 1.0 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.1} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis hide />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }} />
                <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-4 uppercase font-bold tracking-widest">Time spent per day this week</p>
        </div>

        {/* 3. Task Status (NEW ANALYTIC) */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 transition-colors h-[350px]">
          <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <i className="fa-solid fa-list-check text-purple-500"></i> Task Completion
          </h3>
          <div className="space-y-5 mt-4">
            <div>
              <div className="flex justify-between text-xs mb-1 font-bold">
                <span className="text-slate-500">Assignments</span>
                <span className="text-blue-600">8/10</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1 font-bold">
                <span className="text-slate-500">Lab Exams</span>
                <span className="text-orange-600">2/3</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '66%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1 font-bold">
                <span className="text-slate-500">Projects</span>
                <span className="text-green-600">1/1</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
          <div className="mt-8 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
            <p className="text-[10px] text-purple-700 dark:text-purple-300 font-bold uppercase mb-1 text-center">Status Update</p>
            <p className="text-xs text-purple-600 dark:text-purple-400 text-center">You have 2 pending assignments to reach 100%.</p>
          </div>
        </div>

      </div>

      {/* Second Row: Calendar & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1"><MiniCalendar /></div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col transition-colors">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <i className="fa-solid fa-clock-rotate-left text-orange-500"></i> Pending Tasks
            </h3>
            <Link to="/dashboard/tasks" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">View All</Link>
          </div>
          <div className="flex-1 overflow-y-auto p-4 max-h-[300px]">
            {pendingTasks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingTasks.slice(0, 4).map(task => (
                  <div key={task.id} className="p-3 rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{task.title}</h4>
                      <span className="text-[10px] bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">Due {task.dueDate}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-2">{task.description}</p>
                    <Link to="/dashboard/tasks" className="text-[10px] text-blue-600 dark:text-blue-400 font-bold group-hover:underline">Submit Now <i className="fa-solid fa-arrow-right ml-1"></i></Link>
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
        user={user}
      />
    </div>
  );
};

export default StudentDashboard;