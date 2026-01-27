// src/pages/faculty/FacultyResourcesPage.tsx
import React, { useState, useEffect } from 'react';
import { User, Material } from '../../types';
import { addMaterial, getMaterialsByFaculty, deleteMaterial } from '../../services/materialService';
import { uploadAssignment } from '../../services/storageService'; // Re-using your existing upload service

interface Props {
    user: User;
}

const FacultyResourcesPage: React.FC<Props> = ({ user }) => {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [form, setForm] = useState({
        title: '',
        description: '',
        subject: '',
        semester: 'S5', // Default
        tags: '',
    });
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        refreshMaterials();
    }, [user.id]);

    const refreshMaterials = async () => {
        setLoading(true);
        const data = await getMaterialsByFaculty(user.id);
        setMaterials(data);
        setLoading(false);
    };

    const handleUpload = async () => {
        if (!form.title || !file) return;
        setIsSubmitting(true);

        try {
            // 1. Upload File
            const uploadResult = await uploadAssignment(file); // Returns { url, type? }

            // 2. Determine File Type Icon
            const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
            let fileType = 'FILE';
            if (['PDF'].includes(ext)) fileType = 'PDF';
            if (['PPT', 'PPTX'].includes(ext)) fileType = 'PPT';
            if (['ZIP', 'RAR'].includes(ext)) fileType = 'ZIP';
            if (['JPG', 'PNG', 'JPEG'].includes(ext)) fileType = 'IMG';

            // 3. Save Metadata
            await addMaterial({
                title: form.title,
                description: form.description,
                subject: form.subject,
                semester: form.semester,
                batch: ['ALL'], // Default for now
                tags: form.tags.split(',').map(t => t.trim()).filter(t => t),
                fileUrl: uploadResult.url,
                fileType: fileType,
                uploadedBy: user.id,
                uploadedByName: user.name
            });

            // Reset
            setIsModalOpen(false);
            setForm({ title: '', description: '', subject: '', semester: 'S5', tags: '' });
            setFile(null);
            refreshMaterials();
        } catch (error) {
            console.error(error);
            alert("Upload failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this resource?")) return;
        await deleteMaterial(id);
        refreshMaterials();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Resource Hub</h1>
                    <p className="text-slate-500 dark:text-slate-400">Share study materials and lab manuals.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md flex items-center gap-2 transition-transform hover:scale-105"
                >
                    <i className="fa-solid fa-cloud-arrow-up"></i> Upload Material
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-400"><i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Loading resources...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {materials.length === 0 ? (
                        <div className="col-span-full p-12 text-center text-slate-400 bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                            No materials uploaded yet.
                        </div>
                    ) : (
                        materials.map(item => (
                            <div key={item.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-colors group relative">

                                {/* Delete Button (Hover) */}
                                <button onClick={() => handleDelete(item.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <i className="fa-solid fa-trash"></i>
                                </button>

                                <div className="flex items-start gap-4">
                                    {/* Icon Based on Type */}
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold 
                    ${item.fileType === 'PDF' ? 'bg-red-100 text-red-600' :
                                            item.fileType === 'ZIP' ? 'bg-yellow-100 text-yellow-600' :
                                                item.fileType === 'PPT' ? 'bg-orange-100 text-orange-600' :
                                                    'bg-blue-100 text-blue-600'}`}>
                                        {item.fileType}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-white line-clamp-1">{item.title}</h3>
                                        <p className="text-xs text-slate-500">{item.subject} • {item.semester}</p>
                                    </div>
                                </div>

                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 line-clamp-2 h-10">{item.description || "No description provided."}</p>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {item.tags.map(tag => (
                                        <span key={tag} className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full">#{tag}</span>
                                    ))}
                                </div>

                                {/* Footer: Downloads & Link */}
                                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                    <span className="text-xs text-slate-400 font-mono">
                                        <i className="fa-solid fa-download mr-1"></i> {item.downloadCount}
                                    </span>
                                    <a
                                        href={item.fileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                        View <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                                    </a>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* UPLOAD MODAL (Dark Theme) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg p-6 animate-fade-in-up border border-slate-700">
                        <h3 className="text-lg font-bold text-white mb-6">Upload Material</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Title</label>
                                <input
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="e.g. Lab Manual - Exp 1"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Subject</label>
                                    <input
                                        value={form.subject}
                                        onChange={e => setForm({ ...form, subject: e.target.value })}
                                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                        placeholder="e.g. Java"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Semester</label>
                                    <select
                                        value={form.semester}
                                        onChange={e => setForm({ ...form, semester: e.target.value })}
                                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                    >
                                        <option>S1</option><option>S2</option><option>S3</option><option>S4</option><option>S5</option><option>S6</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 h-20 text-white focus:outline-none focus:border-blue-500 resize-none"
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tags (comma separated)</label>
                                <input
                                    value={form.tags}
                                    onChange={e => setForm({ ...form, tags: e.target.value })}
                                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="e.g. Important, Syllabus, Unit 1"
                                />
                            </div>

                            <div className="pt-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">File Attachment</label>
                                <input
                                    type="file"
                                    onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                                    className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-blue-400 hover:file:bg-slate-600 cursor-pointer"
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
                                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white font-bold transition-colors">Cancel</button>
                                <button
                                    onClick={handleUpload}
                                    disabled={isSubmitting || !form.title || !file}
                                    className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg shadow-blue-900/20"
                                >
                                    {isSubmitting ? 'Uploading...' : 'Upload'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultyResourcesPage;