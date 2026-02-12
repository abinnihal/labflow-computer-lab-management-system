import React, { useState, useEffect } from 'react';
import { User, UserRole, PermissionLevel, UserStatus } from '../../types';
import {
    getAllUsers,
    updateUserStatus,
    deleteUser,
    updateUser
} from '../../services/userService';

const MODULES = ['Calendar', 'Tasks', 'Attendance', 'Community', 'Labs'];
const COURSES = ['BCA', 'B.Sc Computer Science', 'B.Tech CSE', 'MCA', 'M.Sc Computer Science'];
const SEMESTERS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];

interface Props {
    user?: User;
}

const UserManagementPage: React.FC<Props> = () => {
    // --- State ---
    const [viewMode, setViewMode] = useState<'FACULTY' | 'STUDENT'>('FACULTY');

    // Filters
    const [filterDept, setFilterDept] = useState('');
    const [filterCourse, setFilterCourse] = useState('');
    const [filterSem, setFilterSem] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState<Partial<User>>({});
    const [permissionsData, setPermissionsData] = useState<Record<string, PermissionLevel>>({});

    // Toast State
    const [msg, setMsg] = useState<{ type: 'success' | 'info' | 'error', text: string } | null>(null);

    // --- Lifecycle ---
    useEffect(() => {
        refreshUsers();
    }, []);

    const refreshUsers = async () => {
        setLoading(true);
        try {
            const data = await getAllUsers();
            // We only show Active/Deactivated users here. Pending go to Approvals.
            const managedUsers = data.filter(u => u.status !== 'PENDING' && u.role !== UserRole.ADMIN);
            setUsers(managedUsers);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    const showMsg = (type: 'success' | 'info' | 'error', text: string) => {
        setMsg({ type, text });
        setTimeout(() => setMsg(null), 3000);
    };

    // --- Handlers ---
    const handleStatusChange = async (userId: string, status: UserStatus) => {
        try {
            await updateUserStatus(userId, status);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
            showMsg('success', `User status updated to ${status}`);
        } catch (error) {
            showMsg('error', 'Failed to update status');
            refreshUsers();
        }
    };

    const handleEditClick = (user: User) => {
        setSelectedUser(user);
        setEditFormData({
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department || '',
            course: user.course || '',
            semester: user.semester || ''
        });
        setPermissionsData(user.permissions || {});
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!selectedUser) return;
        try {
            const updates: Partial<User> = {
                ...editFormData,
                permissions: permissionsData
            };
            await updateUser(selectedUser.id, updates);
            setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, ...updates } : u));
            setIsEditModalOpen(false);
            showMsg('success', 'User details updated successfully');
        } catch (error) {
            showMsg('error', 'Failed to save changes');
        }
    };

    const handleDelete = async (userId: string) => {
        if (window.confirm("Are you sure you want to delete this user? This cannot be undone.")) {
            try {
                await deleteUser(userId);
                setUsers(prev => prev.filter(u => u.id !== userId));
                showMsg('info', 'User deleted.');
            } catch (error) {
                showMsg('error', 'Failed to delete user');
            }
        }
    };

    const handlePermissionChange = (module: string, level: PermissionLevel) => {
        setPermissionsData(prev => ({
            ...prev,
            [module.toUpperCase()]: level
        }));
    };

    // --- Filtering Logic ---
    const filteredUsers = users.filter(u => {
        // 1. Role Filter
        if (viewMode === 'FACULTY' && u.role !== UserRole.FACULTY) return false;
        if (viewMode === 'STUDENT' && u.role !== UserRole.STUDENT) return false;

        // 2. Specific Filters
        if (viewMode === 'FACULTY' && filterDept && u.department !== filterDept) return false;
        if (viewMode === 'STUDENT') {
            if (filterCourse && u.course !== filterCourse) return false;
            if (filterSem && u.semester !== filterSem) return false;
        }

        // 3. Search Filter
        const searchLower = searchTerm.toLowerCase();
        return (u.name?.toLowerCase() || '').includes(searchLower) || (u.email?.toLowerCase() || '').includes(searchLower);
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-slate-500">Loading users...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">User Management</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage existing accounts and permissions.</p>
                </div>

                {/* View Mode Toggle */}
                <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('FACULTY')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${viewMode === 'FACULTY' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    >
                        <i className="fa-solid fa-chalkboard-user mr-2"></i> Faculty
                    </button>
                    <button
                        onClick={() => setViewMode('STUDENT')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${viewMode === 'STUDENT' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    >
                        <i className="fa-solid fa-graduation-cap mr-2"></i> Students
                    </button>
                </div>
            </div>

            {/* Notification Toast */}
            {msg && (
                <div className={`px-4 py-3 rounded-lg flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : msg.type === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}`}>
                    <i className={`fa-solid ${msg.type === 'success' ? 'fa-check' : 'fa-info-circle'}`}></i> {msg.text}
                </div>
            )}

            {/* Dynamic Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <i className="fa-solid fa-search absolute left-3 top-3 text-slate-400"></i>
                    <input
                        type="text"
                        placeholder={`Search ${viewMode === 'FACULTY' ? 'faculty' : 'students'}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {viewMode === 'FACULTY' ? (
                    <div className="flex gap-4 w-full md:w-auto">
                        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-white w-full md:w-48">
                            <option value="">All Departments</option>
                            <option value="Computer Science">Computer Science</option>
                            <option value="Electronics">Electronics</option>
                            <option value="Physics">Physics</option>
                        </select>
                    </div>
                ) : (
                    <div className="flex gap-2 w-full md:w-auto">
                        <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)} className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-white w-full md:w-32">
                            <option value="">All Courses</option>
                            {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select value={filterSem} onChange={(e) => setFilterSem(e.target.value)} className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-white w-full md:w-32">
                            <option value="">All Sems</option>
                            {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                )}
            </div>

            {/* User Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Details</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredUsers.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden text-slate-500">
                                                {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" /> : <span className="font-bold">{u.name?.charAt(0)}</span>}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{u.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                        {viewMode === 'FACULTY' ? (
                                            <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-1 rounded text-xs font-bold">{u.department || 'N/A'}</span>
                                        ) : (
                                            <div className="flex flex-col">
                                                <span className="font-bold">{u.course}</span>
                                                <span className="text-xs">{u.semester}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase flex w-fit items-center gap-1 ${u.status === 'APPROVED' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'APPROVED' ? 'bg-green-600' : 'bg-gray-500'}`}></span>
                                            {u.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleStatusChange(u.id, u.status === 'APPROVED' ? 'DEACTIVATED' : 'APPROVED')} className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${u.status === 'APPROVED' ? 'text-orange-500' : 'text-green-600'}`} title={u.status === 'APPROVED' ? 'Deactivate' : 'Activate'}>
                                                <i className={`fa-solid ${u.status === 'APPROVED' ? 'fa-ban' : 'fa-power-off'}`}></i>
                                            </button>
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
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500 italic">
                                        No active users found matching your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Reuse Existing Modal Logic */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
                        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
                            <h2 className="text-lg font-bold">Edit Details</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white"><i className="fa-solid fa-xmark"></i></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div><label className="text-xs font-bold text-slate-500 uppercase">Name</label><input type="text" value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} className="w-full border p-2 rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" /></div>

                            {viewMode === 'FACULTY' ? (
                                <div><label className="text-xs font-bold text-slate-500 uppercase">Department</label><input type="text" value={editFormData.department} onChange={e => setEditFormData({ ...editFormData, department: e.target.value })} className="w-full border p-2 rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" /></div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-xs font-bold text-slate-500 uppercase">Course</label><input type="text" value={editFormData.course} onChange={e => setEditFormData({ ...editFormData, course: e.target.value })} className="w-full border p-2 rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" /></div>
                                    <div><label className="text-xs font-bold text-slate-500 uppercase">Semester</label><input type="text" value={editFormData.semester} onChange={e => setEditFormData({ ...editFormData, semester: e.target.value })} className="w-full border p-2 rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" /></div>
                                </div>
                            )}

                            {/* Permissions Table (Reused from your previous code) */}
                            <div className="mt-4 border-t pt-4">
                                <h3 className="font-bold text-sm mb-2 text-slate-700 dark:text-slate-300">Permissions</h3>
                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded border dark:border-slate-700 overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead><tr className="bg-slate-100 dark:bg-slate-800 text-xs uppercase text-slate-500"><th className="p-2 text-left">Module</th><th className="p-2 text-center">Read</th><th className="p-2 text-center">Write</th><th className="p-2 text-center">None</th></tr></thead>
                                        <tbody>
                                            {MODULES.map(mod => {
                                                const lvl = permissionsData[mod.toUpperCase()] || 'READ';
                                                return (
                                                    <tr key={mod} className="border-t dark:border-slate-700">
                                                        <td className="p-2 font-medium dark:text-slate-300">{mod}</td>
                                                        <td className="p-2 text-center"><input type="radio" checked={lvl === 'READ'} onChange={() => handlePermissionChange(mod, 'READ')} /></td>
                                                        <td className="p-2 text-center"><input type="radio" checked={lvl === 'WRITE'} onChange={() => handlePermissionChange(mod, 'WRITE')} /></td>
                                                        <td className="p-2 text-center"><input type="radio" checked={lvl === 'NONE'} onChange={() => handlePermissionChange(mod, 'NONE')} /></td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                                <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-500 font-medium">Cancel</button>
                                <button onClick={handleSaveEdit} className="px-4 py-2 bg-blue-600 text-white rounded font-bold">Save Changes</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagementPage;