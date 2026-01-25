import React, { useState, useEffect } from 'react';
import { User, Task } from '../../types';
import { getStudentTaskHistory, submitTask } from '../../services/taskService';

interface Props {
  user: User;
}

const StudentTasksPage: React.FC<Props> = ({ user }) => {
  const [taskHistory, setTaskHistory] = useState<{ task: Task, status: string, grade?: string }[]>([]);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'COMPLETED'>('PENDING');
  const [loading, setLoading] = useState(true);

  // Submission Modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    refreshTasks();
  }, [user.id]);

  const refreshTasks = async () => {
    setLoading(true);
    const data = await getStudentTaskHistory(user.id);
    setTaskHistory(data);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!selectedTask || !submissionText.trim()) return;
    setIsSubmitting(true);

    try {
      await submitTask(user.id, user.name, selectedTask.id, { text: submissionText });
      setSelectedTask(null);
      setSubmissionText('');
      refreshTasks();
    } catch (error) {
      alert("Failed to submit task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTasks = taskHistory.filter(item => {
    if (activeTab === 'PENDING') return item.status === 'PENDING' || item.status === 'OVERDUE';
    return item.status === 'SUBMITTED' || item.status === 'APPROVED' || item.status === 'REJECTED';
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">My Assignments</h1>
          <p className="text-slate-500 dark:text-slate-400">Track pending work and grades.</p>
        </div>

        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'PENDING' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            To Do
          </button>
          <button
            onClick={() => setActiveTab('COMPLETED')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'COMPLETED' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            Completed
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 dark:text-slate-500">
          <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Loading assignments...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.length === 0 ? (
            <div className="col-span-full p-12 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
              {activeTab === 'PENDING' ? 'No pending assignments! You are all caught up.' : 'No completed assignments yet.'}
            </div>
          ) : (
            filteredTasks.map(({ task, status, grade }) => (
              <div key={task.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${task.type === 'LAB_EXAM' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}`}>
                      {task.type.replace('_', ' ')}
                    </span>
                    {status === 'APPROVED' && <span className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 flex items-center justify-center font-bold">{grade}</span>}
                  </div>

                  <h3 className="font-bold text-slate-800 dark:text-white mb-2">{task.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-3">{task.description}</p>

                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500 font-mono">
                    <i className="fa-regular fa-clock"></i> Due: {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-700">
                  {status === 'PENDING' ? (
                    <button
                      onClick={() => setSelectedTask(task)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg shadow-sm transition-colors"
                    >
                      Submit Work
                    </button>
                  ) : (
                    <div className={`w-full text-center py-2 rounded-lg font-bold text-sm uppercase ${status === 'APPROVED' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                      status === 'REJECTED' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                        'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                      }`}>
                      {status}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Submission Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg p-6 animate-fade-in-up">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Submit: {selectedTask.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Paste your solution, code, or GitHub link below.</p>

            <textarea
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              className="w-full h-40 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white font-mono"
              placeholder="// Write your code here..."
            ></textarea>

            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setSelectedTask(null)} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-bold">Cancel</button>
              <button onClick={handleSubmit} disabled={isSubmitting || !submissionText.trim()} className="px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 disabled:opacity-50">
                {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTasksPage;