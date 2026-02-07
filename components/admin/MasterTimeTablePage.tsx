import React, { useState, useEffect } from 'react';
import { getAllLabs } from '../../services/labService';
import { saveTimeTableSlot, deleteTimeTableSlot, getClassSchedule } from '../../services/timetableService';
import { Lab, Subject, TimeTableSlot, User } from '../../types';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIMES = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

const COURSES = ['BCA', 'B.Sc Computer Science', 'B.Tech CSE', 'MCA', 'M.Sc Computer Science'];

const MasterTimeTablePage: React.FC = () => {
    const [selectedCourse, setSelectedCourse] = useState('BCA'); // Default
    const [selectedSemester, setSelectedSemester] = useState('S1');

    const [schedule, setSchedule] = useState<TimeTableSlot[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Resources
    const [labs, setLabs] = useState<Lab[]>([]);
    const [facultyList, setFacultyList] = useState<User[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSlot, setEditingSlot] = useState<Partial<TimeTableSlot>>({
        dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:00', batch: 'ALL'
    });

    useEffect(() => {
        const fetchResources = async () => {
            try {
                const labData = await getAllLabs();
                setLabs(labData);
                const fSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'FACULTY')));
                setFacultyList(fSnap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
                const sSnap = await getDocs(collection(db, 'subjects'));
                setSubjects(sSnap.docs.map(d => ({ id: d.id, ...d.data() } as Subject)));
            } catch (error) {
                console.error("Failed to load resources", error);
            }
        };
        fetchResources();
    }, []);

    useEffect(() => {
        fetchSchedule();
    }, [selectedCourse, selectedSemester]); // Refresh when Course OR Sem changes

    const fetchSchedule = async () => {
        setLoading(true);
        try {
            const data = await getClassSchedule(selectedCourse, selectedSemester);
            setSchedule(data);
        } catch (error) {
            console.error("Error loading schedule:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editingSlot.subjectId || !editingSlot.facultyId || !editingSlot.labId) {
            alert("Please select Subject, Faculty, and Lab.");
            return;
        }

        setIsSaving(true);
        try {
            const subject = subjects.find(s => s.id === editingSlot.subjectId);
            const faculty = facultyList.find(f => f.id === editingSlot.facultyId);
            const lab = labs.find(l => l.id === editingSlot.labId);

            await saveTimeTableSlot({
                ...editingSlot as any,
                subjectName: subject?.name || 'Unknown',
                facultyName: faculty?.name || 'Unknown',
                labName: lab?.name || 'Unknown',
                course: selectedCourse,   // <--- Saving Course
                semester: selectedSemester
            });

            setIsModalOpen(false);
            await fetchSchedule();
        } catch (error: any) {
            alert(`Failed to save: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Delete this class?")) {
            await deleteTimeTableSlot(id);
            fetchSchedule();
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* HEADER WITH FILTERS */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Master Timetable</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Configure class schedule</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* COURSE SELECTOR */}
                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Course</label>
                        <select
                            value={selectedCourse}
                            onChange={e => setSelectedCourse(e.target.value)}
                            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        >
                            {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* SEMESTER SELECTOR */}
                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Semester</label>
                        <select
                            value={selectedSemester}
                            onChange={e => setSelectedSemester(e.target.value)}
                            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        >
                            {['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* SCHEDULE TABLE */}
            <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-700 text-xs uppercase text-slate-500 font-bold">
                        <tr>
                            <th className="px-4 py-4 w-24 border-r dark:border-slate-700 sticky left-0 bg-slate-50 dark:bg-slate-900 z-10">Time</th>
                            {DAYS.map(d => <th key={d} className="px-4 py-4 text-center border-r dark:border-slate-700 min-w-[140px]">{d}</th>)}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {TIMES.map(time => (
                            <tr key={time} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-4 py-3 font-bold bg-slate-50/80 dark:bg-slate-900/80 border-r dark:border-slate-700 sticky left-0 z-10 text-slate-600 dark:text-slate-400">{time}</td>
                                {DAYS.map(day => {
                                    const slot = schedule.find(s => s.dayOfWeek === day && s.startTime === time);
                                    return (
                                        <td key={day + time} className="border-r dark:border-slate-700 text-center p-1 h-28 align-top relative group">
                                            {slot ? (
                                                <div className="bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 p-2 rounded-lg h-full text-xs flex flex-col justify-between cursor-pointer border border-blue-100 dark:border-blue-800 transition-all shadow-sm hover:shadow-md" onClick={() => handleDelete(slot.id)}>
                                                    <div className="text-left">
                                                        <span className="font-bold text-blue-700 dark:text-blue-300 block mb-1 text-sm line-clamp-2 leading-tight">{slot.subjectName}</span>
                                                        <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold tracking-wide">{slot.facultyName}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-200 dark:border-blue-800/50">
                                                        <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{slot.labName}</span>
                                                        {slot.batch !== 'ALL' && <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[9px] font-bold">{slot.batch}</span>}
                                                    </div>
                                                    <div className="absolute inset-0 bg-red-500/10 dark:bg-red-500/20 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity">
                                                        <i className="fa-solid fa-trash text-red-600 bg-white dark:bg-slate-900 p-2 rounded-full shadow-lg"></i>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setEditingSlot({ dayOfWeek: day as any, startTime: time, endTime: time.replace(/:00/, ':59'), semester: selectedSemester, batch: 'ALL' });
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="w-full h-full text-transparent hover:text-slate-400 flex flex-col items-center justify-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-all"
                                                >
                                                    <i className="fa-solid fa-plus text-xl"></i>
                                                    <span className="text-xs font-bold">Add</span>
                                                </button>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700 animate-scale-up">
                        <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-4">Add Class for {selectedCourse} {selectedSemester}</h3>

                        <div className="space-y-4">
                            {/* Subject Selector */}
                            <div>
                                <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Subject</label>
                                <select
                                    onChange={e => setEditingSlot({ ...editingSlot, subjectId: e.target.value })}
                                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                >
                                    <option value="">Select Subject</option>
                                    {/* Filter subjects by current semester if your subject data has semester info */}
                                    {subjects.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Faculty Selector */}
                            <div>
                                <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Faculty</label>
                                <select
                                    onChange={e => setEditingSlot({ ...editingSlot, facultyId: e.target.value })}
                                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                >
                                    <option value="">Select Faculty</option>
                                    {facultyList.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                            </div>

                            {/* Lab Selector */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Lab Venue</label>
                                    <select
                                        onChange={e => setEditingSlot({ ...editingSlot, labId: e.target.value })}
                                        className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                    >
                                        <option value="">Select Lab</option>
                                        {labs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Batch</label>
                                    <select
                                        value={editingSlot.batch}
                                        onChange={e => setEditingSlot({ ...editingSlot, batch: e.target.value })}
                                        className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                    >
                                        <option value="ALL">All Batches</option>
                                        <option value="A">Batch A</option>
                                        <option value="B">Batch B</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700 mt-2">
                                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-bold text-slate-500">Cancel</button>
                                <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold">
                                    {isSaving ? 'Saving...' : 'Save Class'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default MasterTimeTablePage;