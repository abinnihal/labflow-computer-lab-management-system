import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, PermissionLevel, UserStatus } from '../../types';
import {
    getAllUsers,
    updateUserStatus,
    deleteUser,
    updateUser,
    exportUsersToCSV,
    importUsersFromCSV
} from '../../services/userService';

const MODULES = ['Calendar', 'Tasks', 'Attendance', 'Community', 'Labs'];
const COURSES = ['BCA', 'B.Sc Computer Science', 'B.Tech CSE', 'MCA', 'M.Sc Computer Science'];
const SEMESTERS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];

interface Props {
    user?: User;
}

const UserManagementPage: React.FC<Props> = () => {
    const [viewMode, setViewMode] = useState<'FACULTY' | 'STUDENT'>('FACULTY');
    const [filterDept, setFilterDept] = useState('');
    const [filterCourse, setFilterCourse] = useState('');
    const [filterSem, setFilterSem] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Import State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);

    // Modal State
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState<Partial<User>>({});
    const [permissionsData, setPermissionsData] = useState<Record<string, PermissionLevel>>({});

    const [msg, setMsg] = useState<{ type: 'success' | 'info' | 'error', text: string } | null>(null);

    useEffect(() => {
        refreshUsers();
    }, []);

    const refreshUsers = async () => {
        setLoading(true);
        try {
            const data = await getAllUsers();
            // Filter out pending (they go to approvals) and imported placeholders
            const managedUsers = data.filter(u => u.status !== 'PENDING' && !u.id.startsWith('imported-') && u.role !== UserRole.ADMIN);
            setUsers(managedUsers);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    const showMsg = (type: 'success' | 'info' | 'error', text: string) => {
        setMsg({ type, text });
        setTimeout(() => setMsg(null), 4000);
    };

    // --- Import / Export Handlers ---

    const handleDownloadTemplate = () => {
        const headers = "Name,Email,Role,Department,Course,Semester";
        const example = "John Doe,john@college.edu,STUDENT,Computer Science,BCA,S1";
        const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + example;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "student_import_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExport = async () => {
        try {
            const csvData = await exportUsersToCSV();
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `user_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            showMsg('error', 'Export failed');
        }
    };

    const handleImportClick = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        const reader = new FileReader();

        reader.onload = async (e) => {
            const text = e.target?.result as string;
            if (text) {
                try {
                    const result = await importUsersFromCSV(text);
                    showMsg('success', `Imported ${result.count} users successfully. They are now Pre-Approved.`);
                    if (result.errors.length > 0) {
                        alert(`Imported with some errors:\n${result.errors.join('\n')}`);
                    }
                    refreshUsers();
                } catch (error) {
                    showMsg('error', 'Failed to import CSV. Check format.');
                } finally {
                    setIsImporting(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }
            }
        };
        reader.readAsText(file);
    };

    // --- Standard Handlers (Edit, Delete, etc.) ---
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
            const updates: Partial<User> = { ...editFormData, permissions: permissionsData };
            await updateUser(selectedUser.id, updates);
            setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, ...updates } : u));
            setIsEditModalOpen(false);
            showMsg('success', 'User details updated');
        } catch (error) {
            showMsg('error', 'Failed to save changes');
        }
    };

    const handleDelete = async (userId: string) => {
        if (window.confirm("Are you sure? This cannot be undone.")) {
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
        setPermissionsData(prev => ({ ...prev, [module.toUpperCase()]: level }));
    };

    // --- Filtering Logic ---
    const filteredUsers = users.filter(u => {
        if (viewMode === 'FACULTY' && u.role !== UserRole.FACULTY) return false;
        if (viewMode === 'STUDENT' && u.role !== UserRole.STUDENT) return false;
        if (viewMode === 'FACULTY' && filterDept && u.department !== filterDept) return false;
        if (viewMode === 'STUDENT') {
            if (filterCourse && u.course !== filterCourse) return false;
            if (filterSem && u.semester !== filterSem) return false;
        }
        const searchLower = searchTerm.toLowerCase();
        return (u.name?.toLowerCase() || '').includes(searchLower) || (u.email?.toLowerCase() || '').includes(searchLower);
    });

    if (loading) return <div className="flex justify-center h-64 items-center"><span className="text-slate-500">Loading users...</span></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">User Management</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage existing accounts and permissions.</p>
                </div>

                {/* View Mode */}
                <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg">
                    <button onClick={() => setViewMode('FACULTY')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${viewMode === 'FACULTY' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                        <i className="fa-solid fa-chalkboard-user mr-2"></i> Faculty
                    </button>
                    <button onClick={() => setViewMode('STUDENT')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${viewMode === 'STUDENT' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                        <i className="fa-solid fa-graduation-cap mr-2"></i> Students
                    </button>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm gap-4">
                <div className="flex-1 relative min-w-[200px]">
                    <i className="fa-solid fa-search absolute left-3 top-3 text-slate-400"></i>
                    <input type="text" placeholder={`Search ${viewMode === 'FACULTY' ? 'faculty' : 'students'}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg" />
                </div>

                <div className="flex gap-2">
                    {/* Hidden File Input */}
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />

                    <button onClick={handleDownloadTemplate} className="text-slate-500 text-xs underline px-2">Download Template</button>

                    <button onClick={handleImportClick} disabled={isImporting} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center gap-2">
                        {isImporting ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-file-import"></i>}
                        Import CSV
                    </button>
                    <button onClick={handleExport} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
                        <i className="fa-solid fa-file-export"></i> Export
                    </button>
                </div>
            </div>

            {msg && (
                <div className={`px-4 py-3 rounded-lg flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : msg.type === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}`}>
                    <i className={`fa-solid ${msg.type === 'success' ? 'fa-check' : 'fa-info-circle'}`}></i> {msg.text}
                </div>
            )}

            {/* Filters */}
            {viewMode === 'FACULTY' ? (
                <div className="flex gap-4">
                    <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-white w-full md:w-48">
                        <option value="">All Departments</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Electronics">Electronics</option>
                    </select>
                </div>
            ) : (
                <div className="flex gap-2">
                    <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)} className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-white w-full md:w-32">
                        <option value="">All Courses</option>
                        {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select value={filterSem} onChange={(e) => setFilterSem(e.target.value)} className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-white w-full md:w-32">
                        <option value="">All Sems</option>
                        {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            )}

            {/* Table */}
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
                                            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden text-slate-500 font-bold">
                                                {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" /> : u.name?.charAt(0)}
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

            {/* Edit Modal (Same as before, just kept for completeness) */}
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