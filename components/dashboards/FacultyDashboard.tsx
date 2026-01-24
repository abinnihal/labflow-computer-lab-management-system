import React, { useEffect, useState, useMemo } from 'react';
import { User, UserRole, Lab } from '../../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { getUpcomingEvents, GCalEvent } from '../../services/googleCalendarService';
import { getAttendanceLogs, AttendanceRecord, getActivitiesForFaculty, StudentActivity, manualCheckIn } from '../../services/attendanceService';
import { getPendingSubmissionsCount } from '../../services/taskService';
import { getPendingMaintenanceCount } from '../../services/maintenanceService';
import { getAllLabs } from '../../services/labService';
import BookingModal from '../bookings/BookingModal';
import ApprovalList from '../approvals/ApprovalList';
import { getPendingUsersByRole } from '../../services/userService';
import { MOCK_ROSTER } from '../../constants';

interface Props {
  user: User;
}

// Course Mapping based on Department & Level (Mock Data Structure preserved for UI logic)
const COURSES_BY_LEVEL: Record<string, Record<string, string[]>> = {
  'Computer Science': {
    UG: ['BCA', 'B.Sc CS', 'B.Tech CSE'],
    PG: ['MCA', 'M.Sc CS', 'M.Tech CSE']
  },
  'Information Technology': {
    UG: ['B.Tech IT', 'B.Sc IT'],
    PG: ['M.Tech IT', 'M.Sc IT']
  },
  // Fallback for demo
  'default': {
    UG: ['BCA', 'B.Sc'],
    PG: ['MCA', 'M.Sc']
  }
};

