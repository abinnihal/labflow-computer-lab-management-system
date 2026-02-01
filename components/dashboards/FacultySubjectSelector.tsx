import React, { useState, useEffect } from 'react';
import { User, Subject } from '../../types';
import { getFacultySubjects } from '../../services/subjectService';
import { useNavigate } from 'react-router-dom';

interface Props {
    user: User;
}

const FacultySubjectSelector: React.FC<Props> = ({ user }) => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const list = await getFacultySubjects(user.id);
                setSubjects(list);
            } catch (error) {
                console.error("Error loading subjects", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSubjects();
    }, [user.id]);

    const handleSelectSubject = (subject: Subject) => {
        // STANDARD SUBJECT MODE
        localStorage.setItem('activeContext', 'SUBJECT'); // <--- NEW FLAG
        localStorage.setItem('activeSubjectId', subject.id);
        localStorage.setItem('activeSubjectName', subject.name);
        localStorage.setItem('activeSemester', subject.semester);
        window.dispatchEvent(new Event("storage"));
        navigate('/dashboard');
    };

    const handleSelectAdvisor = () => {
        // ADVISOR MODE
        if (!user.advisorSemester) return;

        localStorage.setItem('activeContext', 'ADVISOR'); // <--- NEW FLAG
        localStorage.setItem('activeSubjectId', 'ADVISOR_MODE');
        localStorage.setItem('activeSubjectName', `Class Advisor - ${user.advisorSemester}`);
        localStorage.setItem('activeSemester', user.advisorSemester);
        window.dispatchEvent(new Event("storage"));
        navigate('/dashboard');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <i className="fa-solid fa-circle-notch fa-spin text-4xl text-blue-600 mb-4"></i>
                    <p className="text-slate-500">Loading your profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 flex flex-col items-center justify-center">
            <div className="max-w-7xl w-full">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white mb-2">Welcome, {user.name}</h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400">Select a Workspace</p>
                </div>

                <div className="flex flex-wrap justify-center gap-8">

                    {/* --- 1. SPECIAL ADVISOR CARD (If applicable) --- */}
                    {user.isClassAdvisor && user.advisorSemester && (
                        <button
                            onClick={handleSelectAdvisor}
                            className="group relative bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-8 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 text-left w-full md:w-[350px] border border-transparent"
                        >
                            <div className="absolute top-4 right-4 bg-white/20 p-2 rounded-lg">
                                <i className="fa-solid fa-user-graduate text-white text-xl"></i>
                            </div>

                            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                                {user.advisorSemester} Batch
                            </span>

                            <h3 className="text-2xl font-bold text-white mt-4 mb-2">Class Advisor</h3>
                            <p className="text-sm text-purple-100 font-medium mb-6">
                                Manage Student Approvals & Batch Details
                            </p>

                            <div className="flex items-center gap-2 text-sm text-white font-bold uppercase tracking-wider group-hover:gap-3 transition-all">
                                <span>Open Office</span>
                                <i className="fa-solid fa-arrow-right"></i>
                            </div>
                        </button>
                    )}

                    {/* --- 2. SUBJECT CARDS --- */}
                    {subjects.map(subject => (
                        <button
                            key={subject.id}
                            onClick={() => handleSelectSubject(subject)}
                            className="group relative bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-700 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 text-left w-full md:w-[350px]"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="flex justify-between items-start mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl font-bold">
                                    {subject.name.charAt(0)}
                                </div>
                                <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                                    {subject.semester}
                                </span>
                            </div>

                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
                                {subject.name}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mb-6">
                                Code: {subject.code}
                            </p>

                            <div className="flex items-center gap-2 text-sm text-slate-400 font-bold uppercase tracking-wider group-hover:text-blue-600 transition-colors">
                                <span>Enter Classroom</span>
                                <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                            </div>
                        </button>
                    ))}
                </div>

                {subjects.length === 0 && !user.isClassAdvisor && (
                    <div className="text-center text-slate-400 mt-10">No subjects or roles assigned. Contact Admin.</div>
                )}
            </div>
        </div>
    );
};

export default FacultySubjectSelector;