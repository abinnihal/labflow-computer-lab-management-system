import React, { useState, useEffect } from 'react';
import { User, Task, Submission } from '../../types';
import {
   getTasksByFaculty,
   createTask,
   getSubmissionsForTask,
   updateSubmissionStatus,
   getTaskStats
} from '../../services/taskService';
import { uploadAssignment } from '../../services/storageService'; // <--- NEW IMPORT

interface Props {
   user: User;
}

const FacultyTasksPage: React.FC<Props> = ({ user }) => {
   const [tasks, setTasks] = useState<Task[]>([]);
   const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');
   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

   // Grading Modal State
   const [selectedTaskForGrading, setSelectedTaskForGrading] = useState<Task | null>(null);
   const [submissions, setSubmissions] = useState<Submission[]>([]);
   const [loading, setLoading] = useState(true);

   // Stats Cache
   const [stats, setStats] = useState<Record<string, any>>({});

   // Form State
   const [newTask, setNewTask] = useState<Partial<Task>>({
      title: '',
      description: '',
      dueDate: '',
      type: 'ASSIGNMENT',
      priority: 'MEDIUM'
   });

   // NEW: File Upload State
   const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
   const [isSubmitting, setIsSubmitting] = useState(false);

   useEffect(() => {
      refreshTasks();
   }, [user.id]);

   const refreshTasks = async () => {
      setLoading(true);
      const data = await getTasksByFaculty(user.id);
      setTasks(data);

      // Fetch stats for all tasks
      const newStats: Record<string, any> = {};
      for (const task of data) {
         newStats[task.id] = await getTaskStats(task.id);
      }
      setStats(newStats);
      setLoading(false);
   };

   const handleCreateTask = async () => {
      if (!newTask.title || !newTask.dueDate) return;
      setIsSubmitting(true);

      try {
         let uploadedUrl = '';

         // 1. Upload File if selected
         if (attachmentFile) {
            const result = await uploadAssignment(attachmentFile);
            uploadedUrl = result.url;
         }

         // 2. Create Task with URL
         await createTask({
            ...newTask as any,
            assignedById: user.id,
            assignedByName: user.name,
            status: 'OPEN',
            courseId: 'BCA-V', // In a real app, select course dynamically
            attachmentUrl: uploadedUrl // <--- Save the URL
         });

         setIsCreateModalOpen(false);
         setNewTask({ title: '', description: '', dueDate: '', type: 'ASSIGNMENT', priority: 'MEDIUM' });
         setAttachmentFile(null); // Reset file
         refreshTasks();
      } catch (error) {
         console.error("Failed to create task", error);
         alert("Failed to create task. If uploading a file, check your connection.");
      } finally {
         setIsSubmitting(false);
      }
   };

   const openGrading = async (task: Task) => {
      setSelectedTaskForGrading(task);
      const subs = await getSubmissionsForTask(task.id);
      setSubmissions(subs);
   };

   const handleGrade = async (subId: string, status: 'APPROVED' | 'REJECTED') => {
      await updateSubmissionStatus(subId, status, status === 'REJECTED' ? 'Needs improvement' : 'Good work');
      // Refresh local list
      if (selectedTaskForGrading) {
         const subs = await getSubmissionsForTask(selectedTaskForGrading.id);
         setSubmissions(subs);
         // Update stats
         const newStat = await getTaskStats(selectedTaskForGrading.id);
         setStats(prev => ({ ...prev, [selectedTaskForGrading.id]: newStat }));
      }
   };

   const activeTasks = tasks.filter(t => new Date(t.dueDate) >= new Date());

   return (
      <div className="space-y-6">
         <div className="flex justify-between items-center">
            <div>
               <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Assignments & Tasks</h1>
               <p className="text-slate-500 dark:text-slate-400">Manage coursework and grade submissions.</p>
            </div>
            <button
               onClick={() => setIsCreateModalOpen(true)}
               className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md flex items-center gap-2"
            >
               <i className="fa-solid fa-plus"></i> Create Assignment
            </button>
         </div>

         {loading ? (
            <div className="text-center py-20 text-slate-400 dark:text-slate-500">
               <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Loading tasks...
            </div>
         ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               {/* Task List */}
               <div className="space-y-4">
                  {activeTasks.length === 0 ? (
                     <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                        No active assignments. Create one to get started.
                     </div>
                  ) : (
                     activeTasks.map(task => (
                        <div key={task.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-colors cursor-pointer group" onClick={() => openGrading(task)}>
                           <div className="flex justify-between items-start mb-2">
                              <div>
                                 <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">
                                    {task.title}
                                    {/* Attachment Icon */}
                                    {task.attachmentUrl && (
                                       <span className="ml-2 text-xs text-slate-400" title="Has Attachment">
                                          <i className="fa-solid fa-paperclip"></i>
                                       </span>
                                    )}
                                 </h3>
                                 <p className="text-xs text-slate-500 dark:text-slate-400">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                              </div>
                              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${task.type === 'LAB_EXAM' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}`}>{task.type}</span>
                           </div>

                           {/* Stats Bar */}
                           <div className="mt-4 flex items-center gap-4 text-xs">
                              <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                 <div
                                    className="bg-green-500 h-full"
                                    style={{ width: `${stats[task.id] ? (stats[task.id].submitted / 30) * 100 : 0}%` }}
                                 ></div>
                              </div>
                              <span className="text-slate-600 dark:text-slate-400 font-mono">
                                 {stats[task.id]?.submitted || 0}/30 Submitted
                              </span>
                           </div>
                        </div>
                     ))
                  )}
               </div>

               {/* Grading Panel */}
               <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6 h-[600px] overflow-y-auto">
                  {selectedTaskForGrading ? (
                     <>
                        <div className="mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
                           <div className="flex justify-between items-start">
                              <div>
                                 <h2 className="text-xl font-bold text-slate-800 dark:text-white">{selectedTaskForGrading.title}</h2>
                                 <p className="text-sm text-slate-500 dark:text-slate-400">Submissions Review</p>
                              </div>
                              {selectedTaskForGrading.attachmentUrl && (
                                 <a
                                    href={selectedTaskForGrading.attachmentUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors"
                                 >
                                    <i className="fa-solid fa-download mr-1"></i> View Attachment
                                 </a>
                              )}
                           </div>
                        </div>

                        <div className="space-y-3">
                           {submissions.length === 0 ? (
                              <div className="text-center py-10 text-slate-400">No submissions yet.</div>
                           ) : (
                              submissions.map(sub => (
                                 <div key={sub.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                                    <div className="flex justify-between items-center mb-2">
                                       <h4 className="font-bold text-slate-700 dark:text-white">{sub.studentName}</h4>
                                       <span className="text-xs font-mono text-slate-500">{new Date(sub.submittedAt).toLocaleTimeString()}</span>
                                    </div>

                                    {/* Submission Content */}
                                    <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded text-sm text-slate-600 dark:text-slate-300 mb-3 overflow-hidden">
                                       {sub.textResponse && <p className="mb-2">{sub.textResponse}</p>}
                                       {sub.files && sub.files.length > 0 && (
                                          <div className="flex gap-2 mt-2">
                                             {sub.files.map((fileUrl, idx) => (
                                                <a
                                                   key={idx}
                                                   href={fileUrl}
                                                   target="_blank"
                                                   rel="noreferrer"
                                                   className="flex items-center gap-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 px-2 py-1 rounded hover:text-blue-600"
                                                >
                                                   <i className="fa-solid fa-file-arrow-down"></i> File {idx + 1}
                                                </a>
                                             ))}
                                          </div>
                                       )}
                                       {!sub.textResponse && (!sub.files || sub.files.length === 0) && (
                                          <span className="italic opacity-50">Empty submission</span>
                                       )}
                                    </div>

                                    <div className="flex gap-2">
                                       {sub.status === 'SUBMITTED' ? (
                                          <>
                                             <button onClick={() => handleGrade(sub.id, 'APPROVED')} className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 py-1.5 rounded text-xs font-bold transition-colors">Accept</button>
                                             <button onClick={() => handleGrade(sub.id, 'REJECTED')} className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-1.5 rounded text-xs font-bold transition-colors">Reject</button>
                                          </>
                                       ) : (
                                          <div className={`w-full text-center py-1.5 rounded text-xs font-bold uppercase ${sub.status === 'APPROVED' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                             {sub.status}
                                          </div>
                                       )}
                                    </div>
                                 </div>
                              ))
                           )}
                        </div>
                     </>
                  ) : (
                     <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                        <i className="fa-solid fa-arrow-left text-3xl mb-3 opacity-50"></i>
                        <p>Select an assignment to view submissions</p>
                     </div>
                  )}
               </div>
            </div>
         )}

         {/* Create Modal */}
         {isCreateModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
               <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg p-6 animate-fade-in-up">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">New Assignment</h3>
                  <div className="space-y-4">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                        <input type="text" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} className="w-full border border-slate-300 dark:border-slate-600 rounded px-3 py-2 dark:bg-slate-700 dark:text-white" />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                        <textarea value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} className="w-full border border-slate-300 dark:border-slate-600 rounded px-3 py-2 dark:bg-slate-700 dark:text-white h-24"></textarea>
                     </div>

                     {/* FILE UPLOAD INPUT */}
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Attachment (PDF/ZIP)</label>
                        <input
                           type="file"
                           onChange={e => setAttachmentFile(e.target.files ? e.target.files[0] : null)}
                           className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Due Date</label>
                           <input type="date" value={newTask.dueDate} onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })} className="w-full border border-slate-300 dark:border-slate-600 rounded px-3 py-2 dark:bg-slate-700 dark:text-white" />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                           <select value={newTask.type} onChange={e => setNewTask({ ...newTask, type: e.target.value as any })} className="w-full border border-slate-300 dark:border-slate-600 rounded px-3 py-2 dark:bg-slate-700 dark:text-white">
                              <option value="ASSIGNMENT">Assignment</option>
                              <option value="LAB_EXAM">Lab Exam</option>
                              <option value="PROJECT">Project</option>
                           </select>
                        </div>
                     </div>
                     <div className="flex justify-end gap-3 mt-4">
                        <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-bold">Cancel</button>
                        <button
                           onClick={handleCreateTask}
                           disabled={isSubmitting || !newTask.title}
                           className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                           {isSubmitting && <i className="fa-solid fa-circle-notch fa-spin"></i>}
                           {isSubmitting ? 'Uploading...' : 'Create Task'}
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default FacultyTasksPage;