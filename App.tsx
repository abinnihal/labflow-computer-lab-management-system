
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { User, UserRole } from './types';
import Login from './components/auth/Login';
import SignUpContainer from './components/auth/SignUpContainer';
import NewLandingPage from './components/new-landing/NewLandingPage';
import StudentDashboard from './components/dashboards/StudentDashboard';
import FacultyDashboard from './components/dashboards/FacultyDashboard';
import AdminDashboard from './components/dashboards/AdminDashboard';
import CalendarView from './components/CalendarView';
import AIChatPage from './components/AIChatPage';
import AttendancePage from './components/AttendancePage';
import AttendanceProgressPage from './components/attendance/AttendanceProgressPage';
import StudentTasksPage from './components/tasks/StudentTasksPage';
import FacultyTasksPage from './components/tasks/FacultyTasksPage';
import LearnersConsole from './components/community/LearnersConsole';
import StudentProfile from './components/profile/StudentProfile';
import FacultyProfile from './components/profile/FacultyProfile';
import ManageBookingsPage from './components/bookings/ManageBookingsPage';
import StudentFeedbackPage from './components/feedback/StudentFeedbackPage';
import FacultyFeedbackPage from './components/feedback/FacultyFeedbackPage';
import UserManagementPage from './components/admin/UserManagementPage';
import LabsManagementPage from './components/admin/LabsManagementPage';
import ConsoleModerationPage from './components/admin/ConsoleModerationPage';
import AdminFeedbackPage from './components/admin/AdminFeedbackPage';
import AnalyticsPage from './components/admin/AnalyticsPage';
import NotificationManagerPage from './components/admin/NotificationManagerPage';
import StudentManagementPage from './components/students/StudentManagementPage';
import AIChatWindow from './components/AIChatWindow';
import ThemeToggle from './components/ui/ThemeToggle';
import Logo from './components/ui/Logo';
import NotificationCenter from './components/ui/NotificationCenter';

// Helper for Sidebar Links
const SidebarLink = ({ to, icon, label, onClick }: { to: string, icon: string, label: string, onClick?: () => void }) => {
  const location = useLocation();
  const isActive = location.pathname.startsWith(to);
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-white group-hover:shadow-sm text-slate-500 dark:text-slate-400 group-hover:text-blue-600'}`}>
        <i className={`fa-solid ${icon} text-sm`}></i>
      </div>
      <span className="font-semibold text-sm">{label}</span>
    </Link>
  );
};

