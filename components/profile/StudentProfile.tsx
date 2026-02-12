import React, { useState } from 'react';
import { User } from '../../types';

interface Props {
  user: User;
}

const StudentProfile: React.FC<Props> = ({ user }) => {
  // Removed editable profile state. Displaying direct user data now.
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Password Reset Logic (Kept as security feature)
  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      showMsg('error', 'New passwords do not match.');
      return;
    }
    if (passwordData.new.length < 6) {
      showMsg('error', 'Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setPasswordData({ current: '', new: '', confirm: '' });
      showMsg('success', 'Password changed successfully!');
    }, 1500);
  };

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">My Profile</h1>
        <p className="text-slate-500 dark:text-slate-400">View your personal information and manage account security.</p>
      </div>

      {/* Notification Toast */}
      {msg && (
        <div className={`p-4 rounded-lg flex items-center gap-3 shadow-sm animate-fade-in-down ${msg.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'}`}>
          <i className={`fa-solid ${msg.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
          <span className="font-medium text-sm">{msg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Identity Card */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col items-center text-center transition-colors">
            <div className="relative group mb-4">
              <img
                src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}`}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-slate-50 dark:border-slate-700 shadow-md"
              />
            </div>

            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{user.name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{user.studentId}</p>

            <div className="w-full grid grid-cols-2 gap-2 text-center text-xs border-t border-slate-100 dark:border-slate-700 pt-4">
              <div>
                <p className="font-bold text-slate-700 dark:text-slate-300">{user.course || 'N/A'}</p>
                <p className="text-slate-400 dark:text-slate-500">Course</p>
              </div>
              <div>
                <p className="font-bold text-slate-700 dark:text-slate-300">{user.semester || 'N/A'}</p>
                <p className="text-slate-400 dark:text-slate-500">Semester</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-800 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <i className="fa-solid fa-shield-halved text-2xl"></i>
              <h3 className="font-bold">Student Status</h3>
            </div>
            <p className="text-blue-100 text-sm mb-4">Your account is active and verified.</p>
            <div className="flex items-center gap-2 text-xs bg-white/10 p-2 rounded">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Last login: Today, 10:30 AM
            </div>
          </div>
        </div>

        {/* Right Column: Read-Only Forms */}
        <div className="lg:col-span-2 space-y-6">

          {/* General Information (READ ONLY) */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-colors">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
              <i className="fa-regular fa-id-card text-slate-400"></i>
              <h3 className="font-bold text-slate-800 dark:text-white">Academic & Personal Details</h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Full Name</label>
                  <input type="text" value={user.name} disabled className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Student ID</label>
                  <input type="text" value={user.studentId} disabled className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Email Address</label>
                <div className="relative">
                  <i className="fa-solid fa-envelope absolute left-3 top-3 text-slate-400 text-sm"></i>
                  <input type="email" value={user.email} disabled className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Program Type</label>
                  <input type="text" value={user.programType || 'UG'} disabled className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Class / Course</label>
                  <input type="text" value={user.course || 'N/A'} disabled className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Semester</label>
                  <input type="text" value={user.semester || 'N/A'} disabled className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  value={user.phone || 'Not Provided'}
                  disabled
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
              </div>

              <div className="flex justify-end pt-2">
                <p className="text-[10px] text-slate-400 italic">To edit these details, please contact the administrator.</p>
              </div>
            </div>
          </div>

          {/* Security (Still Functional) */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-colors">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
              <i className="fa-solid fa-lock text-slate-400"></i>
              <h3 className="font-bold text-slate-800 dark:text-white">Password Reset</h3>
            </div>

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="••••••••"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={passwordData.new}
                    onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={passwordData.confirm}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" disabled={isLoading} className="bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2">
                  {isLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <i className="fa-solid fa-key"></i>}
                  Update Password
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentProfile;