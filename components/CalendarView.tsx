import React, { useState, useEffect } from 'react';
import { getAllBookings } from '../services/bookingService';
import { getClassSchedule } from '../services/timetableService';
import { User, UserRole, TimeTableSlot } from '../types';
import BookingModal from './bookings/BookingModal';
import TerminalLoader from './ui/TerminalLoader';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

// Constants (Matched with MasterTimeTablePage)
const COURSES = ['BCA', 'B.Sc Computer Science', 'B.Tech CSE', 'MCA', 'M.Sc Computer Science'];
const SEMESTERS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];

interface GCalEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  status?: string;
  type?: 'BOOKING' | 'CLASS';
}

interface Props {
  user?: User;
}

const CalendarView: React.FC<Props> = ({ user }) => {
  const [events, setEvents] = useState<GCalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'MONTH' | 'WEEK' | 'DAY'>('DAY');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Context State
  const [activeContext, setActiveContext] = useState<{ name: string, course: string, semester: string } | null>(null);

  // Admin Filter State
  const [adminFilter, setAdminFilter] = useState({ course: '', semester: '' });

  useEffect(() => {
    fetchData();
  }, [adminFilter, user]);

  const fetchData = async () => {
    setLoading(true);
    const allEvents: GCalEvent[] = [];

    try {
      // ---------------------------------------------------------
      // 1. DETERMINE FILTER CONTEXT
      // ---------------------------------------------------------
      let filter: { name: string, course: string, semester: string } | null = null;

      if (user?.role === UserRole.ADMIN) {
        if (adminFilter.course && adminFilter.semester) {
          filter = { ...adminFilter, name: 'Master Schedule' };
        }
      } else if (user?.role === UserRole.STUDENT) {
        if (user.course && user.semester) {
          filter = {
            name: 'My Class',
            course: user.course,
            semester: user.semester
          };
          setActiveContext(filter);
        }
      } else {
        const activeSubjectId = localStorage.getItem('activeSubjectId');
        if (activeSubjectId) {
          const subDoc = await getDoc(doc(db, 'subjects', activeSubjectId));
          if (subDoc.exists()) {
            filter = {
              name: subDoc.data().name,
              course: subDoc.data().course || 'BCA',
              semester: subDoc.data().semester || 'S1'
            };
            setActiveContext(filter);
          }
        } else {
          setActiveContext(null);
        }
      }

      // ---------------------------------------------------------
      // 2. FETCH & FILTER BOOKINGS
      // ---------------------------------------------------------
      const systemBookings = await getAllBookings();
      const mappedBookings = systemBookings
        .filter(b => {
          const status = b.status as string;
          if (status === 'REJECTED' || status === 'CANCELLED') return false;

          // Admin sees all approved bookings
          if (user?.role === UserRole.ADMIN) return true;

          if (user && b.userId === user.id) return true;

          if (user?.role === UserRole.STUDENT) {
            const bCourse = b.course?.toLowerCase().trim() || '';
            const bSem = b.semester?.toLowerCase().trim() || '';
            const uCourse = user.course?.toLowerCase().trim() || '';
            const uSem = user.semester?.toLowerCase().trim() || '';
            if (bCourse && bSem && bCourse === uCourse && bSem === uSem) return true;
          }

          if (filter) {
            if (b.course === filter.course && b.semester === filter.semester) return true;
            return false;
          }
          return true;
        })
        .map(b => ({
          id: b.id,
          summary: b.subject,
          description: `Booked by ${b.userName}. Status: ${b.status}`,
          location: b.labId === 'l1' ? 'Lab 1 (Prog)' : 'Lab 2 (AI)',
          start: { dateTime: b.startTime },
          end: { dateTime: b.endTime },
          status: b.status,
          type: 'BOOKING' as const
        }));

      allEvents.push(...mappedBookings);

      // ---------------------------------------------------------
      // 3. FETCH MASTER TIMETABLE (Admin vs Faculty Logic)
      // ---------------------------------------------------------

      // ADMIN: If no filter is active, fetch EVERYTHING for a full calendar
      if (user?.role === UserRole.ADMIN && !filter) {
        const allSlotsPromises = COURSES.flatMap(c =>
          SEMESTERS.slice(0, 6).map(s => getClassSchedule(c, s))
        );
        const allResults = await Promise.all(allSlotsPromises);
        const flattenedSlots = allResults.flat();
        allEvents.push(...generateRecurringEvents(flattenedSlots, currentDate));
      }
      // FILTERED (Student/Faculty/Admin with dropdowns)
      else if (filter) {
        const rawTimeTableSlots = await getClassSchedule(filter.course, filter.semester);
        let filteredSlots = rawTimeTableSlots;

        // ONLY Faculty should have their recurring classes hidden if the subject doesn't match
        if (user?.role === UserRole.FACULTY && filter.name !== 'Master Schedule' && filter.name !== 'My Class') {
          filteredSlots = rawTimeTableSlots.filter(
            slot => slot.subjectName.toLowerCase().trim() === filter!.name.toLowerCase().trim()
          );
        }

        const generatedClasses = generateRecurringEvents(filteredSlots, currentDate);
        allEvents.push(...generatedClasses);
      }

      allEvents.sort((a, b) => {
        const dateA = new Date(a.start.dateTime || a.start.date || '');
        const dateB = new Date(b.start.dateTime || b.start.date || '');
        return dateA.getTime() - dateB.getTime();
      });

      setEvents(allEvents);

    } catch (error) {
      console.error("Error loading calendar:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper: Generate Recurring Events for Current Month
  const generateRecurringEvents = (slots: TimeTableSlot[], refDate: Date): GCalEvent[] => {
    const events: GCalEvent[] = [];
    const year = refDate.getFullYear();
    const month = refDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dayName = dayNames[date.getDay()];

      const daySlots = slots.filter(s => s.dayOfWeek === dayName);

      daySlots.forEach(slot => {
        const startDT = new Date(year, month, d, ...slot.startTime.split(':').map(Number));
        const endDT = new Date(year, month, d, ...slot.endTime.split(':').map(Number));

        events.push({
          id: `class-${slot.id}-${d}`,
          summary: slot.subjectName,
          description: `Faculty: ${slot.facultyName}`,
          location: slot.labName || 'Classroom',
          start: { dateTime: startDT.toISOString() },
          end: { dateTime: endDT.toISOString() },
          status: 'APPROVED',
          type: 'CLASS'
        });
      });
    }
    return events;
  };

  const getEventStyle = (ev: GCalEvent) => {
    if (ev.type === 'CLASS') return 'bg-purple-100 border-purple-200 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200 dark:border-purple-800';
    if (ev.status === 'PENDING') return 'bg-orange-100 border-orange-200 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-800';
    if (ev.status === 'APPROVED') return 'bg-green-100 border-green-200 text-green-800 dark:bg-green-900/40 dark:text-green-200 dark:border-green-800';
    return 'bg-blue-100 border-blue-200 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-800';
  };

  // --- Render Helpers ---
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(<div key={`empty-${i}`} className="h-24 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700"></div>);

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = new Date(year, month, i).toDateString();
      const dayEvents = events.filter(e => {
        const eDate = e.start.dateTime ? new Date(e.start.dateTime) : null;
        return eDate && eDate.toDateString() === dateStr;
      });
      const isToday = i === new Date().getDate() && month === new Date().getMonth();

      days.push(
        <div key={i} className={`h-24 border border-slate-100 dark:border-slate-700 p-2 relative group ${isToday ? 'bg-blue-50 dark:bg-slate-800' : 'bg-white dark:bg-slate-900'}`}>
          <span className={`text-sm font-medium ${isToday ? 'text-blue-600 bg-blue-100 w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-700 dark:text-slate-300'}`}>{i}</span>
          <div className="mt-1 space-y-1 overflow-y-auto max-h-16 custom-scrollbar">
            {dayEvents.map(ev => (
              <div key={ev.id} className={`text-[10px] px-1.5 py-0.5 rounded truncate border flex justify-between items-center ${getEventStyle(ev)}`} title={ev.summary}>
                <span className="truncate">
                  {ev.type === 'CLASS' && <i className="fa-solid fa-book mr-1 opacity-50"></i>}
                  {ev.start.dateTime && new Date(ev.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {ev.summary}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    const day = currentDate.getDay();
    startOfWeek.setDate(currentDate.getDate() - day);
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      const dateStr = dayDate.toDateString();
      const dayEvents = events.filter(e => {
        const eDate = e.start.dateTime ? new Date(e.start.dateTime) : null;
        return eDate && eDate.toDateString() === dateStr;
      });
      weekDays.push(
        <div key={i} className="flex-1 min-w-[100px] border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="p-2 border-b text-center"><span className="font-bold">{dayDate.getDate()}</span> <span className="text-xs">{dayDate.toLocaleDateString('en-US', { weekday: 'short' })}</span></div>
          <div className="p-2 space-y-2 max-h-[500px] overflow-y-auto">
            {dayEvents.map(ev => (
              <div key={ev.id} className={`p-2 rounded text-xs border ${getEventStyle(ev)}`}>
                <div className="font-bold">{ev.summary}</div>
                <div className="opacity-70">{ev.start.dateTime ? new Date(ev.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return <div className="flex h-[600px] border-t overflow-x-auto">{weekDays}</div>;
  };

  const renderDayView = () => {
    const dateStr = currentDate.toDateString();
    const dayEvents = events.filter(e => {
      const eDate = e.start.dateTime ? new Date(e.start.dateTime) : null;
      return eDate && eDate.toDateString() === dateStr;
    });
    return (
      <div className="p-6 bg-white dark:bg-slate-900 min-h-[500px]">
        <h2 className="text-2xl font-bold mb-6 text-center dark:text-white">{currentDate.toDateString()}</h2>
        <div className="space-y-3 max-w-3xl mx-auto">
          {dayEvents.length === 0 && <p className="text-center text-slate-400">No events.</p>}
          {dayEvents.map(ev => (
            <div key={ev.id} className="flex gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <div className="min-w-[80px] font-bold text-slate-700 dark:text-slate-300">
                {ev.start.dateTime ? new Date(ev.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'All Day'}
              </div>
              <div>
                <h4 className="font-bold dark:text-white">{ev.summary} {ev.type === 'CLASS' && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 rounded ml-2">CLASS</span>}</h4>
                <p className="text-sm text-slate-500">{ev.location}</p>
                {ev.description && <p className="text-xs text-slate-400 mt-1">{ev.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const isFacultyOrAdmin = user?.role === UserRole.FACULTY || user?.role === UserRole.ADMIN;
  const isAdmin = user?.role === UserRole.ADMIN;

  return (
    <div className="space-y-6">

      {/* 1. TOP HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            {isAdmin ? 'Master Calendar' : 'Calendar & Schedule'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            <i className="fa-solid fa-calendar-days mr-2"></i>
            {isAdmin
              ? (adminFilter.course ? `Filtered View: ${adminFilter.course} ${adminFilter.semester}` : 'Global Schedule (All Events)')
              : (activeContext && user?.role !== UserRole.STUDENT ? `Schedule for ${activeContext.name}` : 'My Schedule')
            }
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {isFacultyOrAdmin && (
            <button
              onClick={() => setIsBookingModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2 transition-colors"
            >
              <i className="fa-solid fa-plus"></i> {isAdmin ? 'Add Event' : 'Book Session'}
            </button>
          )}
          <div className="flex gap-1 bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
            <button onClick={() => setViewMode('DAY')} className={`px-3 py-1.5 text-sm font-bold rounded ${viewMode === 'DAY' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Day</button>
            <button onClick={() => setViewMode('WEEK')} className={`px-3 py-1.5 text-sm font-bold rounded ${viewMode === 'WEEK' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Week</button>
            <button onClick={() => setViewMode('MONTH')} className={`px-3 py-1.5 text-sm font-bold rounded ${viewMode === 'MONTH' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Month</button>
          </div>
        </div>
      </div>

      {/* 2. ADMIN FILTERS */}
      {isAdmin ? (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between animate-fade-in-down">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
            <i className="fa-solid fa-filter text-blue-500"></i>
            <span className="text-sm">Filter View:</span>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={adminFilter.course}
              onChange={(e) => setAdminFilter(prev => ({ ...prev, course: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select Course</option>
              {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={adminFilter.semester}
              onChange={(e) => setAdminFilter(prev => ({ ...prev, semester: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select Semester</option>
              {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {(adminFilter.course || adminFilter.semester) && (
              <button
                onClick={() => setAdminFilter({ course: '', semester: '' })}
                className="text-red-500 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900/30 px-3 py-2 rounded-lg transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      ) : (
        // FACULTY CONTEXT BANNER (Hidden for Students)
        activeContext && user?.role !== UserRole.STUDENT && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center gap-3 animate-fade-in-down">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-300">
              <i className="fa-solid fa-filter"></i>
            </div>
            <div>
              <p className="text-xs text-blue-500 uppercase font-bold">Filtered View</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Showing schedule for <span className="text-blue-600 dark:text-blue-400">{activeContext.name}</span> ({activeContext.course} - {activeContext.semester})
              </p>
            </div>
          </div>
        )
      )}

      {/* 3. CALENDAR GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">

          {/* Navigation */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
            <button onClick={() => {
              const newDate = new Date(currentDate);
              if (viewMode === 'MONTH') newDate.setMonth(newDate.getMonth() - 1);
              else if (viewMode === 'WEEK') newDate.setDate(newDate.getDate() - 7);
              else newDate.setDate(newDate.getDate() - 1);
              setCurrentDate(newDate);
            }} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400">
              <i className="fa-solid fa-chevron-left"></i>
            </button>

            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              {viewMode === 'MONTH' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              {viewMode === 'WEEK' && `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
              {viewMode === 'DAY' && currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h2>

            <button onClick={() => {
              const newDate = new Date(currentDate);
              if (viewMode === 'MONTH') newDate.setMonth(newDate.getMonth() + 1);
              else if (viewMode === 'WEEK') newDate.setDate(newDate.getDate() + 7);
              else newDate.setDate(newDate.getDate() + 1);
              setCurrentDate(newDate);
            }} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400">
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>

          {viewMode === 'MONTH' && (
            <>
              <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="py-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 bg-slate-200 dark:bg-slate-700 gap-px border border-slate-200 dark:border-slate-700">
                {renderMonthView()}
              </div>
            </>
          )}
          {viewMode === 'WEEK' && renderWeekView()}
          {viewMode === 'DAY' && renderDayView()}
        </div>

        {/* Sidebar List */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 h-fit transition-colors">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4">Upcoming Schedule</h3>
          {loading ? (
            <div className="flex justify-center py-8">
              <TerminalLoader />
            </div>
          ) : events.length > 0 ? (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {events.slice(0, 8).map((event) => (
                <div key={event.id} className={`relative pl-4 border-l-2 group ${event.type === 'CLASS' ? 'border-purple-400' : 'border-blue-400'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mb-0.5">
                        {event.start.dateTime ? new Date(event.start.dateTime).toLocaleDateString() : 'All Day'}
                      </p>
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{event.summary}</h4>
                    </div>
                  </div>
                  {event.start.dateTime && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(event.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                      {event.end.dateTime && new Date(event.end.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                  {event.location && (
                    <p className="text-xs text-slate-400 mt-1"><i className="fa-solid fa-location-dot mr-1"></i>{event.location}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
              No events found.
            </div>
          )}
          <button onClick={() => fetchData()} className="w-full mt-6 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            Refresh Data
          </button>
        </div>
      </div>

      {user && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          user={user}
          onSuccess={() => {
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default CalendarView;