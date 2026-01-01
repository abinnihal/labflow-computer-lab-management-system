
import React, { useState, useEffect } from 'react';
import { User, Booking, UserRole } from '../../types';
import { getAllBookings, cancelBooking, approveBooking, rejectBooking } from '../../services/bookingService';
import BookingModal from './BookingModal';
import BookingReportModal from './BookingReportModal';

interface Props {
  user: User;
}

const ManageBookingsPage: React.FC<Props> = ({ user }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'PAST' | 'CANCELLED'>('ACTIVE');
  
  // Modal States
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportBooking, setReportBooking] = useState<Booking | null>(null);

  useEffect(() => {
    refreshBookings();
  }, [user.id]);

  const refreshBookings = () => {
    const all = getAllBookings();
    // Admin sees ALL. Faculty sees OWN.
    const userBookings = user.role === UserRole.ADMIN ? all : all.filter(b => b.userId === user.id);
    setBookings(userBookings);
  };

  const handleCancel = (id: string) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      cancelBooking(id, user.id, user.name);
      refreshBookings();
    }
  };

  const handleApprove = (id: string) => {
      approveBooking(id, user.id, user.name);
      refreshBookings();
  };

  const handleReject = (id: string) => {
      if (window.confirm('Reject this booking request?')) {
        rejectBooking(id, user.id, user.name);
        refreshBookings();
      }
  };

  const handleEdit = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsBookingModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedBooking(null);
    setIsBookingModalOpen(true);
  };
  
  const handleViewReport = (booking: Booking) => {
      setReportBooking(booking);
      setIsReportModalOpen(true);
  };

  const filteredBookings = bookings.filter(b => {
    const now = new Date();
    const endTime = new Date(b.endTime);
    const isCancelled = b.status === 'REJECTED';
    const isPending = b.status === 'PENDING';
    
    if (filter === 'ALL') return true;
    if (filter === 'CANCELLED') return isCancelled && !isPending; // Separate rejected from cancelled loosely for this demo logic, but usually same status
    if (filter === 'PENDING') return isPending;
    if (filter === 'PAST') return !isCancelled && !isPending && endTime < now;
    if (filter === 'ACTIVE') return !isCancelled && !isPending && endTime >= now;
    return true;
  });

  const getStatusBadge = (booking: Booking) => {
    if (booking.status === 'REJECTED') return <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded text-xs font-bold uppercase">Rejected/Cancelled</span>;
    if (booking.status === 'PENDING') return <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-1 rounded text-xs font-bold uppercase animate-pulse">Pending Approval</span>;
    
    const now = new Date();
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);

    if (now > end) return <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-xs font-bold uppercase">Completed</span>;
    if (now >= start && now <= end) return <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded text-xs font-bold uppercase animate-pulse">In Progress</span>;
    
    return <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded text-xs font-bold uppercase">Scheduled</span>;
  };

  const getProgress = (booking: Booking) => {
     const now = new Date();
     const start = new Date(booking.startTime);
     const end = new Date(booking.endTime);
     
     if (booking.status === 'REJECTED' || booking.status === 'PENDING') return 0;
     if (now > end) return 100;
     if (now < start) return 0;

     const totalDuration = end.getTime() - start.getTime();
     const elapsed = now.getTime() - start.getTime();
     return Math.min(100, Math.round((elapsed / totalDuration) * 100));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Manage Bookings</h1>
          <p className="text-slate-500 dark:text-slate-400">View, edit, or reschedule your lab sessions.</p>
        </div>
        <button 
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md flex items-center gap-2 transition-all active:scale-95"
        >
           <i className="fa-solid fa-plus"></i> {user.role === UserRole.ADMIN ? 'Add Booking' : 'Request Session'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm inline-flex flex-wrap gap-1">
         {['ACTIVE', 'PENDING', 'PAST', 'CANCELLED', 'ALL'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === f ? 'bg-slate-800 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              {f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
         ))}
      </div>

      {/* Booking List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
         <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                 <th className="px-6 py-4">Subject / Class</th>
                 <th className="px-6 py-4">Date & Time</th>
                 <th className="px-6 py-4">Lab Details</th>
                 <th className="px-6 py-4">Status</th>
                 <th className="px-6 py-4">Progress</th>
                 <th className="px-6 py-4 text-right">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
               {filteredBookings.map(booking => (
                 <tr key={booking.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                   <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 dark:text-white">{booking.subject}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">By: {booking.userName}</p>
                      {user.role === UserRole.ADMIN && booking.type === 'EXTRA' && (
                          <span className="text-[10px] bg-purple-100 text-purple-700 px-1 rounded ml-1">EXTRA</span>
                      )}
                   </td>
                   <td className="px-6 py-4">
                      <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{new Date(booking.startTime).toLocaleDateString()}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(booking.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - 
                        {new Date(booking.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                      </p>
                   </td>
                   <td className="px-6 py-4">
                      <p className="text-sm text-slate-700 dark:text-slate-300">Lab {booking.labId === 'l1' ? '1' : booking.labId === 'l2' ? '2' : '3'}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{booking.systemCount || '-'} Systems</p>
                   </td>
                   <td className="px-6 py-4">
                      {getStatusBadge(booking)}
                   </td>
                   <td className="px-6 py-4">
                      <div className="w-24">
                        <div className="flex justify-between text-[10px] mb-1 text-slate-500 dark:text-slate-400">
                           <span>{getProgress(booking)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${booking.status === 'REJECTED' ? 'bg-red-300' : getProgress(booking) === 100 ? 'bg-green-500' : 'bg-blue-500'}`} 
                            style={{ width: `${getProgress(booking)}%` }}
                          ></div>
                        </div>
                      </div>
                   </td>
                   <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {/* Admin Approval Actions */}
                        {user.role === UserRole.ADMIN && booking.status === 'PENDING' && (
                            <>
                                <button 
                                  onClick={() => handleApprove(booking.id)}
                                  className="text-white bg-green-500 hover:bg-green-600 px-2 py-1 rounded shadow-sm text-xs font-bold"
                                  title="Approve"
                                >
                                   Approve
                                </button>
                                <button 
                                  onClick={() => handleReject(booking.id)}
                                  className="text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded shadow-sm text-xs font-bold"
                                  title="Reject"
                                >
                                   Reject
                                </button>
                            </>
                        )}

                        {booking.status !== 'REJECTED' && getProgress(booking) < 100 && (
                          <>
                            <button 
                              onClick={() => handleEdit(booking)}
                              className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                              title="Edit Details & View Logs"
                            >
                               <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button 
                              onClick={() => handleCancel(booking.id)}
                              className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="Cancel Session"
                            >
                               <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </>
                        )}
                         {getProgress(booking) === 100 && booking.status !== 'REJECTED' && (
                            <button 
                               onClick={() => handleViewReport(booking)}
                               className="text-green-600 dark:text-green-400 text-xs font-bold hover:underline bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg flex items-center gap-1"
                            >
                               <i className="fa-solid fa-square-poll-vertical"></i> View Report
                            </button>
                         )}
                      </div>
                   </td>
                 </tr>
               ))}
               {filteredBookings.length === 0 && (
                 <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                      <i className="fa-solid fa-calendar-xmark text-4xl mb-3 opacity-50"></i>
                      <p>No bookings found for this filter.</p>
                   </td>
                 </tr>
               )}
             </tbody>
           </table>
         </div>
      </div>

      {/* Edit/Create Modal */}
      <BookingModal 
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        user={user}
        onSuccess={refreshBookings}
        bookingToEdit={selectedBooking}
      />

      {/* Report Modal */}
      <BookingReportModal 
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        booking={reportBooking}
      />
    </div>
  );
};

export default ManageBookingsPage;
