import React, { useState, useEffect } from 'react';
import { User, Material } from '../../types';
import { getMaterialsForStudent, incrementDownloadCount } from '../../services/materialService';

interface Props {
    user: User;
}

const StudentResourcesPage: React.FC<Props> = ({ user }) => {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('ALL');

    useEffect(() => {
        loadData();
    }, [user.id]);

    const loadData = async () => {
        setLoading(true);
        // Assuming user object has a 'semester' field. 
        // If not, hardcode 'S5' or fetch from profile.
        const semester = (user as any).semester || 'S5';
        const data = await getMaterialsForStudent(semester);
        setMaterials(data);
        setLoading(false);
    };

    const handleDownload = async (material: Material) => {
        // 1. Open File
        window.open(material.fileUrl, '_blank');

        // 2. Track Analytics (Silent)
        try {
            await incrementDownloadCount(material.id);
        } catch (e) {
            console.error("Analytics failed", e);
        }
    };

    // --- FILTER LOGIC ---
    // Get unique subjects for the dropdown
    const subjects = ['ALL', ...Array.from(new Set(materials.map(m => m.subject)))];

    const filteredMaterials = materials.filter(item => {
        const matchesSearch =
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesSubject = selectedSubject === 'ALL' || item.subject === selectedSubject;

        return matchesSearch && matchesSubject;
    });

    return (
        <div className="space-y-6">
            {/* HEADER & SEARCH */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Study Materials</h1>
                    <p className="text-slate-500 dark:text-slate-400">Access lab manuals, notes, and references.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    {/* Subject Filter */}
                    <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-700 dark:text-white focus:outline-none focus:border-blue-500"
                    >
                        {subjects.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Subjects' : s}</option>)}
                    </select>

                    {/* Search Bar */}
                    <div className="relative">
                        <i className="fa-solid fa-magnifying-glass absolute left-3 top-3 text-slate-400"></i>
                        <input
                            type="text"
                            placeholder="Search topics..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full sm:w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* MATERIALS GRID */}
            {loading ? (
                <div className="text-center py-20 text-slate-400"><i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Loading library...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMaterials.length === 0 ? (
                        <div className="col-span-full p-12 text-center text-slate-400 bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                            {searchQuery ? 'No matches found.' : 'No materials uploaded for your semester yet.'}
                        </div>
                    ) : (
                        filteredMaterials.map(item => (
                            <div key={item.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-all hover:-translate-y-1 cursor-pointer" onClick={() => handleDownload(item)}>

                                <div className="flex items-start gap-4 mb-3">
                                    {/* Icon */}
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold shrink-0
                    ${item.fileType === 'PDF' ? 'bg-red-100 text-red-600' :
                                            item.fileType === 'ZIP' ? 'bg-yellow-100 text-yellow-600' :
                                                item.fileType === 'PPT' ? 'bg-orange-100 text-orange-600' :
                                                    'bg-blue-100 text-blue-600'}`}>
                                        {item.fileType}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="font-bold text-slate-800 dark:text-white truncate" title={item.title}>{item.title}</h3>
                                        <p className="text-xs text-slate-500">{item.subject}</p>
                                    </div>
                                </div>

                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2 h-10">
                                    {item.description || "No description provided."}
                                </p>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {item.tags.slice(0, 3).map(tag => (
                                        <span key={tag} className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full">#{tag}</span>
                                    ))}
                                    {item.tags.length > 3 && <span className="text-[10px] text-slate-400">+{item.tags.length - 3}</span>}
                                </div>

                                {/* Footer Info */}
                                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs text-slate-400">
                                    <span><i className="fa-regular fa-user mr-1"></i> {item.uploadedByName}</span>
                                    <span><i className="fa-regular fa-calendar mr-1"></i> {new Date(item.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default StudentResourcesPage;