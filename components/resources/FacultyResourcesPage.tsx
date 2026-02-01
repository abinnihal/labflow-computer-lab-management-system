import React, { useState, useEffect } from 'react';
import { User, Subject } from '../../types';
import {
    uploadResource,
    getResourcesBySubject,
    deleteResource,
    ResourceFile
} from '../../services/resourceService';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface Props {
    user: User;
}

const FacultyResourcesPage: React.FC<Props> = ({ user }) => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [resources, setResources] = useState<ResourceFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Upload Form State
    const [uploadData, setUploadData] = useState({
        title: '',
        description: '',
        file: null as File | null
    });

    // 1. Fetch Faculty's Subjects on Load
    useEffect(() => {
        const fetchFacultySubjects = async () => {
            try {
                const q = query(collection(db, 'subjects'), where('facultyId', '==', user.id));
                const snapshot = await getDocs(q);
                const subjList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
                setSubjects(subjList);

                // Auto-select first subject if available
                if (subjList.length > 0) {
                    setSelectedSubject(subjList[0]);
                }
            } catch (err) {
                console.error("Error loading subjects:", err);
            }
        };
        fetchFacultySubjects();
    }, [user.id]);

    // 2. Fetch Resources when Subject Changes
    useEffect(() => {
        if (selectedSubject) {
            loadResources();
        }
    }, [selectedSubject]);

    const loadResources = async () => {
        if (!selectedSubject) return;
        setIsLoading(true);
        try {
            // Fetch resources for this specific subject
            const files = await getResourcesBySubject(selectedSubject.semester, selectedSubject.id);
            setResources(files);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    // 3. Handle File Upload
    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSubject || !uploadData.file) return;

        setIsUploading(true);
        try {
            // Service now handles Cloudinary upload automatically
            await uploadResource(uploadData.file, {
                title: uploadData.title,
                description: uploadData.description,
                subjectId: selectedSubject.id,
                subjectName: selectedSubject.name,
                semester: selectedSubject.semester,
                uploadedBy: user.name
            });

            // Reset Form
            setUploadData({ title: '', description: '', file: null });
            // Refresh List
            await loadResources();
            alert("File uploaded successfully!");
        } catch (error) {
            console.error(error);
            alert("Upload failed. Please check your network or Cloudinary settings.");
        } finally {
            setIsUploading(false);
        }
    };

    // 4. Handle Delete (Updated for Cloudinary - Removed storagePath)
    const handleDelete = async (fileId: string) => {
        if (!window.confirm("Are you sure you want to delete this file?")) return;
        try {
            await deleteResource(fileId);
            setResources(prev => prev.filter(r => r.id !== fileId));
        } catch (error) {
            alert("Could not delete file.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Class Resources</h1>
                    <p className="text-slate-500 dark:text-slate-400">Upload study materials for your students.</p>
                </div>

                {/* Subject Selector Dropdown */}
                {subjects.length > 0 ? (
                    <select
                        className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-white font-bold"
                        value={selectedSubject?.id || ''}
                        onChange={(e) => setSelectedSubject(subjects.find(s => s.id === e.target.value) || null)}
                    >
                        {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.semester})</option>
                        ))}
                    </select>
                ) : (
                    <span className="text-red-500 text-sm font-bold bg-red-50 px-3 py-1 rounded">No subjects assigned yet.</span>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT COLUMN: Upload Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 sticky top-6">
                        <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white flex items-center gap-2">
                            <i className="fa-solid fa-cloud-arrow-up text-blue-500"></i> Upload New
                        </h3>

                        <form onSubmit={handleUpload} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={uploadData.title}
                                    onChange={e => setUploadData({ ...uploadData, title: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. Lab Manual Module 1"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                                <textarea
                                    rows={3}
                                    value={uploadData.description}
                                    onChange={e => setUploadData({ ...uploadData, description: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Brief description..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">File (PDF/Image)</label>
                                <input
                                    type="file"
                                    required
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    onChange={e => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
                                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isUploading || !selectedSubject}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                            >
                                {isUploading ? <><i className="fa-solid fa-spinner fa-spin"></i> Uploading...</> : 'Upload Resource'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* RIGHT COLUMN: File List */}
                <div className="lg:col-span-2 space-y-4">
                    {isLoading ? (
                        <div className="text-center py-10 text-slate-400"><i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Loading files...</div>
                    ) : resources.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                            <i className="fa-solid fa-folder-open text-3xl text-slate-300 mb-2"></i>
                            <p className="text-slate-500">No resources uploaded for this subject yet.</p>
                            <p className="text-xs text-slate-400 mt-1">Use the form on the left to add one.</p>
                        </div>
                    ) : (
                        resources.map(file => (
                            <div key={file.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center group hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${file.type === 'PDF' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                                        <i className={`fa-solid ${file.type === 'PDF' ? 'fa-file-pdf' : 'fa-image'}`}></i>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">{file.title}</h4>
                                        <p className="text-xs text-slate-500">{file.description}</p>
                                        <span className="text-[10px] text-slate-400 mt-1 inline-block">Uploaded on {new Date(file.uploadedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a href={file.url} target="_blank" rel="noreferrer" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                                        <i className="fa-solid fa-external-link-alt"></i>
                                    </a>
                                    <button
                                        onClick={() => handleDelete(file.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <i className="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
};

export default FacultyResourcesPage;