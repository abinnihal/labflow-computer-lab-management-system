
import React, { useState, useEffect } from 'react';
import { getUpcomingEvents, initGoogleClient, signInToGoogle, GCalEvent, deleteEvent } from '../services/googleCalendarService';
import { getAllBookings } from '../services/bookingService';
import { User, UserRole } from '../types';
import BookingModal from './bookings/BookingModal';
import TerminalLoader from './ui/TerminalLoader';

interface Props {
  user?: User; // Optional user prop to check role
}

const CalendarView: React.FC<Props> = ({ user }) => {
  const [events, setEvents] = useState<GCalEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // View Mode State
  const [viewMode, setViewMode] = useState<'MONTH' | 'WEEK' | 'DAY'>('MONTH');
  
  // Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await initGoogleClient();
      // Auto-connect simulation for demo purposes
      setIsConnected(true);
      fetchEvents();
    };
    initialize();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    // 1. Fetch Google Calendar Events
    const googleEvents = await getUpcomingEvents();
    
    // 2. Fetch System Bookings
    const systemBookings = getAllBookings();
    
    // 3. Map Bookings to Unified Event Structure
    const bookingEvents: GCalEvent[] = systemBookings
      .filter(b => b.status !== 'REJECTED')
      .map(b => ({
        id: b.id,
        summary: b.subject,
        description: `Booked by ${b.userName}. Status: ${b.status}`,
        location: b.labId ? (b.labId === 'l1' ? 'Lab 1 (Prog)' : b.labId === 'l2' ? 'Lab 2 (AI)' : 'Lab 3 (Net)') : 'Lab',
        start: { dateTime: b.startTime },
        end: { dateTime: b.endTime },
        status: b.status // Custom field leveraged for coloring
      }));

    // 4. Merge and Sort
    const allEvents = [...googleEvents, ...bookingEvents].sort((a, b) => {
        const dateA = new Date(a.start.dateTime || a.start.date || '');
        const dateB = new Date(b.start.dateTime || b.start.date || '');
        return dateA.getTime() - dateB.getTime();
    });

    setEvents(allEvents);
    setLoading(false);
  };

  const handleConnect = async () => {
    setLoading(true);
    const success = await signInToGoogle();
    if (success) {
      setIsConnected(true);
      await fetchEvents();
    }
    setLoading(false);
  };

  const handleDelete = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this event?")) {
      await deleteEvent(eventId);
      fetchEvents(); // Refresh list
    }
  };

  // --- Render Helpers ---

  const getEventStyle = (ev: GCalEvent) => {
      if (ev.status === 'PENDING') return 'bg-orange-100 border-orange-200 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-800';
      if (ev.status === 'APPROVED') return 'bg-green-100 border-green-200 text-green-800 dark:bg-green-900/40 dark:text-green-200 dark:border-green-800';
      // Completed or External
      return 'bg-blue-100 border-blue-200 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-800';
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days = [];
    // Empty slots for previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700"></div>);
    }
    
    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = new Date(year, month, i).toDateString();
      const dayEvents = events.filter(e => {
        const eDate = e.start.dateTime ? new Date(e.start.dateTime) : (e.start.date ? new Date(e.start.date) : null);
        return eDate && eDate.toDateString() === dateStr;
      });

      const isToday = i === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

      days.push(
        <div key={i} className={`h-24 border border-slate-100 dark:border-slate-700 p-2 relative group hover:bg-blue-50/30 dark:hover:bg-slate-800 transition-colors ${isToday ? 'bg-blue-50 dark:bg-slate-800' : 'bg-white dark:bg-slate-900'}`}>
          <span className={`text-sm font-medium ${isToday ? 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300 w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-700 dark:text-slate-300'}`}>
            {i}
          </span>
          <div className="mt-1 space-y-1 overflow-y-auto max-h-16 custom-scrollbar">
            {dayEvents.map(ev => (
              <div key={ev.id} className={`text-[10px] px-1.5 py-0.5 rounded truncate border flex justify-between items-center group/event ${getEventStyle(ev)}`} title={ev.summary}>
                <span className="truncate">
                  {ev.start.dateTime && new Date(ev.start.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} {ev.summary}
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
    const diff = currentDate.getDate() - day; // Adjust to Sunday
    startOfWeek.setDate(diff);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);
        const isToday = dayDate.toDateString() === new Date().toDateString();
        const dateStr = dayDate.toDateString();

        const dayEvents = events.filter(e => {
            const eDate = e.start.dateTime ? new Date(e.start.dateTime) : (e.start.date ? new Date(e.start.date) : null);
            return eDate && eDate.toDateString() === dateStr;
        });

        weekDays.push(
            <div key={i} className="flex-1 min-w-[100px] border-r border-slate-200 dark:border-slate-700 last:border-r-0 flex flex-col h-full bg-white dark:bg-slate-900">
                <div className={`p-3 text-center border-b border-slate-200 dark:border-slate-700 sticky top-0 ${isToday ? 'bg-blue-50 dark:bg-slate-800' : ''}`}>
                    <p className={`text-xs font-bold uppercase mb-1 ${isToday ? 'text-blue-600' : 'text-slate-500 dark:text-slate-400'}`}>
                        {dayDate.toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <p className={`text-sm font-bold ${isToday ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>
                        {dayDate.getDate()}
                    </p>
                </div>
                <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[500px] custom-scrollbar">
                    {dayEvents.map(ev => (
                        <div key={ev.id} className={`p-2 rounded text-xs border ${getEventStyle(ev)} shadow-sm cursor-pointer`}>
                            <div className="font-bold truncate">{ev.summary}</div>
                            <div className="text-[10px] opacity-80 mt-1">
                                {ev.start.dateTime ? new Date(ev.start.dateTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'All Day'}
                            </div>
                            <div className="text-[10px] mt-1 opacity-70 truncate flex items-center gap-1">
                                <i className="fa-solid fa-location-dot"></i> {ev.location}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return <div className="flex h-[600px] overflow-x-auto border-t border-slate-200 dark:border-slate-700">{weekDays}</div>;
  };

  const renderDayView = () => {
      const dayDate = currentDate;
      const isToday = dayDate.toDateString() === new Date().toDateString();
      const dateStr = dayDate.toDateString();
      
      const dayEvents = events.filter(e => {
            const eDate = e.start.dateTime ? new Date(e.start.dateTime) : (e.start.date ? new Date(e.start.date) : null);
            return eDate && eDate.toDateString() === dateStr;
      });

      return (
          <div className="bg-white dark:bg-slate-900 min-h-[500px] p-6">
              <div className="flex items-center justify-center mb-8">
                  <div className={`text-center ${isToday ? 'text-blue-600' : 'text-slate-800 dark:text-white'}`}>
                      <h2 className="text-3xl font-bold">{dayDate.toLocaleDateString('en-US', { weekday: 'long' })}</h2>
                      <p className="text-lg text-slate-500 dark:text-slate-400">{dayDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
              </div>

              <div className="max-w-3xl mx-auto space-y-4">
                  {dayEvents.length === 0 && (
                      <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                          <i className="fa-regular fa-calendar-xmark text-4xl mb-3 opacity-50"></i>
                          <p>No events scheduled for this day.</p>
                      </div>
                  )}
                  {dayEvents.map(ev => (
                      <div key={ev.id} className="flex gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 shadow-sm transition-all">
                          <div className="flex flex-col items-center justify-center min-w-[100px] border-r border-slate-200 dark:border-slate-700 pr-4 text-slate-700 dark:text-slate-300">
                              <span className="text-lg font-bold">{ev.start.dateTime ? new Date(ev.start.dateTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'All Day'}</span>
                              <span className="text-xs text-slate-400 uppercase">{ev.end.dateTime ? new Date(ev.end.dateTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}</span>
                          </div>
                          <div className="flex-1">
                              <div className="flex justify-between items-start">
                                  <h4 className="text-lg font-bold text-slate-800 dark:text-white">{ev.summary}</h4>
                                  {ev.status && (
                                      <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${ev.status === 'APPROVED' ? 'bg-green-100 text-green-700' : ev.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : 'bg-slate-200 text-slate-700'}`}>
                                          {ev.status}
                                      </span>
                                  )}
                              </div>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2"><i className="fa-solid fa-location-dot mr-1"></i> {ev.location}</p>
                              {ev.description && (
                                  <div className="text-sm bg-white dark:bg-slate-700 p-2 rounded border border-slate-100 dark:border-slate-600 text-slate-600 dark:text-slate-300">
                                      {ev.description}
                                  </div>
                              )}
                          </div>
                          {user?.role === UserRole.ADMIN && (
                             <button onClick={(e) => handleDelete(ev.id, e)} className="text-slate-400 hover:text-red-500 self-start p-1">
                                <i className="fa-solid fa-trash-can"></i>
                             </button>
                          )}
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            {isAdmin ? 'Master Calendar' : 'Calendar & Schedule'}
          </h1>
          <div className="flex items-center gap-2 mt-1">
             <i className="fa-solid fa-calendar-days text-slate-500 dark:text-slate-400"></i>
             <p className="text-slate-500 dark:text-slate-400 text-sm">
                System Bookings & Google Calendar Events
             </p>
             {isConnected && <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">Synced</span>}
          </div>
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

            {!isConnected && (
              <button 
                onClick={handleConnect}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <i className="fa-brands fa-google"></i> Connect Google
              </button>
            )}
        </div>
        
        <div className="flex gap-1 bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
           <button onClick={() => setViewMode('MONTH')} className={`px-3 py-1.5 text-sm font-bold rounded transition-colors ${viewMode === 'MONTH' ? 'bg-slate-800 dark:bg-slate-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>Month</button>
           <button onClick={() => setViewMode('WEEK')} className={`px-3 py-1.5 text-sm font-bold rounded transition-colors ${viewMode === 'WEEK' ? 'bg-slate-800 dark:bg-slate-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>Week</button>
           <button onClick={() => setViewMode('DAY')} className={`px-3 py-1.5 text-sm font-bold rounded transition-colors ${viewMode === 'DAY' ? 'bg-slate-800 dark:bg-slate-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>Day</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Calendar Grid */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
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
                 <div key={event.id} className="relative pl-4 border-l-2 border-blue-400 group">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mb-0.5">
                          {event.start.dateTime ? new Date(event.start.dateTime).toLocaleDateString() : 'All Day'}
                        </p>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{event.summary}</h4>
                      </div>
                      {isAdmin && (
                        <button 
                          onClick={(e) => handleDelete(event.id, e)}
                          className="text-slate-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete Event"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      )}
                    </div>
                    {event.start.dateTime && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(event.start.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                        {event.end.dateTime && new Date(event.end.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
           <button onClick={() => fetchEvents()} className="w-full mt-6 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
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
              fetchEvents();
          }}
        />
      )}
    </div>
  );
};

export default CalendarView;
