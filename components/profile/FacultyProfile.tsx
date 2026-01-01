
import React, { useState } from 'react';
import { User } from '../../types';

interface Props {
  user: User;
}

const FacultyProfile: React.FC<Props> = ({ user }) => {
  const [profileData, setProfileData] = useState({
    avatarUrl: user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}&background=0D8ABC&color=fff`,
    email: user.email,
    phone: '9876543210', // Mock phone
    departmentType: user.programType || 'UG', // UG or PG
    departmentName: user.department || 'Computer Science',
    subjects: 'Data Structures, Operating Systems, Computer Networks'
  });

  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({ ...prev, avatarUrl: reader.result as string }));
        showMsg('success', 'Profile photo updated successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      showMsg('success', 'Profile details updated successfully!');
    }, 1000);
  };

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
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Faculty Profile</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your academic profile and contact information.</p>
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
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col items-center text-center">
             <div className="relative group cursor-pointer mb-4">
               <img 
                 src={profileData.avatarUrl} 
                 alt="Profile" 
                 className="w-32 h-32 rounded-full object-cover border-4 border-slate-50 dark:border-slate-700 shadow-md" 
               />
               <label htmlFor="photo-upload" className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <i className="fa-solid fa-camera text-white text-2xl"></i>
               </label>
               <input type="file" id="photo-upload" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
             </div>
             
             <h2 className="text-xl font-bold text-slate-800 dark:text-white">{user.name}</h2>
             <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{user.facultyId || 'FAC-ID-MISSING'}</p>
             
             <div className="w-full text-center text-xs border-t border-slate-100 dark:border-slate-700 pt-4">
                <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">{profileData.departmentName}</p>
                <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded font-bold">{profileData.departmentType} Faculty</span>
             </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg">
             <div className="flex items-center gap-3 mb-2">
                <i className="fa-solid fa-chalkboard-user text-2xl"></i>
                <h3 className="font-bold">Faculty Status</h3>
             </div>
             <p className="text-purple-100 text-sm mb-4">Active Staff Member</p>
             <div className="flex items-center gap-2 text-xs bg-white/10 p-2 rounded">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                System Access: Full
             </div>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* General Information */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
             <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
               <i className="fa-regular fa-id-badge text-slate-400"></i>
               <h3 className="font-bold text-slate-800 dark:text-white">Personal & Academic Details</h3>
             </div>
             
             <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Full Name</label>
                      <input type="text" value={user.name} disabled className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed" />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Faculty ID</label>
                      <input type="text" value={user.facultyId} disabled className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed" />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Email Address</label>
                      <input 
                        type="email" 
                        value={profileData.email} 
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" 
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Phone Number</label>
                      <input 
                        type="text" 
                        value={profileData.phone} 
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" 
                      />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Department Name</label>
                      <input 
                        type="text" 
                        value={profileData.departmentName} 
                        onChange={(e) => setProfileData({...profileData, departmentName: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" 
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Level</label>
                      <select 
                        value={profileData.departmentType} 
                        onChange={(e) => setProfileData({...profileData, departmentType: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      >
                         <option value="UG">UG</option>
                         <option value="PG">PG</option>
                         <option value="BOTH">BOTH</option>
                      </select>
                   </div>
                </div>

                <div>
                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Subjects Handling</label>
                   <textarea 
                     value={profileData.subjects} 
                     onChange={(e) => setProfileData({...profileData, subjects: e.target.value})}
                     className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 h-20 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                     placeholder="E.g., Java, Python, Operating Systems (Comma separated)"
                   ></textarea>
                   <p className="text-[10px] text-slate-400 mt-1">List the subjects you are currently teaching.</p>
                </div>

                <div className="flex justify-end pt-2">
                   <button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2">
                      {isLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <i className="fa-solid fa-floppy-disk"></i>}
                      Save Changes
                   </button>
                </div>
             </form>
          </div>

          {/* Security */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
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
                     onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
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
                        onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
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
                        onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
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

export default FacultyProfile;
