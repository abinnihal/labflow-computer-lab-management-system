
import React, { useState, useEffect } from 'react';
import { User, Task, Submission } from '../../types';
import { getTasksForStudent, submitTask } from '../../services/taskService';
import { submitActivity } from '../../services/attendanceService';

interface Props {
  user: User;
}

const StudentTasksPage: React.FC<Props> = ({ user }) => {
  const [tasksWithStatus, setTasksWithStatus] = useState<{ task: Task, submission: Submission | null }[]>([]);
  const [selectedTask, setSelectedTask] = useState<{ task: Task, submission: Submission | null } | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'OVERDUE'>('ALL');

  // Submission Form State
  const [textResponse, setTextResponse] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'TEXT' | 'CODE' | 'FILE'>('TEXT');

  useEffect(() => {
    refreshTasks();
  }, [user.id]);

  const refreshTasks = () => {
    const data = getTasksForStudent(user.id);
    setTasksWithStatus(data);
  };

  const getStatus = (task: Task, sub: Submission | null) => {
    if (sub?.status === 'APPROVED') return 'COMPLETED';
    if (sub?.status === 'REJECTED') return 'REJECTED';
    if (sub?.status === 'SUBMITTED') return 'SUBMITTED';
    
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    // Reset time for date comparison
    today.setHours(0,0,0,0);
    dueDate.setHours(0,0,0,0);
    
    if (dueDate < today) return 'OVERDUE';
    return 'PENDING';
  };

  const filteredTasks = tasksWithStatus.filter(({ task, submission }) => {
    const status = getStatus(task, submission);
    if (filter === 'ALL') return true;
    if (filter === 'COMPLETED') return status === 'COMPLETED' || status === 'SUBMITTED';
    if (filter === 'OVERDUE') return status === 'OVERDUE';
    if (filter === 'PENDING') return status === 'PENDING' || status === 'REJECTED'; // Rejected needs action
    return true;
  });

  const handleSubmit = () => {
    if (!selectedTask) return;
    setIsSubmitting(true);
    
    // Simulate API delay
    setTimeout(() => {
      submitTask(user.id, user.name, selectedTask.task.id, {
        text: textResponse,
        code: codeSnippet,
        files: activeTab === 'FILE' ? ['assignment_v1.pdf'] : [] // Mock file
      });

      // Background Activity Routing
      submitActivity(user, 'task', { 
          taskId: selectedTask.task.id,
          taskTitle: selectedTask.task.title,
          submissionType: activeTab 
      });

      setIsSubmitting(false);
      setTextResponse('');
      setCodeSnippet('');
      refreshTasks();
      setSelectedTask(null); // Close modal or update view
    }, 1500);
  };

  const openTask = (item: { task: Task, submission: Submission | null }) => {
    setSelectedTask(item);
    // Pre-fill if resubmitting
    if (item.submission && item.submission.status === 'REJECTED') {
      setTextResponse(item.submission.textResponse || '');
      setCodeSnippet(item.submission.codeSnippet || '');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">My Assignments</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your tasks and track deadlines.</p>
        </div>
        <div className="flex gap-2 bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
           {['ALL', 'PENDING', 'OVERDUE', 'COMPLETED'].map((f) => (
             <button 
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filter === f ? 'bg-blue-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
             >
               {f}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task List */}
        <div className="space-y-4">
          {filteredTasks.map(({ task, submission }) => {
            const status = getStatus(task, submission);
            return (
              <div 
                key={task.id} 
                onClick={() => openTask({ task, submission })}
                className={`bg-white dark:bg-slate-800 rounded-xl border p-5 cursor-pointer transition-all hover:shadow-md ${selectedTask?.task.id === task.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-700'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${
                    status === 'COMPLETED' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-100 dark:border-green-800' :
                    status === 'SUBMITTED' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800' :
                    status === 'REJECTED' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800' :
                    status === 'OVERDUE' ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-100 dark:border-orange-800' :
                    'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                  }`}>
                    {status === 'COMPLETED' ? 'GRADED' : status}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{task.dueDate}</span>
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white mb-1">{task.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{task.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                    <i className="fa-solid fa-user-tie"></i> {task.assignedBy}
                  </div>
                  {submission && (
                    <div className="flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                      {submission.status === 'REJECTED' && <i className="fa-solid fa-circle-exclamation text-red-500"></i>}
                      {submission.status === 'APPROVED' && <i className="fa-solid fa-check-circle text-green-500"></i>}
                      {submission.status === 'SUBMITTED' && <i className="fa-regular fa-clock text-blue-500"></i>}
                      <span>
                        {submission.status === 'REJECTED' ? 'Action Required' : submission.status === 'APPROVED' ? 'Graded' : 'Under Review'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {filteredTasks.length === 0 && (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <i className="fa-solid fa-clipboard-check text-4xl mb-4 text-slate-200 dark:text-slate-700"></i>
              <p>No tasks found for this filter.</p>
            </div>
          )}
        </div>

        {/* Task Details / Workspace */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-fit sticky top-6">
          {selectedTask ? (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">{selectedTask.task.title}</h2>
                  {selectedTask.submission?.status === 'APPROVED' && (
                     <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                       <i className="fa-solid fa-check"></i> Complete
                     </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{selectedTask.task.description}</p>
                
                {selectedTask.submission?.feedback && (
                  <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/50 p-3 rounded-lg text-sm text-yellow-800 dark:text-yellow-400">
                    <p className="font-bold text-xs uppercase mb-1">Faculty Feedback:</p>
                    {selectedTask.submission.feedback}
                  </div>
                )}
              </div>

              <div className="p-6 space-y-6">
                {/* Details Section */}
                <div className="space-y-4">
                  {selectedTask.task.instructions && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Instructions</h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">{selectedTask.task.instructions}</p>
                    </div>
                  )}
                  {selectedTask.task.hints && selectedTask.task.hints.length > 0 && (
                     <div>
                       <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Hints</h4>
                       <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 space-y-1">
                         {selectedTask.task.hints.map((h, i) => <li key={i}>{h}</li>)}
                       </ul>
                     </div>
                  )}
                  {selectedTask.task.questions && selectedTask.task.questions.length > 0 && (
                     <div>
                       <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Questions to Answer</h4>
                       <div className="space-y-2">
                         {selectedTask.task.questions.map((q, i) => (
                           <div key={i} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                             <span className="font-bold text-slate-400">{i+1}.</span>
                             <p>{q}</p>
                           </div>
                         ))}
                       </div>
                     </div>
                  )}
                </div>

                {/* Submission Area */}
                {(!selectedTask.submission || selectedTask.submission.status === 'REJECTED' || selectedTask.submission.status === 'PENDING') && (
                  <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-3">Your Submission</h4>
                    
                    {/* Tabs */}
                    <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4">
                      <button onClick={() => setActiveTab('TEXT')} className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'TEXT' ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Text Answer</button>
                      <button onClick={() => setActiveTab('CODE')} className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'CODE' ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Code Snippet</button>
                      <button onClick={() => setActiveTab('FILE')} className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'FILE' ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Upload File</button>
                    </div>

                    {activeTab === 'TEXT' && (
                      <textarea 
                        value={textResponse}
                        onChange={(e) => setTextResponse(e.target.value)}
                        className="w-full h-32 p-3 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                        placeholder="Type your answer here..."
                      ></textarea>
                    )}

                    {activeTab === 'CODE' && (
                      <textarea 
                        value={codeSnippet}
                        onChange={(e) => setCodeSnippet(e.target.value)}
                        className="w-full h-32 p-3 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-mono bg-slate-900 text-green-400 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="// Paste your code here..."
                      ></textarea>
                    )}

                    {activeTab === 'FILE' && (
                      <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg h-32 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50">
                        <i className="fa-solid fa-cloud-arrow-up text-2xl text-slate-400 mb-2"></i>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Drag & drop or <span className="text-blue-600 dark:text-blue-400 font-medium cursor-pointer">browse</span></p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Supported: PDF, ZIP, TXT</p>
                      </div>
                    )}

                    <div className="mt-4 flex justify-end">
                      <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                        Submit Assignment
                      </button>
                    </div>
                  </div>
                )}

                {selectedTask.submission && selectedTask.submission.status !== 'REJECTED' && (
                  <div className="border-t border-slate-100 dark:border-slate-700 pt-6 text-center">
                    <div className="w-16 h-16 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">
                      <i className="fa-solid fa-check"></i>
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-white">Assignment Submitted</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Submitted on {new Date(selectedTask.submission.submittedAt).toLocaleDateString()}</p>
                    <button className="mt-4 text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">View Submission</button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-6">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 text-3xl mb-4">
                <i className="fa-solid fa-hand-pointer"></i>
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Select a Task</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-xs">Click on any assignment from the list to view details and submit your work.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentTasksPage;
