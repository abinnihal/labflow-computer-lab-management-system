import React, { useState, useEffect } from 'react';
import { User, Booking, BookingRequest, UserRole } from '../../types';
import {
  getAllBookings,
  createBooking,
  updateBooking,
  cancelBooking,
  checkConflict
} from '../../services/bookingService';
import { getAllLabs } from '../../services/labService';
import BookingModal from './BookingModal';
import BookingReportModal from './BookingReportModal';

// ... (Keep your imports and Helper Components like StatusBadge same) ...

const ManageBookingsPage: React.FC<{ user: User }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'HISTORY'>('UPCOMING');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true); // NEW: Loading state

  // REAL DATA STATE
  const [bookings, setBookings] = useState<Booking[]>([]);

  // 1. FETCH DATA ON LOAD
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getAllBookings();
      setBookings(data);
    } catch (error) {
      console.error("Failed to load bookings", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. HANDLE CREATE
  const handleCreateBooking = async (req: BookingRequest) => {
    try {
      await createBooking({ ...req, userRole: user.role });
      await fetchData(); // Refresh list after create
      setIsModalOpen(false);
    } catch (error: any) {
      alert(error.message); // Simple error handling for now
    }
  };

  // 3. HANDLE EDIT
  const handleEditBooking = async (req: BookingRequest) => {
    if (!selectedBooking) return;
    try {
      await updateBooking(selectedBooking.id, req, user.id, user.name);
      await fetchData(); // Refresh list after edit
      setIsModalOpen(false);
      setSelectedBooking(null);
    } catch (error: any) {
      alert(error.message);
    }
  };

  // 4. HANDLE CANCEL
  const handleCancel = async (bookingId: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      await cancelBooking(bookingId, user.id, user.name);
      await fetchData(); // Refresh list after cancel
    }
  };

  // Filter Logic (Client-side for now)
  const filteredBookings = bookings.filter(b => {
    const isHistory = new Date(b.endTime) < new Date() || b.status === 'REJECTED' || b.status === 'COMPLETED';

    // Filter by Tab
    if (activeTab === 'UPCOMING' && isHistory) return false;
    if (activeTab === 'HISTORY' && !isHistory) return false;

    // Filter by Role (Students only see their own)
    if (user.role === UserRole.STUDENT && b.userId !== user.id) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* ... (Keep your Header UI: Title, Buttons, Tabs) ... */}

      {/* ADD LOADING INDICATOR */}
      {loading ? (
        <div className="text-center py-10 text-slate-500">
          <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Loading bookings from database...
        </div>
      ) : (
        /* ... (Keep your Booking List/Table UI mapped to `filteredBookings`) ... */
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {filteredBookings.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-regular fa-calendar-xmark text-2xl"></i>
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">No Bookings Found</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-1">There are no bookings in this category.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredBookings.map((booking) => (
                <div key={booking.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  {/* ... (Existing Booking Item UI) ... */}
                  {/* Ensure you use the Buttons with onClick={() => handleCancel(booking.id)} etc. */}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setSelectedBooking(null); }}
          onSubmit={selectedBooking ? handleEditBooking : handleCreateBooking}
          initialData={selectedBooking || undefined}
          isEditing={!!selectedBooking}
          currentUser={user} // Pass user for validation
        />
      )}
    </div>
  );
};

export default ManageBookingsPage;