const FacultyDashboard: React.FC<Props> = ({ user }) => {
  const [schedule, setSchedule] = useState<GCalEvent[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>([]);
  const [studentActivities, setStudentActivities] = useState<StudentActivity[]>([]);

  // Real-time Stats
  const [pendingGrading, setPendingGrading] = useState(0);
  const [labIssues, setLabIssues] = useState(0);
  const [labs, setLabs] = useState<Lab[]>([]);

  // Tabs & Modal State
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'APPROVALS' | 'ACTIVITIES'>('OVERVIEW');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Manual Entry Form
  const [manualEntryData, setManualEntryData] = useState({ studentId: '', labId: '', status: 'PRESENT' as 'PRESENT' | 'LATE' });

  // --- Class Selection State ---
  const initialLevel = user.programType === 'PG' ? 'PG' : 'UG';
  const [selectedLevel, setSelectedLevel] = useState<'UG' | 'PG'>(initialLevel);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');

  // Derived Options
  const availableCourses = useMemo(() => {
    const deptCourses = COURSES_BY_LEVEL[user.department || 'default'] || COURSES_BY_LEVEL['default'];
    if (user.programType === 'UG' && selectedLevel === 'PG') return [];
    if (user.programType === 'PG' && selectedLevel === 'UG') return [];
    return deptCourses[selectedLevel] || [];
  }, [user.department, user.programType, selectedLevel]);

  // Set default course when level changes
  useEffect(() => {
    if (availableCourses.length > 0) {
      setSelectedCourse(availableCourses[0]);
    } else {
      setSelectedCourse('');
    }
  }, [availableCourses]);

  // Set default semester when course changes (or managedSemesters load)
  useEffect(() => {
    if (user.managedSemesters && user.managedSemesters.length > 0) {
      setSelectedSemester(user.managedSemesters[0]);
    }
  }, [selectedCourse, user.managedSemesters]);


  useEffect(() => {
    refreshData();
  }, [activeTab, user.department, user.managedSemesters, user.id]);

  const refreshData = async () => {
    // 1. Load Calendar
    const events = await getUpcomingEvents();
    const today = new Date().toDateString();
    const todaysEvents = events.filter(e => {
      const eDate = e.start.dateTime ? new Date(e.start.dateTime) : null;
      return eDate && eDate.toDateString() === today;
    });
    setSchedule(todaysEvents.length > 0 ? todaysEvents : events.slice(0, 3));
    setLoadingSchedule(false);

    // 2. Load Attendance & Labs (ASYNC FIX)
    setAttendanceLogs(getAttendanceLogs());
    const labsData = await getAllLabs();
    setLabs(labsData);

    // 3. Load Student Activities
    if (user.department && user.managedSemesters) {
      setStudentActivities(getActivitiesForFaculty(user.department, user.managedSemesters));
    }

    // 4. Check pending students (ASYNC FIX)
    const pendingStudents = await getPendingUsersByRole(UserRole.STUDENT, user.department, user.managedSemesters);
    setPendingCount(pendingStudents.length);

    // 5. Load Task & Issue Stats
    setPendingGrading(getPendingSubmissionsCount(user.id));
    setLabIssues(getPendingMaintenanceCount(user.id));
  };

  const handleManualCheckIn = () => {
    if (manualEntryData.studentId && manualEntryData.labId) {
      manualCheckIn(manualEntryData.studentId, manualEntryData.labId, manualEntryData.status);
      setIsManualEntryOpen(false);
      refreshData(); // Reload logs
      setManualEntryData({ studentId: '', labId: labs[0]?.id || '', status: 'PRESENT' });
    }
  };

  // Dynamic Graph Data from logs
  const graphData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dataMap = days.map(day => ({ name: day, present: 0, absent: 0 }));

    attendanceLogs.forEach(log => {
      const d = new Date(log.checkInTime).getDay();
      if (dataMap[d]) {
        dataMap[d].present += 1;
      }
    });
    // Filter out weekends for the view
    return dataMap.filter((_, i) => i !== 0 && i !== 6);
  }, [attendanceLogs]);

  // Helper to get active utilization per lab
  const getLabUtilization = (labId: string) => {
    return attendanceLogs.filter(l => l.labId === labId && l.status === 'PRESENT').length;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Faculty Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Overview of your labs and student performance.</p>
        </div>

        <div className="flex gap-4 items-center">
          <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'OVERVIEW' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('ACTIVITIES')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'ACTIVITIES' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              Activities
            </button>
            <button
              onClick={() => setActiveTab('APPROVALS')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'APPROVALS' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              Approvals
              {pendingCount > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'APPROVALS' ? 'bg-white text-blue-600' : 'bg-red-50 text-white'}`}>
                  {pendingCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsManualEntryOpen(true)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2.5 rounded-lg font-medium shadow-sm flex items-center gap-2"
            >
              <i className="fa-solid fa-user-check"></i> Manual Entry
            </button>
            <button
              onClick={() => setIsBookingModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm flex items-center gap-2"
            >
              <i className="fa-solid fa-plus"></i> Book Lab
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'APPROVALS' && (
        <ApprovalList targetRole={UserRole.STUDENT} department={user.department} managedSemesters={user.managedSemesters} />
      )}

      {activeTab === 'ACTIVITIES' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in-up">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-white">Student Activity Feed (Dept: {user.department})</h3>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex gap-2">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Present</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Late</span>
            </div>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {studentActivities.length === 0 ? (
              <div className="p-12 text-center text-slate-400 dark:text-slate-500 italic">No activity recorded for your assigned semesters.</div>
            ) : (
              studentActivities.map(act => (
                <div key={act.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4 items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${act.activityType === 'checkin' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                          act.activityType === 'checkout' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                            act.activityType === 'task' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                              'bg-orange-100 dark:bg-orange-900/30 text-orange-600'
                        }`}>
                        <i className={`fa-solid ${act.activityType === 'checkin' ? 'fa-arrow-right-to-bracket' :
                            act.activityType === 'checkout' ? 'fa-arrow-right-from-bracket' :
                              act.activityType === 'task' ? 'fa-file-lines' :
                                'fa-comment-dots'
                          }`}></i>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">{act.studentName}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{act.activityType}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 font-mono">{new Date(act.timestamp).toLocaleTimeString()}</p>
                      {act.status && (
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${act.status === 'present' ? 'bg-green-100 dark:bg-green-900/30 text-green-700' :
                            act.status === 'late' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700' :
                              'bg-red-100 dark:bg-red-900/30 text-red-700'
                          }`}>
                          {act.status}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 ml-14 bg-slate-50 dark:bg-slate-900/30 p-2 rounded text-xs text-slate-600 dark:text-slate-300 font-mono border border-slate-100 dark:border-slate-800">
                    {JSON.stringify(act.activityPayload)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'OVERVIEW' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Upcoming Classes', val: schedule.length.toString(), icon: 'fa-chalkboard-user', color: 'bg-blue-500' },
              { label: 'Pending Grading', val: pendingGrading.toString(), icon: 'fa-file-signature', color: 'bg-orange-500' },
              { label: 'Live Attendance', val: attendanceLogs.filter(l => l.status === 'PRESENT').length.toString(), icon: 'fa-users', color: 'bg-green-500' },
              { label: 'Lab Issues', val: labIssues.toString(), icon: 'fa-triangle-exclamation', color: 'bg-red-500' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between transition-colors">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{stat.val}</p>
                </div>
                <div className={`w-10 h-10 ${stat.color} bg-opacity-10 rounded-lg flex items-center justify-center`}>
                  <i className={`fa-solid ${stat.icon} ${stat.color.replace('bg-', 'text-')}`}></i>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Attendance Monitor Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <h3 className="font-bold text-slate-800 dark:text-white">Class Attendance Overview</h3>

                  {/* Updated Class Selector UI */}
                  <div className="flex flex-wrap items-center gap-2">
                    {user.programType === 'BOTH' && (
                      <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5 flex">
                        <button
                          onClick={() => setSelectedLevel('UG')}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${selectedLevel === 'UG' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                          UG
                        </button>
                        <button
                          onClick={() => setSelectedLevel('PG')}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${selectedLevel === 'PG' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                          PG
                        </button>
                      </div>
                    )}

                    {/* Course Selector */}
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-lg text-slate-600 px-2 py-1 outline-none max-w-[120px]"
                      disabled={availableCourses.length === 0}
                    >
                      {availableCourses.length > 0 ? (
                        availableCourses.map(course => (
                          <option key={course} value={course}>{course}</option>
                        ))
                      ) : (
                        <option value="">No Courses</option>
                      )}
                    </select>

                    {/* Semester Selector */}
                    <select
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                      className="text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-lg text-slate-600 px-2 py-1 outline-none"
                      disabled={!user.managedSemesters || user.managedSemesters.length === 0}
                    >
                      {user.managedSemesters && user.managedSemesters.length > 0 ? (
                        user.managedSemesters.map(sem => (
                          <option key={sem} value={sem}>{sem} Sem</option>
                        ))
                      ) : (
                        <option value="">No Semesters</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={graphData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#fff', color: '#1e293b' }}
                      />
                      <Legend />
                      <Bar dataKey="present" name="Present" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 dark:text-white">Recent Check-ins (Live)</h3>
                  <button className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">View All Logs</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 dark:bg-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Student Name</th>
                        <th className="px-6 py-3">Check In</th>
                        <th className="px-6 py-3">Check Out</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {attendanceLogs.slice(0, 5).map(log => (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="px-6 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">{log.studentName}</td>
                          <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400 font-mono text-xs">{new Date(log.checkInTime).toLocaleTimeString()}</td>
                          <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400 font-mono text-xs">{log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString() : '-'}</td>
                          <td className="px-6 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${log.status === 'PRESENT' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}`}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {attendanceLogs.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500 italic">No live check-ins.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Today's Schedule & Quick Stats */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800 dark:text-white">Schedule</h3>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-2 py-1 rounded flex items-center gap-1">
                    <i className="fa-brands fa-google"></i> Synced
                  </span>
                </div>

                {loadingSchedule ? (
                  <div className="space-y-4 animate-pulse">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex gap-4">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded"></div>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded h-10"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {schedule.map((event, idx) => (
                      <div key={event.id} className="flex gap-4 group">
                        <div className="flex flex-col items-center min-w-[3rem]">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            {event.start.dateTime ? new Date(event.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'All Day'}
                          </span>
                          {idx !== schedule.length - 1 && <div className="h-full w-0.5 bg-slate-200 dark:bg-slate-700 my-1 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors"></div>}
                        </div>
                        <div className={`p-3 rounded-r-lg w-full border-l-4 ${idx % 2 === 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' : 'bg-purple-50 dark:bg-purple-900/20 border-purple-500'}`}>
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{event.summary}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{event.location || 'Remote'}</p>
                        </div>
                      </div>
                    ))}
                    {schedule.length === 0 && <p className="text-sm text-slate-500 italic">No events scheduled for today.</p>}
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                <h3 className="font-bold text-slate-800 dark:text-white mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  {labs.slice(0, 3).map(lab => {
                    const active = getLabUtilization(lab.id);
                    const percentage = Math.min(100, (active / lab.capacity) * 100);
                    return (
                      <div key={lab.id}>
                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                          <span>{lab.name.split('-')[0]} Cap.</span>
                          <span>{active}/{lab.capacity}</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${percentage > 80 ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                  {labs.length === 0 && <p className="text-xs text-slate-400 italic">No labs configured.</p>}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {isBookingModalOpen && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          user={user}
        />
      )}

      {/* Manual Entry Modal */}
      {isManualEntryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
              <h2 className="text-lg font-bold">Manual Attendance</h2>
              <button onClick={() => setIsManualEntryOpen(false)} className="text-slate-400 hover:text-white"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Student</label>
                <select
                  className="w-full border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-sm dark:bg-slate-700 dark:text-white"
                  value={manualEntryData.studentId}
                  onChange={(e) => setManualEntryData({ ...manualEntryData, studentId: e.target.value })}
                >
                  <option value="">Select Student</option>
                  {MOCK_ROSTER.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Lab</label>
                <select
                  className="w-full border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-sm dark:bg-slate-700 dark:text-white"
                  value={manualEntryData.labId}
                  onChange={(e) => setManualEntryData({ ...manualEntryData, labId: e.target.value })}
                >
                  <option value="">Select Lab</option>
                  {labs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Status</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setManualEntryData({ ...manualEntryData, status: 'PRESENT' })}
                    className={`flex-1 py-2 text-sm font-bold rounded ${manualEntryData.status === 'PRESENT' ? 'bg-green-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                  >
                    Present
                  </button>
                  <button
                    onClick={() => setManualEntryData({ ...manualEntryData, status: 'LATE' })}
                    className={`flex-1 py-2 text-sm font-bold rounded ${manualEntryData.status === 'LATE' ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                  >
                    Late
                  </button>
                </div>
              </div>
              <button
                onClick={handleManualCheckIn}
                disabled={!manualEntryData.studentId || !manualEntryData.labId}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow-sm disabled:opacity-50 mt-2"
              >
                Mark Attendance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;