import React, { useState, useEffect } from 'react';
import { User, Subject } from '../../types';
import { getStudentSubjects } from '../../services/subjectService';
// You'll need to ensure you have a service to fetch resources. 
// If not, we can mock it or you can use your existing getResources function.
import { getResourcesBySubject, ResourceFile } from '../../services/resourceService';

interface Props {
    user: User;
}

const StudentResourcesPage: React.FC<Props> = ({ user }) => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');
    const [resources, setResources] = useState<ResourceFile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSubjectsAndResources();
    }, [user.semester]);

    const fetchSubjectsAndResources = async () => {
        try {
            setLoading(true);
            // 1. Fetch Subjects for the Student's Semester
            const semester = user.semester || (user.managedSemesters ? user.managedSemesters[0] : '');
            let fetchedSubjects: Subject[] = [];

            if (semester) {
                fetchedSubjects = await getStudentSubjects(semester);
                setSubjects(fetchedSubjects);
            }

            // 2. Fetch Resources (Mock logic or real service call)
            // Ideally, you pass the semester or fetch all and filter.
            // For now, let's assume we fetch all for the semester.
            const allResources = await getResourcesBySubject(semester);
            setResources(allResources);

        } catch (error) {
            console.error("Failed to load resources", error);
        } finally {
            setLoading(false);
        }
    };

    // --- FILTER LOGIC ---
    const filteredResources = resources.filter(res => {
        if (selectedSubjectId === 'ALL') return true;
        return res.subjectId === selectedSubjectId;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Resource Hub</h1>
                    <p className="text-slate-500 dark:text-slate-400">Access notes, slides, and lab manuals.</p>
                </div>

                {/* SUBJECT FILTER */}
                {subjects.length > 0 && (
                    <div className="w-full md:w-64">
                        <select
                            value={selectedSubjectId}
                            onChange={(e) => setSelectedSubjectId(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                        >
                            <option value="ALL">All Subjects</option>
                            {subjects.map(sub => (
                                <option key={sub.id} value={sub.id}>{sub.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-400">
                    <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Loading resources...
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResources.length === 0 ? (
                        <div className="col-span-full p-12 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                <i className="fa-solid fa-folder-open text-2xl"></i>
                            </div>
                            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Resources Found</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {selectedSubjectId !== 'ALL'
                                    ? "No materials uploaded for this subject yet."
                                    : "Your teachers haven't uploaded any notes."}
                            </p>
                        </div>
                    ) : (
                        filteredResources.map(file => (
                            <div key={file.id} className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                        <i className="fa-solid fa-file-pdf"></i>
                                    </div>
                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-1 rounded uppercase font-bold">
                                        {file.type || 'PDF'}
                                    </span>
                                </div>

                                <h3 className="font-bold text-slate-800 dark:text-white mb-1 line-clamp-1">{file.title}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{file.description}</p>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{file.subjectName}</span>
                                    <a
                                        href={file.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                    >
                                        Download <i className="fa-solid fa-download ml-1"></i>
                                    </a>
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