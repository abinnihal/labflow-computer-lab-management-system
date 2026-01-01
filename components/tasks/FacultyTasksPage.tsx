
import React, { useState, useEffect } from 'react';
import { User, Task, Submission } from '../../types';
import { getTasksByFaculty, createTask, getTaskStats, getSubmissionsForTask, updateSubmissionStatus, getStudentTaskHistory } from '../../services/taskService';
import { MOCK_ROSTER } from '../../constants';

interface Props {
  user: User;
}

const FacultyTasksPage: React.FC<Props> = ({ user }) => {
  const [activeView, setActiveView] = useState<'MANAGE' | 'CREATE' | 'REVIEW'>('MANAGE');
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [selectedTaskForReview, setSelectedTaskForReview] = useState<Task | null>(null);
  const [submissionsForReview, setSubmissionsForReview] = useState<Submission[]>([]);
  
  // Review View States
  const [reviewTab, setReviewTab] = useState<'GRADING' | 'STATUS'>('GRADING');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OVERDUE' | 'PENDING' | 'SUBMITTED' | 'REJECTED'>('ALL');

  // Student History Modal State
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentHistory, setStudentHistory] = useState<any[]>([]);

  // Create Form State
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    course: 'BCA',
    semester: '1st',
    instructions: '',
    hints: '',
    questions: ''
  });

  useEffect(() => {
    refreshTasks();
  }, [user.id]);

  const refreshTasks = () => {
    setMyTasks(getTasksByFaculty(user.id));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    createTask({
      title: newTask.title,
      description: newTask.description,
      assignedBy: user.name,
      assignedById: user.id,
      course: `${newTask.course} - ${newTask.semester} Sem`,
      dueDate: newTask.dueDate,
      instructions: newTask.instructions,
      hints: newTask.hints ? newTask.hints.split('\n').filter(h => h.trim()) : [],
      questions: newTask.questions ? newTask.questions.split('\n').filter(q => q.trim()) : [],
      attachments: []
    });
    setNewTask({ title: '', description: '', dueDate: '', course: 'BCA', semester: '1st', instructions: '', hints: '', questions: '' });
    setActiveView('MANAGE');
    refreshTasks();
  };

  const openReview = (task: Task) => {
    setSelectedTaskForReview(task);
    setSubmissionsForReview(getSubmissionsForTask(task.id));
    setActiveView('REVIEW');
    setReviewTab('GRADING'); // Default tab
  };

  const handleGrade = (subId: string, status: 'APPROVED' | 'REJECTED') => {
    updateSubmissionStatus(subId, status, status === 'REJECTED' ? 'Please review the instructions and resubmit.' : 'Good job!');
    if (selectedTaskForReview) {
       setSubmissionsForReview(getSubmissionsForTask(selectedTaskForReview.id));
    }
  };

  const openStudentHistory = (studentId: string) => {
    setSelectedStudentId(studentId);
    setStudentHistory(getStudentTaskHistory(studentId));
  };

  const closeStudentHistory = () => {
    setSelectedStudentId(null);
    setStudentHistory([]);
  };

  // --- Views ---

  const renderCreateView = () => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 max-w-4xl mx-auto animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100 dark:border-slate-700">
        <button onClick={() => setActiveView('MANAGE')} className="text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Create New Assignment</h2>
      </div>
      
      <form onSubmit={handleCreateTask} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-1">
             <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Task Title</label>
             <input required type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., Python Basics" />
           </div>
           <div className="space-y-1">
             <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Due Date</label>
             <input required type="date" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-blue-500 focus:border-blue-500" />
           </div>
        </div>

        <div className="space-y-1">
           <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Description</label>
           <textarea required value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg h-24 dark:bg-slate-700 dark:text-white focus:ring-blue-500 focus:border-blue-500" placeholder="Brief overview of the task..."></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="space-y-1">
             <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Course</label>
             <select value={newTask.course} onChange={e => setNewTask({...newTask, course: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white">
               <option value="BCA">BCA</option>
               <option value="MCA">MCA</option>
               <option value="BSC">BSC</option>
               <option value="MSC">MSC</option>
             </select>
           </div>
           <div className="space-y-1">
             <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Semester</label>
             <select value={newTask.semester} onChange={e => setNewTask({...newTask, semester: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white">
               {[1,2,3,4,5,6,7,8].map(i => (
                 <option key={i} value={`${i}${i===1?'st':i===2?'nd':i===3?'rd':'th'}`}>{i}{i===1?'st':i===2?'nd':i===3?'rd':'th'} Sem</option>
               ))}
             </select>
           </div>
           <div className="space-y-1">
             <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Attachments</label>
             <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 flex items-center justify-between bg-slate-50 dark:bg-slate-700/50">
               <span className="text-sm text-slate-500 dark:text-slate-400">Upload PDF/Docs</span>
               <button type="button" className="text-xs bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-500 dark:text-white">Browse</button>
             </div>
           </div>
        </div>

        <div className="space-y-1">
           <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Detailed Instructions (Optional)</label>
           <textarea value={newTask.instructions} onChange={e => setNewTask({...newTask, instructions: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg h-24 dark:bg-slate-700 dark:text-white" placeholder="Step-by-step guide..."></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-1">
             <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Questions (One per line)</label>
             <textarea value={newTask.questions} onChange={e => setNewTask({...newTask, questions: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg h-32 dark:bg-slate-700 dark:text-white" placeholder="1. What is X?&#10;2. How does Y work?"></textarea>
           </div>
           <div className="space-y-1">
             <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Hints (One per line)</label>
             <textarea value={newTask.hints} onChange={e => setNewTask({...newTask, hints: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg h-32 dark:bg-slate-700 dark:text-white" placeholder="Hint 1...&#10;Hint 2..."></textarea>
           </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
           <button type="button" onClick={() => setActiveView('MANAGE')} className="px-6 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700">Cancel</button>
           <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm">Publish Task</button>
        </div>
      </form>
    </div>
  );

  const renderReviewView = () => {
    if (!selectedTaskForReview) return null;

    // Calculate statuses for Class Status View
    const getStudentStatusForTask = (studentId: string) => {
        const sub = submissionsForReview.find(s => s.studentId === studentId);
        if (sub) return { status: sub.status, submittedAt: sub.submittedAt };
        
        const dueDate = new Date(selectedTaskForReview?.dueDate || '');
        const now = new Date();
        dueDate.setHours(0,0,0,0);
        now.setHours(0,0,0,0);
        
        if (now > dueDate) return { status: 'OVERDUE' };
        return { status: 'PENDING' };
    };

    const filteredRoster = MOCK_ROSTER.filter(student => {
       if (statusFilter === 'ALL') return true;
       const { status } = getStudentStatusForTask(student.id);
       if (statusFilter === 'SUBMITTED') return status === 'SUBMITTED' || status === 'APPROVED';
       return status === statusFilter;
    });

    return (
      <div className="space-y-6 animate-fade-in-down">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveView('MANAGE')} className="text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
              <i className="fa-solid fa-arrow-left"></i>
            </button>
            <div>
               <h2 className="text-xl font-bold text-slate-800 dark:text-white">Review: {selectedTaskForReview?.title}</h2>
               <p className="text-sm text-slate-500 dark:text-slate-400">Due: {selectedTaskForReview?.dueDate}</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex">
             <button 
               onClick={() => setReviewTab('GRADING')}
               className={`px-4 py-2 text-sm font-bold rounded transition-colors ${reviewTab === 'GRADING' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
             >
               Grading Queue ({submissionsForReview.length})
             </button>
             <button 
               onClick={() => setReviewTab('STATUS')}
               className={`px-4 py-2 text-sm font-bold rounded transition-colors ${reviewTab === 'STATUS' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
             >
               Class Status
             </button>
          </div>
        </div>

        {reviewTab === 'GRADING' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {/* Student List */}
             <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 text-sm">Submissions</div>
                <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[600px] overflow-y-auto">
                   {submissionsForReview.map(sub => (
                     <div key={sub.id} className="p-4 hover:bg-blue-50 dark:hover:bg-slate-700/50 cursor-pointer group transition-colors">
                        <div className="flex justify-between items-start">
                           <div>
                              <p className="font-medium text-slate-800 dark:text-white text-sm">{sub.studentName}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">ID: {sub.studentId}</p>
                           </div>
                           {sub.status === 'APPROVED' ? <i className="fa-solid fa-check text-green-500"></i> : 
                            sub.status === 'REJECTED' ? <i className="fa-solid fa-xmark text-red-500"></i> :
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>}
                        </div>
                     </div>
                   ))}
                   {submissionsForReview.length === 0 && <p className="p-4 text-center text-slate-400 dark:text-slate-500 italic text-sm">No submissions pending review.</p>}
                </div>
             </div>

             {/* Content Review Area */}
             <div className="md:col-span-2 space-y-4">
                {submissionsForReview.length > 0 ? (
                   submissionsForReview.map(sub => (
                     <div key={sub.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                        <div className="flex justify-between items-start mb-4">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold text-sm">
                                {sub.studentName.charAt(0)}
                              </div>
                              <div>
                                <h3 className="font-bold text-slate-800 dark:text-white text-sm hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer" onClick={() => openStudentHistory(sub.studentId)}>
                                  {sub.studentName} <i className="fa-solid fa-arrow-up-right-from-square text-[10px] ml-1 opacity-50"></i>
                                </h3>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">Submitted: {new Date(sub.submittedAt).toLocaleString()}</p>
                              </div>
                           </div>
                           <div className="flex gap-2">
                              <button onClick={() => handleGrade(sub.id, 'REJECTED')} className="px-3 py-1 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">REJECT</button>
                              <button onClick={() => handleGrade(sub.id, 'APPROVED')} className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 shadow-sm transition-colors">APPROVE</button>
                           </div>
                        </div>

                        <div className="space-y-4">
                           {sub.textResponse && (
                             <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Text Response</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{sub.textResponse}</p>
                             </div>
                           )}
                           {sub.codeSnippet && (
                             <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 overflow-x-auto">
                                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Code Snippet</p>
                                <pre className="text-sm text-green-400 font-mono">{sub.codeSnippet}</pre>
                             </div>
                           )}
                           {sub.files && sub.files.length > 0 && (
                              <div className="flex gap-2">
                                 {sub.files.map((f, i) => (
                                   <div key={i} className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm border border-blue-100 dark:border-blue-800">
                                      <i className="fa-regular fa-file-pdf"></i> {f}
                                   </div>
                                 ))}
                              </div>
                           )}
                        </div>
                     </div>
                   ))
                ) : (
                   <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 min-h-[300px]">
                      <i className="fa-solid fa-inbox text-4xl mb-2 opacity-50"></i>
                      <p className="text-sm">Select a submission to review.</p>
                   </div>
                )}
             </div>
          </div>
        )}

        {reviewTab === 'STATUS' && (
           <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Filter Bar */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-2">
                 {['ALL', 'SUBMITTED', 'PENDING', 'REJECTED', 'OVERDUE'].map(status => (
                    <button 
                      key={status}
                      onClick={() => setStatusFilter(status as any)}
                      className={`px-3 py-1.5 rounded text-xs font-bold border transition-colors ${statusFilter === status ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-600 dark:border-slate-600' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400'}`}
                    >
                       {status.charAt(0) + status.slice(1).toLowerCase()}
                    </button>
                 ))}
              </div>

              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-100 dark:bg-slate-700/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                       <tr>
                          <th className="px-6 py-3">Student Name</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Submitted At</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                       {filteredRoster.map(student => {
                          const { status, submittedAt } = getStudentStatusForTask(student.id);
                          return (
                             <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-200">
                                   {student.name}
                                   <div className="text-[10px] text-slate-400">{student.email}</div>
                                </td>
                                <td className="px-6 py-3">
                                   <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                      status === 'APPROVED' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                      status === 'SUBMITTED' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                      status === 'REJECTED' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                      status === 'OVERDUE' ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 animate-pulse' :
                                      'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                   }`}>
                                      {status === 'APPROVED' ? 'Graded' : status}
                                   </span>
                                </td>
                                <td className="px-6 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">
                                   {submittedAt ? new Date(submittedAt).toLocaleDateString() : '-'}
                                </td>
                                <td className="px-6 py-3 text-right">
                                   <button 
                                     onClick={() => openStudentHistory(student.id)}
                                     className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs font-medium hover:underline"
                                   >
                                      View History
                                   </button>
                                </td>
                             </tr>
                          );
                       })}
                       {filteredRoster.length === 0 && (
                          <tr>
                             <td colSpan={4} className="p-8 text-center text-slate-400 dark:text-slate-500 italic">No students found matching this filter.</td>
                          </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 relative">
      {/* Header & Tabs */}
      {activeView === 'MANAGE' && (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Tasks & Assignments</h1>
            <p className="text-slate-500 dark:text-slate-400">Manage course work and grade student submissions.</p>
          </div>
          <button 
            onClick={() => setActiveView('CREATE')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm flex items-center gap-2 transition-transform active:scale-95"
          >
             <i className="fa-solid fa-plus"></i> Create New Task
          </button>
        </div>
      )}

      {/* Main Content */}
      {activeView === 'CREATE' && renderCreateView()}
      {activeView === 'REVIEW' && renderReviewView()}
      
      {activeView === 'MANAGE' && (
         <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in-up">
            {myTasks.map(task => {
               const stats = getTaskStats(task.id);
               return (
                 <div key={task.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                       <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold px-2 py-1 rounded uppercase">{task.course}</span>
                       <div className="text-right">
                          <p className="text-xs text-slate-400 font-semibold uppercase">Due Date</p>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{task.dueDate}</p>
                       </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{task.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">{task.description}</p>
                    
                    <div className="grid grid-cols-3 gap-2 mb-6">
                       <div className="text-center p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <p className="text-xl font-bold text-slate-700 dark:text-slate-200">{stats.submitted}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Submitted</p>
                       </div>
                       <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.approved}</p>
                          <p className="text-[10px] text-green-600/70 dark:text-green-400/70 uppercase font-bold">Graded</p>
                       </div>
                       <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                          <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{stats.pending}</p>
                          <p className="text-[10px] text-orange-600/70 dark:text-orange-400/70 uppercase font-bold">Pending</p>
                       </div>
                    </div>

                    <button 
                      onClick={() => openReview(task)}
                      className="w-full py-2 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 rounded-lg font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center gap-2"
                    >
                       <i className="fa-solid fa-list-check"></i> Review Submissions
                    </button>
                 </div>
               );
            })}
            {myTasks.length === 0 && (
               <div className="col-span-full text-center py-12 text-slate-400 dark:text-slate-500">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                     <i className="fa-solid fa-clipboard-question"></i>
                  </div>
                  <p className="text-lg">No tasks created yet.</p>
                  <button onClick={() => setActiveView('CREATE')} className="mt-2 text-blue-600 dark:text-blue-400 font-bold hover:underline">Create your first task</button>
               </div>
            )}
         </div>
      )}

      {/* Student History Modal */}
      {selectedStudentId && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
               <div className="bg-slate-900 px-5 py-4 flex justify-between items-center text-white shrink-0">
                  <div>
                     <h3 className="font-bold text-lg">Student Performance Profile</h3>
                     <p className="text-sm text-slate-400">
                        {MOCK_ROSTER.find(s => s.id === selectedStudentId)?.name || 'Student Details'}
                     </p>
                  </div>
                  <button onClick={closeStudentHistory} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                     <i className="fa-solid fa-xmark"></i>
                  </button>
               </div>
               <div className="p-0 overflow-y-auto flex-1">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700 sticky top-0">
                        <tr>
                           <th className="px-6 py-3">Assignment</th>
                           <th className="px-6 py-3">Due Date</th>
                           <th className="px-6 py-3">Status</th>
                           <th className="px-6 py-3">Grade</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                        {studentHistory.map((item, idx) => (
                           <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                              <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">
                                 {item.task.title}
                                 <div className="text-[10px] text-slate-400">{item.task.course}</div>
                              </td>
                              <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{item.task.dueDate}</td>
                              <td className="px-6 py-4">
                                 <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                    item.status === 'APPROVED' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                    item.status === 'SUBMITTED' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                    item.status === 'OVERDUE' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                    item.status === 'REJECTED' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800' :
                                    'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                 }`}>
                                    {item.status}
                                 </span>
                              </td>
                              <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">{item.grade || '-'}</td>
                           </tr>
                        ))}
                        {studentHistory.length === 0 && (
                           <tr><td colSpan={4} className="p-6 text-center text-slate-400 dark:text-slate-500">No tasks assigned to this student yet.</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>
               <div className="p-4 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-700 text-right shrink-0">
                  <button onClick={closeStudentHistory} className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-white dark:hover:bg-slate-700">Close</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default FacultyTasksPage;
