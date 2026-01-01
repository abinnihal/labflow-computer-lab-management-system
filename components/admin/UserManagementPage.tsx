
import React, { useState, useEffect } from 'react';
import { User, UserRole, PermissionLevel } from '../../types';
import { getAllUsers, updateUserStatus, updateUser, resetUserPassword, importUsersFromCSV, exportUsersToCSV, deleteUser, updatePermissions } from '../../services/userService';

interface Props {
  user: User;
}

const MODULES = ['Calendar', 'Tasks', 'Attendance', 'Community', 'Labs'];

const UserManagementPage: React.FC<Props> = ({ user }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filterRole, setFilterRole] = useState<'ALL' | UserRole>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'DEACTIVATED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});
  const [permissionsData, setPermissionsData] = useState<Record<string, PermissionLevel>>({});
  
  // Toast State
  const [msg, setMsg] = useState<{type: 'success' | 'info', text: string} | null>(null);

  useEffect(() => {
    refreshUsers();
  }, []);

  const refreshUsers = () => {
    setUsers(getAllUsers());
  };

  const showMsg = (type: 'success' | 'info', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  // --- Handlers ---

  const handleStatusChange = (userId: string, status: 'APPROVED' | 'REJECTED' | 'DEACTIVATED' | 'PENDING') => {
    updateUserStatus(userId, status);
    refreshUsers();
    showMsg('success', `User status updated to ${status}`);
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
    });
    setPermissionsData(user.permissions || {});
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (selectedUser) {
        // Save Basic Info
        updateUser(selectedUser.id, {
            ...editFormData,
            permissions: permissionsData
        });
        
        setIsEditModalOpen(false);
        refreshUsers();
        showMsg('success', 'User profile updated successfully.');
    }
  };

  const handleResetPassword = () => {
      if (selectedUser) {
          const tempPass = resetUserPassword(selectedUser.id);
          alert(`Password reset. Temporary password: ${tempPass}`);
      }
  };

  const handleDelete = (userId: string) => {
      if (window.confirm("Are you sure you want to delete this user? This cannot be undone.")) {
          deleteUser(userId);
          refreshUsers();
          showMsg('info', 'User deleted.');
      }
  };

  const handleImport = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv';
      input.onchange = (e: any) => {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) {
                  const count = importUsersFromCSV(event.target.result as string);
                  refreshUsers();
                  showMsg('success', `${count} users imported successfully.`);
              }
          };
          reader.readAsText(file);
      };
      input.click();
  };

  const handleExport = () => {
      const csv = exportUsersToCSV();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'users_export.csv';
      a.click();
  };

  const handlePermissionChange = (module: string, level: PermissionLevel) => {
      setPermissionsData(prev => ({
          ...prev,
          [module]: level
      }));
  };

  // --- Filtering ---
  const filteredUsers = users.filter(u => {
      const matchesRole = filterRole === 'ALL' || u.role === filterRole;
      const matchesStatus = filterStatus === 'ALL' || u.status === filterStatus;
      const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            u.email.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesRole && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-center gap-4">
         <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">User Management</h1>
            <p className="text-slate-500 dark:text-slate-400">Manage accounts, roles, and access permissions.</p>
         </div>
         <div className="flex gap-2">
            <button onClick={handleImport} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                <i className="fa-solid fa-file-import"></i> Import CSV
            </button>
            <button onClick={handleExport} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                <i className="fa-solid fa-file-export"></i> Export
            </button>
         </div>
       </div>

       {msg && (
           <div className={`px-4 py-3 rounded-lg flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}`}>
               <i className="fa-solid fa-info-circle"></i> {msg.text}
           </div>
       )}

       {/* Filters & Search */}
       <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4">
           <div className="flex-1 relative">
               <i className="fa-solid fa-search absolute left-3 top-3 text-slate-400"></i>
               <input 
                 type="text" 
                 placeholder="Search by name or email..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
               />
           </div>
           <div className="flex gap-4">
               <select 
                 value={filterRole} 
                 onChange={(e) => setFilterRole(e.target.value as any)}
                 className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-white"
               >
                   <option value="ALL">All Roles</option>
                   <option value={UserRole.STUDENT}>Student</option>
                   <option value={UserRole.FACULTY}>Faculty</option>
                   <option value={UserRole.ADMIN}>Admin</option>
               </select>
               <select 
                 value={filterStatus} 
                 onChange={(e) => setFilterStatus(e.target.value as any)}
                 className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-white"
               >
                   <option value="ALL">All Status</option>
                   <option value="APPROVED">Approved</option>
                   <option value="PENDING">Pending</option>
                   <option value="DEACTIVATED">Deactivated</option>
               </select>
           </div>
       </div>

       {/* User Table */}
       <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
           <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                   <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                       <tr>
                           <th className="px-6 py-4">User</th>
                           <th className="px-6 py-4">Role</th>
                           <th className="px-6 py-4">Department</th>
                           <th className="px-6 py-4">Status</th>
                           <th className="px-6 py-4 text-right">Actions</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                       {filteredUsers.map(u => (
                           <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                               <td className="px-6 py-4">
                                   <div className="flex items-center gap-3">
                                       <img src={u.avatarUrl || `https://ui-avatars.com/api/?name=${u.name}`} className="w-9 h-9 rounded-full" alt="" />
                                       <div>
                                           <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{u.name}</p>
                                           <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                                       </div>
                                   </div>
                               </td>
                               <td className="px-6 py-4">
                                   <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                       u.role === UserRole.ADMIN ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                                       u.role === UserRole.FACULTY ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                       'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                   }`}>
                                       {u.role}
                                   </span>
                               </td>
                               <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                   {u.department || '-'}
                               </td>
                               <td className="px-6 py-4">
                                   <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase flex w-fit items-center gap-1 ${
                                       u.status === 'APPROVED' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                       u.status === 'PENDING' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                                       u.status === 'DEACTIVATED' ? 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400' :
                                       'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                   }`}>
                                       <span className={`w-1.5 h-1.5 rounded-full ${
                                           u.status === 'APPROVED' ? 'bg-green-600' :
                                           u.status === 'PENDING' ? 'bg-orange-500' :
                                           'bg-gray-500'
                                       }`}></span>
                                       {u.status}
                                   </span>
                               </td>
                               <td className="px-6 py-4 text-right">
                                   <div className="flex justify-end gap-2">
                                       {u.status === 'PENDING' && (
                                           <>
                                             <button onClick={() => handleStatusChange(u.id, 'APPROVED')} className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 p-1.5 rounded" title="Approve">
                                                <i className="fa-solid fa-check"></i>
                                             </button>
                                             <button onClick={() => handleStatusChange(u.id, 'REJECTED')} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded" title="Reject">
                                                <i className="fa-solid fa-xmark"></i>
                                             </button>
                                           </>
                                       )}
                                       {u.status === 'APPROVED' && (
                                            <button onClick={() => handleStatusChange(u.id, 'DEACTIVATED')} className="text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 p-1.5 rounded" title="Deactivate">
                                                <i className="fa-solid fa-ban"></i>
                                            </button>
                                       )}
                                       {u.status === 'DEACTIVATED' && (
                                            <button onClick={() => handleStatusChange(u.id, 'APPROVED')} className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 p-1.5 rounded" title="Reactivate">
                                                <i className="fa-solid fa-rotate-left"></i>
                                            </button>
                                       )}
                                       
                                       <button onClick={() => handleEditClick(u)} className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1.5 rounded" title="Edit">
                                           <i className="fa-solid fa-pen-to-square"></i>
                                       </button>
                                       <button onClick={() => handleDelete(u.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded" title="Delete">
                                           <i className="fa-solid fa-trash-can"></i>
                                       </button>
                                   </div>
                               </td>
                           </tr>
                       ))}
                       {filteredUsers.length === 0 && (
                           <tr>
                               <td colSpan={5} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500 italic">No users found.</td>
                           </tr>
                       )}
                   </tbody>
               </table>
           </div>
       </div>

       {/* Edit Modal */}
       {isEditModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
               <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
                   <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
                       <h2 className="text-lg font-bold">Edit User Details</h2>
                       <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white"><i className="fa-solid fa-xmark"></i></button>
                   </div>
                   
                   <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Name</label>
                               <input type="text" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white" />
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Email</label>
                               <input type="text" value={editFormData.email} onChange={e => setEditFormData({...editFormData, email: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white" />
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Role</label>
                               <select value={editFormData.role} onChange={e => setEditFormData({...editFormData, role: e.target.value as any})} className="w-full border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white">
                                   <option value={UserRole.STUDENT}>Student</option>
                                   <option value={UserRole.FACULTY}>Faculty</option>
                                   <option value={UserRole.ADMIN}>Admin</option>
                               </select>
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Department</label>
                               <input type="text" value={editFormData.department} onChange={e => setEditFormData({...editFormData, department: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white" />
                           </div>
                       </div>

                       <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                           <div className="flex justify-between items-center mb-2">
                               <h3 className="font-bold text-slate-800 dark:text-white">Permissions</h3>
                               <button onClick={handleResetPassword} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Reset Password</button>
                           </div>
                           <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Granular access control for system modules.</p>
                           
                           <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                               <table className="w-full text-sm">
                                   <thead>
                                       <tr className="bg-slate-100 dark:bg-slate-800 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                                           <th className="px-4 py-2">Module</th>
                                           <th className="px-4 py-2 text-center">Read</th>
                                           <th className="px-4 py-2 text-center">Write</th>
                                           <th className="px-4 py-2 text-center">None</th>
                                       </tr>
                                   </thead>
                                   <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                       {MODULES.map(mod => {
                                           const current = permissionsData[mod.toUpperCase()] || 'READ'; // Default to READ
                                           return (
                                               <tr key={mod}>
                                                   <td className="px-4 py-2 font-medium text-slate-700 dark:text-slate-300">{mod}</td>
                                                   <td className="px-4 py-2 text-center">
                                                       <input type="radio" name={`perm-${mod}`} checked={current === 'READ'} onChange={() => handlePermissionChange(mod.toUpperCase(), 'READ')} className="dark:bg-slate-700" />
                                                   </td>
                                                   <td className="px-4 py-2 text-center">
                                                       <input type="radio" name={`perm-${mod}`} checked={current === 'WRITE'} onChange={() => handlePermissionChange(mod.toUpperCase(), 'WRITE')} className="dark:bg-slate-700" />
                                                   </td>
                                                   <td className="px-4 py-2 text-center">
                                                       <input type="radio" name={`perm-${mod}`} checked={current === 'NONE'} onChange={() => handlePermissionChange(mod.toUpperCase(), 'NONE')} className="dark:bg-slate-700" />
                                                   </td>
                                               </tr>
                                           )
                                       })}
                                   </tbody>
                               </table>
                           </div>
                       </div>
                   </div>

                   <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
                       <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 text-sm font-medium">Cancel</button>
                       <button onClick={handleSaveEdit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-bold">Save Changes</button>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};

export default UserManagementPage;
