import React, { useState, useEffect } from 'react';
import { User, Booking, BookingRequest, UserRole } from '../../types';
import {
  getAllBookings,
  createBooking,
  updateBooking,
  cancelBooking
} from '../../services/bookingService';
import { getAllUsers } from '../../services/userService';
import BookingModal from './BookingModal';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

// Constants for Admin Filters (Matched with other pages)
const COURSES = ['BCA', 'B.Sc Computer Science', 'B.Tech CSE', 'MCA', 'M.Sc Computer Science'];
const SEMESTERS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];

const ManageBookingsPage: React.FC<{ user: User }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'HISTORY'>('UPCOMING');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Cache for my student IDs (for Faculty)
  const [myStudentIds, setMyStudentIds] = useState<string[]>([]);

  // Context State (Faculty/Student)
  const [activeContext, setActiveContext] = useState<{ name: string, course: string, semester: string } | null>(null);

  // Admin Filter State
  const [adminFilter, setAdminFilter] = useState({ course: '', semester: '' });

  useEffect(() => {
    fetchData();
  }, [user, adminFilter]); // Refresh when user or admin filters change

  const fetchData = async () => {
    setLoading(true);
    try {
      // ---------------------------------------------------------
      // 1. DETERMINE CONTEXT / FILTER
      // ---------------------------------------------------------
      let filter = null;

      if (user.role === UserRole.ADMIN) {
        // Admin: Use manual dropdowns
        if (adminFilter.course && adminFilter.semester) {
          filter = { ...adminFilter };
        }
      } else {
        // Faculty/Student: Use LocalStorage Context
        const activeSubjectId = localStorage.getItem('activeSubjectId');
        if (activeSubjectId) {
          try {
            const subDoc = await getDoc(doc(db, 'subjects', activeSubjectId));
            if (subDoc.exists()) {
              filter = {
                name: subDoc.data().name,
                course: subDoc.data().course,
                semester: subDoc.data().semester
              };
              setActiveContext(filter);
            }
          } catch (e) {
            console.error("Error fetching context:", e);
          }
        } else {
          setActiveContext(null);
        }
      }

      // ---------------------------------------------------------
      // 2. FETCH ALL BOOKINGS
      // ---------------------------------------------------------
      const allBookings = await getAllBookings();

      // ---------------------------------------------------------
      // 3. APPLY FILTERS
      // ---------------------------------------------------------
      let relevantBookings = allBookings;

      // A. Apply Context/Admin Filter (If Active)
      if (filter) {
        relevantBookings = relevantBookings.filter(b =>
          b.course === filter.course && b.semester === filter.semester
        );
      }

      // B. Apply Role Scoping (For Non-Admins)
      if (user.role === UserRole.FACULTY && user.managedSemesters) {
        let students = myStudentIds;
        if (students.length === 0) {
          const allUsers = await getAllUsers();
          students = allUsers
            .filter(u => u.role === UserRole.STUDENT && u.semester && user.managedSemesters?.includes(u.semester))
            .map(u => u.id);
          setMyStudentIds(students);
        }
        // Show bookings if: They are Mine OR They are my Students'
        relevantBookings = relevantBookings.filter(b =>
          b.userId === user.id || students.includes(b.userId)
        );

      } else if (user.role === UserRole.STUDENT) {
        relevantBookings = relevantBookings.filter(b => b.userId === user.id);
      }
      // Admin sees everything (filtered only by the manual dropdowns above)

      setBookings(relevantBookings);

    } catch (error) {
      console.error("Failed to load bookings", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBooking = async (req: BookingRequest) => {
    try {
      await createBooking({ ...req, userRole: user.role });
      await fetchData();
      setIsModalOpen(false);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleEditBooking = async (req: BookingRequest) => {
    if (!selectedBooking) return;
    try {
      await updateBooking(selectedBooking.id, req, user.id, user.name);
      await fetchData();
      setIsModalOpen(false);
      setSelectedBooking(null);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      await cancelBooking(bookingId, user.id, user.name);
      await fetchData();
    }
  };

  // Filter Logic (Time-based for tabs + Hide Expired Pending)
  const filteredBookings = bookings.filter(b => {
    const now = new Date();
    const endTime = new Date(b.endTime);
    const isHistory = endTime < now || b.status === 'REJECTED' || b.status === 'COMPLETED';

    if (b.status === 'PENDING' && endTime < now) {
      // logic handled by isHistory being true
    }

    if (activeTab === 'UPCOMING') {
      return !isHistory && (b.status === 'APPROVED' || b.status === 'PENDING');
    }
    if (activeTab === 'HISTORY') {
      return isHistory;
    }
    return true;
  });

  const getStatusColor = (status: string, endTime: string) => {
    const isExpired = new Date(endTime) < new Date() && status === 'PENDING';
    if (isExpired) return 'bg-gray-100 text-gray-500 border-gray-200 line-through';

    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-700 border-green-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const isAdmin = user.role === UserRole.ADMIN;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            {user.role === UserRole.FACULTY ? 'Class Bookings' : 'My Bookings'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {user.role === UserRole.FACULTY
              ? 'Manage your sessions and review student requests.'
              : 'Manage your upcoming lab sessions.'}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 flex">
            <button onClick={() => setActiveTab('UPCOMING')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'UPCOMING' ? 'bg-blue-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Upcoming</button>
            <button onClick={() => setActiveTab('HISTORY')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'HISTORY' ? 'bg-blue-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>History</button>
          </div>
          {user.role !== UserRole.ADMIN && (
            <button onClick={() => { setSelectedBooking(null); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm flex items-center gap-2">
              <i className="fa-solid fa-plus"></i> New Booking
            </button>
          )}
        </div>
      </div>

      {/* 2. ADMIN FILTERS / CONTEXT BANNER */}
      {isAdmin ? (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between animate-fade-in-down">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
            <i className="fa-solid fa-filter text-blue-500"></i>
            <span className="text-sm">Filter Bookings:</span>
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
      ) : activeContext && (
        // Faculty/Student Context Banner
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center gap-3 animate-fade-in-down">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-300">
            <i className="fa-solid fa-filter"></i>
          </div>
          <div>
            <p className="text-xs text-blue-500 uppercase font-bold">Filtered View</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Showing bookings for <span className="text-blue-600 dark:text-blue-400">{activeContext.name}</span> ({activeContext.course} - {activeContext.semester})
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-500">
          <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Loading bookings...
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {filteredBookings.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-regular fa-calendar-xmark text-2xl"></i>
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">No Bookings Found</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                {activeTab === 'UPCOMING' ? 'No upcoming sessions scheduled.' : 'No booking history available.'}
                {isAdmin && (adminFilter.course || adminFilter.semester) && ' (Try clearing filters)'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredBookings.map((booking) => (
                <div key={booking.id} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center justify-center w-14 h-14 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl font-bold border border-blue-100 dark:border-blue-800">
                      <span className="text-xs uppercase">{new Date(booking.startTime).toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-xl">{new Date(booking.startTime).getDate()}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2">
                        {booking.subject}
                        {/* Tag to show who booked it if it's not me */}
                        {booking.userId !== user.id && (
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                            by {booking.userName}
                          </span>
                        )}
                        {/* Course Tag */}
                        {booking.course && (
                          <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-800">
                            {booking.course} {booking.semester}
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mt-1">
                        <span><i className="fa-regular fa-clock mr-1"></i> {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span><i className="fa-solid fa-desktop mr-1"></i> {booking.systemCount} Systems</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(booking.status, booking.endTime)}`}>
                      {new Date(booking.endTime) < new Date() && booking.status === 'PENDING' ? 'EXPIRED' : booking.status}
                    </span>

                    {/* Actions: Edit only if it's UPCOMING and (It's MY booking OR I am Faculty/Admin) */}
                    {activeTab === 'UPCOMING' && booking.status !== 'REJECTED' && (booking.userId === user.id || user.role !== UserRole.STUDENT) && (
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedBooking(booking); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button onClick={() => handleCancel(booking.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Cancel">
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setSelectedBooking(null); }}
          onSuccess={fetchData}
          bookingToEdit={selectedBooking}
          user={user}
        />
      )}
    </div>
  );
};

export default ManageBookingsPage;