const DashboardLayout: React.FC<{ user: User; handleLogout: () => void; isDarkMode: boolean; toggleTheme: () => void }> = ({ user, handleLogout, isDarkMode, toggleTheme }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex transition-colors duration-300 overflow-hidden">

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col`}>
        <div className="h-20 flex items-center px-8 border-b border-slate-100 dark:border-slate-800">
          <Logo className="w-10 h-10" textClassName="text-2xl" />
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
          <SidebarLink to="/dashboard" icon="fa-chart-pie" label="Dashboard" onClick={() => setSidebarOpen(false)} />

          {user.role === UserRole.ADMIN && (
            <>
              <div className="px-4 py-2 mt-4 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Administration</div>
              <SidebarLink to="/dashboard/calendar" icon="fa-calendar-days" label="Master Calendar" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/dashboard/bookings" icon="fa-calendar-check" label="Manage Bookings" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/dashboard/complaints" icon="fa-triangle-exclamation" label="Complaints & Review" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/dashboard/notifications" icon="fa-bullhorn" label="Global Notifications" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/dashboard/moderation" icon="fa-gavel" label="Console Moderation" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/dashboard/users" icon="fa-users-gear" label="User Management" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/dashboard/labs" icon="fa-server" label="Labs & Inventory" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/dashboard/profile" icon="fa-id-card" label="Profile" onClick={() => setSidebarOpen(false)} />
            </>
          )}

          {user.role === UserRole.FACULTY && (
            <>
              <div className="px-4 py-2 mt-4 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Academic</div>
              <SidebarLink to="/dashboard/calendar" icon="fa-calendar-days" label="Calendar & Schedule" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/dashboard/progress" icon="fa-bars-progress" label="Check In Progress" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/dashboard/tasks" icon="fa-list-check" label="Tasks & Assignment" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/dashboard/bookings" icon="fa-computer" label="Manage Bookings" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/dashboard/students" icon="fa-users-gear" label="Student Management" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/dashboard/feedback" icon="fa-comments" label="Feedback & Issue" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/dashboard/profile" icon="fa-user-tie" label="Profile" onClick={() => setSidebarOpen(false)} />
            </>
          )}

          {user.role === UserRole.STUDENT && (
            <>
              <div className="px-4 py-2 mt-4 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Learning</div>
              <SidebarLink to="/dashboard/tasks" icon="fa-list-check" label="Assignments" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/dashboard/attendance" icon="fa-clock" label="Attendance" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/dashboard/calendar" icon="fa-calendar-days" label="Schedule" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/dashboard/community" icon="fa-users" label="Community" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/dashboard/ai-chat" icon="fa-robot" label="Lab Assistant" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/dashboard/support" icon="fa-headset" label="Support" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/dashboard/profile" icon="fa-id-card" label="My Profile" onClick={() => setSidebarOpen(false)} />
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <i className="fa-solid fa-right-from-bracket text-sm"></i>
            </div>
            <span className="font-semibold text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">

        {/* Top Header */}
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 transition-colors duration-300 shrink-0 relative z-40">

          {/* Left Section (Mobile Toggle + Breadcrumbs/Title) */}
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
              <i className="fa-solid fa-bars text-xl"></i>
            </button>

            <div className="lg:hidden">
              <Logo className="w-8 h-8" textClassName="text-lg" />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              System Online
            </div>

            <NotificationCenter user={user} />

            <ThemeToggle isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800 dark:text-white leading-none">{user.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{user.role}</p>
              </div>
              <img
                src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}`}
                alt="User"
                className="w-10 h-10 rounded-full border-2 border-slate-100 dark:border-slate-700 shadow-sm"
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 lg:p-8 relative">
          <div className="max-w-7xl mx-auto h-full">
            <Routes>
              <Route path="/" element={
                user.role === UserRole.ADMIN ? <AdminDashboard user={user} /> :
                  user.role === UserRole.FACULTY ? <FacultyDashboard user={user} /> :
                    <StudentDashboard user={user} />
              } />

              {/* Common Routes */}
              <Route path="calendar" element={<CalendarView user={user} />} />
              <Route path="bookings" element={<ManageBookingsPage user={user} />} />
              <Route path="community" element={<LearnersConsole user={user} />} />

              {/* Student Routes */}
              <Route path="tasks" element={user.role === UserRole.STUDENT ? <StudentTasksPage user={user} /> : <FacultyTasksPage user={user} />} />
              <Route path="attendance" element={<AttendancePage user={user} />} />
              <Route path="ai-chat" element={<AIChatPage />} />
              <Route path="support" element={<StudentFeedbackPage user={user} />} />
              {/* Profile Route: Students get StudentProfile, Faculty AND Admin get FacultyProfile (Staff View) */}
              <Route path="profile" element={user.role === UserRole.STUDENT ? <StudentProfile user={user} /> : <FacultyProfile user={user} />} />

              {/* Faculty Routes */}
              <Route path="feedback" element={<FacultyFeedbackPage user={user} />} />
              <Route path="students" element={<StudentManagementPage user={user} />} />
              <Route path="progress" element={<AttendanceProgressPage user={user} />} />

              {/* Admin Routes */}
              <Route path="users" element={<UserManagementPage user={user} />} />
              <Route path="labs" element={<LabsManagementPage user={user} />} />
              <Route path="analytics" element={<AnalyticsPage user={user} />} />
              <Route path="notifications" element={<NotificationManagerPage user={user} />} />
              <Route path="complaints" element={<AdminFeedbackPage user={user} />} />
              <Route path="moderation" element={<ConsoleModerationPage user={user} />} />

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </main>

        {/* Floating AI Chat - Only for Students/Faculty (optional) */}
        {user.role !== UserRole.ADMIN && <AIChatWindow />}
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/"
        element={!user ? <NewLandingPage isDarkMode={isDarkMode} toggleTheme={toggleTheme} /> : <Navigate to="/dashboard" replace />}
      />
      <Route
        path="/login"
        element={!user ? <Login onLogin={setUser} isDarkMode={isDarkMode} toggleTheme={toggleTheme} /> : <Navigate to="/dashboard" replace />}
      />
      <Route
        path="/signup"
        element={!user ? <SignUpContainer isDarkMode={isDarkMode} toggleTheme={toggleTheme} /> : <Navigate to="/dashboard" replace />}
      />

      {/* Protected Dashboard Routes */}
      <Route
        path="/dashboard/*"
        element={
          user ? (
            <DashboardLayout
              user={user}
              handleLogout={handleLogout}
              isDarkMode={isDarkMode}
              toggleTheme={toggleTheme}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
