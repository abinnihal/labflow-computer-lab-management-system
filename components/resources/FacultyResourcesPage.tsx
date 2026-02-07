import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import {
    uploadResource,
    getResourcesBySubject,
    deleteResource,
    ResourceFile
} from '../../services/resourceService';
import { db } from '../../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface Props {
    user: User;
}

const FacultyResourcesPage: React.FC<Props> = ({ user }) => {
    // 1. GET ACTIVE CONTEXT
    const subjectId = localStorage.getItem('activeSubjectId');
    const subjectName = localStorage.getItem('activeSubjectName') || 'General';

    const [activeSemester, setActiveSemester] = useState<string>('');
    const [resources, setResources] = useState<ResourceFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Upload Form State
    const [uploadData, setUploadData] = useState({
        title: '',
        description: '',
        file: null as File | null
    });

    // 2. Fetch Subject Details (Semester) on Load
    useEffect(() => {
        const initPage = async () => {
            if (subjectId) {
                await fetchSubjectDetails();
                loadResources(); // Load resources immediately after checking context
            }
        };
        initPage();
    }, [subjectId]);

    const fetchSubjectDetails = async () => {
        if (!subjectId) return;
        try {
            const subDoc = await getDoc(doc(db, 'subjects', subjectId));
            if (subDoc.exists()) {
                setActiveSemester(subDoc.data().semester || '');
            }
        } catch (err) {
            console.error("Error fetching subject details:", err);
        }
    };

    // 3. Load Resources
    const loadResources = async () => {
        if (!subjectId) return;
        setIsLoading(true);
        try {
            // We need the semester to fetch correctly if utilizing the student-side query logic,
            // but for faculty, we primarily filter by subjectId in the service.
            // Passing activeSemester ensures compatibility.
            const files = await getResourcesBySubject(activeSemester, subjectId);
            setResources(files);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    // 4. Handle File Upload
    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subjectId || !uploadData.file) return;

        setIsUploading(true);
        try {
            await uploadResource(uploadData.file, {
                title: uploadData.title,
                description: uploadData.description,
                subjectId: subjectId,
                subjectName: subjectName,
                semester: activeSemester, // Crucial for Student filtering
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

    // 5. Handle Delete
    const handleDelete = async (fileId: string) => {
        if (!window.confirm("Are you sure you want to delete this file?")) return;
        try {
            await deleteResource(fileId);
            setResources(prev => prev.filter(r => r.id !== fileId));
        } catch (error) {
            alert("Could not delete file.");
        }
    };

    if (!subjectId) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <i className="fa-solid fa-folder-open text-4xl mb-4 opacity-50"></i>
                <p>Please select a subject from the Dashboard to view resources.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Class Resources</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Managing: <span className="font-bold text-blue-600">{subjectName}</span>
                        {activeSemester && <span className="ml-2 text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">{activeSemester}</span>}
                    </p>
                </div>
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
                                disabled={isUploading}
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