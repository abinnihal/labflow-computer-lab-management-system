import React, { useState, useEffect } from 'react';
import { User, Task, Submission } from '../../types';
import {
   getTasksByFaculty,
   createTask,
   getSubmissionsForTask,
   updateSubmissionStatus,
   getTaskStats,
   deleteTask
} from '../../services/taskService';
import { uploadAssignment } from '../../services/storageService';
// --- ALFRED'S UPGRADE: Added collection, addDoc, and Timestamp ---
import { doc, getDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface Props {
   user: User;
}

// TAB TYPES
type TaskTab = 'ASSIGNMENT' | 'LAB_EXAM' | 'PROJECT';

const FacultyTasksPage: React.FC<Props> = ({ user }) => {
   // 1. GET ACTIVE CONTEXT
   const subjectId = localStorage.getItem('activeSubjectId');
   const subjectName = localStorage.getItem('activeSubjectName') || 'General';

   const [tasks, setTasks] = useState<Task[]>([]);
   const [activeTab, setActiveTab] = useState<TaskTab>('ASSIGNMENT');
   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

   // Store the actual semester (e.g. "S5")
   const [activeSemester, setActiveSemester] = useState<string>('');

   const [selectedTaskForGrading, setSelectedTaskForGrading] = useState<Task | null>(null);
   const [submissions, setSubmissions] = useState<Submission[]>([]);
   const [loading, setLoading] = useState(true);
   const [stats, setStats] = useState<Record<string, any>>({});

   const [newTask, setNewTask] = useState<Partial<Task>>({
      title: '', description: '', dueDate: '', type: 'ASSIGNMENT', priority: 'MEDIUM', duration: ''
   });
   const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
   const [isSubmitting, setIsSubmitting] = useState(false);

   useEffect(() => {
      if (subjectId) {
         fetchSubjectDetails();
         refreshTasks();
      }
   }, [user.id, subjectId]);

   // Fetch the real semester for this subject
   const fetchSubjectDetails = async () => {
      if (!subjectId) return;
      try {
         const subDoc = await getDoc(doc(db, 'subjects', subjectId));
         if (subDoc.exists()) {
            const data = subDoc.data();
            setActiveSemester(data.semester || '');
         }
      } catch (err) {
         console.error("Error fetching subject details", err);
      }
   };

   const refreshTasks = async () => {
      if (!subjectId) return;

      setLoading(true);
      const allTasks = await getTasksByFaculty(user.id);

      // 2. FILTER TASKS BY ACTIVE SUBJECT
      const classTasks = allTasks.filter(t => t.subjectId === subjectId);
      setTasks(classTasks);

      const newStats: Record<string, any> = {};
      for (const task of classTasks) {
         newStats[task.id] = await getTaskStats(task.id);
      }
      setStats(newStats);
      setLoading(false);
   };

   const handleOpenCreateModal = () => {
      setNewTask({
         title: '',
         description: '',
         dueDate: '',
         type: activeTab, // Set type based on the current tab
         priority: 'MEDIUM',
         duration: ''
      });
      setAttachmentFile(null);
      setIsCreateModalOpen(true);
   };

   const handleCreateTask = async () => {
      if (!newTask.title || !newTask.dueDate) {
         alert("Please fill all required fields.");
         return;
      }

      if (!subjectId) {
         alert("Session Error: No Active Subject found. Please re-login.");
         return;
      }

      setIsSubmitting(true);
      try {
         let uploadedUrl = '';
         if (attachmentFile) {
            const result = await uploadAssignment(attachmentFile);
            uploadedUrl = result.url;
         }

         // 1. Save the actual task
         await createTask({
            ...newTask as any,
            assignedById: user.id,
            assignedByName: user.name,
            status: 'OPEN',
            course: activeSemester,
            subjectId: subjectId,
            subjectName: subjectName,
            attachmentUrl: uploadedUrl
         });

         // --- ALFRED'S UPGRADE: Automated Bell Notification ---
         try {
            await addDoc(collection(db, 'notifications'), {
               senderName: user.name, // The Faculty's name
               targetGroup: 'ALL_STUDENTS', // Instantly alerts students
               title: `New ${activeTab.replace('_', ' ')}`,
               message: `A new ${activeTab.replace('_', ' ').toLowerCase()} "${newTask.title}" has been posted for ${subjectName}.`,
               type: 'INFO',
               sentAt: Timestamp.now(),
               deliveryCount: 0,
               readCount: 0
            });
         } catch (notifErr) {
            // We catch this silently so the task still saves even if the notification fails
            console.error("Failed to send automated notification:", notifErr);
         }
         // ----------------------------------------------------

         setIsCreateModalOpen(false);
         refreshTasks();
      } catch (error) {
         console.error("Failed to create task", error);
         alert("Failed to create task.");
      } finally { setIsSubmitting(false); }
   };

   // Handle Delete
   const handleDeleteTask = async (e: React.MouseEvent, taskId: string) => {
      e.stopPropagation(); // Prevent opening the grading panel
      if (!window.confirm("Are you sure you want to delete this task? All student submissions will be lost.")) return;

      try {
         await deleteTask(taskId);
         setTasks(prev => prev.filter(t => t.id !== taskId));
         if (selectedTaskForGrading?.id === taskId) {
            setSelectedTaskForGrading(null);
         }
      } catch (error) {
         alert("Failed to delete task.");
      }
   };

   const openGrading = async (task: Task) => {
      setSelectedTaskForGrading(task);
      setSubmissions([]);
      const subs = await getSubmissionsForTask(task.id);
      setSubmissions(subs);
   };

   const handleGrade = async (subId: string, status: 'APPROVED' | 'REJECTED') => {
      await updateSubmissionStatus(subId, status, status === 'REJECTED' ? 'Needs improvement' : 'Good work');
      if (selectedTaskForGrading) {
         const subs = await getSubmissionsForTask(selectedTaskForGrading.id);
         setSubmissions(subs);
         const newStat = await getTaskStats(selectedTaskForGrading.id);
         setStats(prev => ({ ...prev, [selectedTaskForGrading.id]: newStat }));
      }
   };

   const filteredTasks = tasks.filter(t => t.type === activeTab);

   if (!subjectId) {
      return <div className="p-10 text-center text-slate-400">Please select a class from the dashboard to view tasks.</div>;
   }

   return (
      <div className="space-y-6">
         {/* --- HEADER --- */}
         <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            <div>
               <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Assignments & Exams</h1>
               <p className="text-slate-500 dark:text-slate-400">
                  Managing: <span className="font-bold text-blue-600">{subjectName}</span>
                  <span className="ml-2 text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">{activeSemester}</span>
               </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
               <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm w-full sm:w-fit">
                  <button onClick={() => setActiveTab('ASSIGNMENT')} className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'ASSIGNMENT' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Assignments</button>
                  <button onClick={() => setActiveTab('LAB_EXAM')} className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'LAB_EXAM' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Lab Exams</button>
                  <button onClick={() => setActiveTab('PROJECT')} className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'PROJECT' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Projects</button>
               </div>

               <button onClick={handleOpenCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md flex items-center gap-2 transition-transform hover:scale-105 w-full sm:w-auto justify-center">
                  <i className="fa-solid fa-plus"></i> Create New
               </button>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Task List */}
            <div className="space-y-4">
               {loading ? <div className="text-center py-10 text-slate-400"><i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Loading...</div> :
                  filteredTasks.length === 0 ? (
                     <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                        No {activeTab.replace('_', ' ').toLowerCase()}s for {subjectName}.
                     </div>
                  ) : (
                     filteredTasks.map(task => (
                        <div key={task.id} className={`bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border transition-all cursor-pointer group relative ${selectedTaskForGrading?.id === task.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-700 hover:border-blue-400'}`} onClick={() => openGrading(task)}>

                           {/* DELETE BUTTON */}
                           <button
                              onClick={(e) => handleDeleteTask(e, task.id)}
                              className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                              title="Delete Task"
                           >
                              <i className="fa-solid fa-trash"></i>
                           </button>

                           <div className="flex justify-between items-start mb-2 pr-8">
                              <div>
                                 <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors inline">{task.title}</h3>
                                 <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                              </div>
                              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${task.type === 'LAB_EXAM' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}`}>{task.type.replace('_', ' ')}</span>
                           </div>

                           {/* ATTACHMENT INDICATOR */}
                           {task.attachmentUrl && (
                              <div className="text-[10px] text-blue-500 font-bold mb-2 flex items-center gap-1">
                                 <i className="fa-solid fa-paperclip"></i> Attachment Included
                              </div>
                           )}

                           <div className="mt-4 flex items-center gap-4 text-xs">
                              <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                 <div className="bg-green-500 h-full" style={{ width: `${stats[task.id] ? (stats[task.id].submitted / 30) * 100 : 0}%` }}></div>
                              </div>
                              <span className="text-slate-600 dark:text-slate-400 font-mono">{stats[task.id]?.submitted || 0} Submitted</span>
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
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">{selectedTaskForGrading.title}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Submissions Review</p>
                        {selectedTaskForGrading.attachmentUrl && (
                           <a href={selectedTaskForGrading.attachmentUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded hover:bg-blue-200 transition-colors">
                              <i className="fa-solid fa-download mr-1"></i> View Task Attachment
                           </a>
                        )}
                     </div>

                     <div className="space-y-3">
                        {submissions.length === 0 ? <div className="text-center py-10 text-slate-400">No submissions yet.</div> :
                           submissions.map(sub => (
                              <div key={sub.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                                 <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-bold text-slate-700 dark:text-white">{sub.studentName}</h4>
                                    <span className="text-xs font-mono text-slate-500">{new Date(sub.submittedAt).toLocaleTimeString()}</span>
                                 </div>
                                 <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded text-sm text-slate-600 dark:text-slate-300 mb-3 overflow-hidden whitespace-pre-wrap font-mono">
                                    {sub.textResponse || <span className="italic opacity-50">No text content</span>}
                                 </div>
                                 {sub.files?.length > 0 && (
                                    <div className="mb-3">
                                       {sub.files.map((f, i) => <a key={i} href={f} target="_blank" rel="noreferrer" className="text-xs bg-white dark:bg-slate-700 border dark:border-slate-600 px-2 py-1 rounded mr-2 text-blue-600 dark:text-blue-400 hover:underline"><i className="fa-solid fa-file"></i> View File</a>)}
                                    </div>
                                 )}
                                 <div className="flex gap-2">
                                    {sub.status === 'SUBMITTED' ? (
                                       <>
                                          <button onClick={() => handleGrade(sub.id, 'APPROVED')} className="flex-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 py-1.5 rounded text-xs font-bold hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">Accept</button>
                                          <button onClick={() => handleGrade(sub.id, 'REJECTED')} className="flex-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 py-1.5 rounded text-xs font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">Reject</button>
                                       </>
                                    ) : (
                                       <div className={`w-full text-center py-1.5 rounded text-xs font-bold uppercase ${sub.status === 'APPROVED' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>{sub.status}</div>
                                    )}
                                 </div>
                              </div>
                           ))}
                     </div>
                  </>
               ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                     <i className="fa-solid fa-arrow-left text-3xl mb-3 opacity-50"></i>
                     <p>Select a task to view submissions</p>
                  </div>
               )}
            </div>
         </div>

         {/* CREATE MODAL */}
         {isCreateModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
               <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg p-6 animate-fade-in-up border border-slate-700">
                  <h3 className="text-lg font-bold text-white mb-6">New {activeTab === 'ASSIGNMENT' ? 'Assignment' : activeTab === 'LAB_EXAM' ? 'Lab Exam' : 'Project'}</h3>
                  <div className="space-y-4">

                     <div className="p-3 bg-blue-900/20 border border-blue-900/30 rounded-lg flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                           {subjectName.charAt(0)}
                        </div>
                        <div>
                           <p className="text-xs text-blue-400 uppercase font-bold">Assigning To</p>
                           <p className="text-sm font-bold text-white">{subjectName} ({activeSemester})</p>
                        </div>
                     </div>

                     <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Title</label>
                        <input
                           type="text"
                           value={newTask.title}
                           onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                           className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors placeholder-slate-500"
                           placeholder="Enter task title..."
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Description</label>
                        <textarea
                           value={newTask.description}
                           onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                           className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 h-24 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none placeholder-slate-500"
                           placeholder="Enter details..."
                        ></textarea>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Due Date</label>
                        <input
                           type="date"
                           value={newTask.dueDate}
                           onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                           className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                     </div>

                     <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Attachment</label>
                        <input
                           type="file"
                           onChange={e => setAttachmentFile(e.target.files ? e.target.files[0] : null)}
                           className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-blue-400 hover:file:bg-slate-600 transition-colors cursor-pointer"
                        />
                     </div>

                     {activeTab === 'LAB_EXAM' && (
                        <div className="p-3 bg-red-900/20 border border-red-900/30 rounded-lg">
                           <label className="block text-xs font-bold text-red-400 uppercase mb-1">Duration (Minutes)</label>
                           <input
                              type="number"
                              value={newTask.duration}
                              onChange={e => setNewTask({ ...newTask, duration: e.target.value })}
                              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500 transition-colors"
                              placeholder="e.g. 60"
                           />
                        </div>
                     )}

                     <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
                        <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white font-bold transition-colors">Cancel</button>
                        <button onClick={handleCreateTask} disabled={isSubmitting || !newTask.title} className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg shadow-blue-900/20">
                           {isSubmitting ? 'Saving...' : 'Create Task'}
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