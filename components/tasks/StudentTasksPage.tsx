import React, { useState, useEffect } from 'react';
import { User, Task, Subject } from '../../types';
import { getStudentTaskHistory, submitTask } from '../../services/taskService';
import { uploadAssignment } from '../../services/storageService';
import { useTabMonitor } from '../../hooks/useTabMonitor';
import { getStudentSubjects } from '../../services/subjectService';

interface Props {
  user: User;
}

const StudentTasksPage: React.FC<Props> = ({ user }) => {
  const [taskHistory, setTaskHistory] = useState<{ task: Task, status: string, grade?: string }[]>([]);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'COMPLETED'>('PENDING');
  const [loading, setLoading] = useState(true);

  // --- SUBJECT FILTERING STATE ---
  const [enrolledSubjects, setEnrolledSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');

  // --- EXAM & SUBMISSION STATE ---
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- EXAM MODE STATE ---
  const [isExamActive, setIsExamActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gracePeriod, setGracePeriod] = useState(false);

  const tabSwitches = useTabMonitor(isExamActive);

  useEffect(() => {
    refreshTasks();
    fetchStudentSubjects();
    return () => {
      localStorage.setItem('isExamActive', 'false');
    };
  }, [user.id]);

  // --- FETCH SUBJECTS LOGIC ---
  const fetchStudentSubjects = async () => {
    try {
      const semester = user.semester || (user.managedSemesters ? user.managedSemesters[0] : '');

      if (semester) {
        const subs = await getStudentSubjects(semester);
        setEnrolledSubjects(subs);
      }
    } catch (e) {
      console.error("Subject fetch error:", e);
    }
  };

  const refreshTasks = async () => {
    setLoading(true);
    const data = await getStudentTaskHistory(user.id);
    setTaskHistory(data);
    setLoading(false);
  };

  // --- TIMER LOGIC ---
  useEffect(() => {
    if (!isExamActive || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isExamActive, timeLeft]);

  const handleStartExam = (task: Task) => {
    setSelectedTask(task);

    if (task.type === 'LAB_EXAM') {
      const duration = parseInt(task.duration || '60');
      setTimeLeft(duration * 60);
      setIsExamActive(true);
      setGracePeriod(false);
      localStorage.setItem('isExamActive', 'true');
      window.dispatchEvent(new Event("storage"));
    } else {
      setIsExamActive(false);
    }
  };

  const handleTimeUp = () => {
    setIsExamActive(false);
    setGracePeriod(true);
    localStorage.setItem('isExamActive', 'false');
    alert("🛑 Time is up! Inputs are now LOCKED.\nPlease click 'Submit' to save your work.");
    setTimeout(() => {
      if (selectedTask) {
        alert("Session fully closed.");
        setSelectedTask(null);
        setGracePeriod(false);
      }
    }, 2 * 60 * 1000);
  };

  const handleCloseModal = () => {
    if (isExamActive) {
      if (!window.confirm("Quit Exam? Progress will be lost.")) return;
      localStorage.setItem('isExamActive', 'false');
      setIsExamActive(false);
    }
    setSelectedTask(null);
    setSubmissionText('');
    setSubmissionFile(null);
  };

  const handleSubmit = async () => {
    if (!selectedTask) return;
    if (!submissionText.trim() && !submissionFile) {
      alert("Please enter text or upload a file.");
      return;
    }

    setIsSubmitting(true);

    try {
      let fileUrl = '';
      if (submissionFile) {
        const result = await uploadAssignment(submissionFile);
        fileUrl = result.url;
      }

      const finalText = (isExamActive || gracePeriod)
        ? `${submissionText}\n\n[SYSTEM LOG]: Student switched tabs ${tabSwitches} times.`
        : submissionText;

      await submitTask(user.id, user.name, selectedTask.id, {
        text: finalText,
        files: fileUrl ? [fileUrl] : []
      });

      localStorage.setItem('isExamActive', 'false');
      window.dispatchEvent(new Event("storage"));

      setSelectedTask(null);
      setSubmissionText('');
      setSubmissionFile(null);
      setIsExamActive(false);
      setGracePeriod(false);
      refreshTasks();
    } catch (error) {
      console.error(error);
      alert("Failed to submit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- FILTERING LOGIC ---
  const filteredTasks = taskHistory.filter(item => {
    const matchesTab = activeTab === 'PENDING'
      ? (item.status === 'PENDING' || item.status === 'OVERDUE')
      : (item.status === 'SUBMITTED' || item.status === 'APPROVED' || item.status === 'REJECTED');

    const matchesSubject = selectedSubjectId === 'ALL'
      ? true
      : item.task.subjectId === selectedSubjectId;

    return matchesTab && matchesSubject;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">My Assignments</h1>
          <p className="text-slate-500 dark:text-slate-400">Track pending work and grades.</p>
        </div>

        <div className="flex gap-4">
          {enrolledSubjects.length > 0 && (
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            >
              <option value="ALL">All Subjects</option>
              {enrolledSubjects.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          )}

          <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
            <button onClick={() => setActiveTab('PENDING')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'PENDING' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>To Do</button>
            <button onClick={() => setActiveTab('COMPLETED')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'COMPLETED' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Completed</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400"><i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.length === 0 ? (
            <div className="col-span-full p-12 text-center text-slate-400 border border-dashed rounded-xl">
              {selectedSubjectId !== 'ALL' ? `No ${activeTab.toLowerCase()} tasks for this subject.` : `No ${activeTab.toLowerCase()} tasks found.`}
            </div>
          ) : (
            filteredTasks.map(({ task, status, grade }) => (
              <div key={task.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col hover:border-blue-400 transition-colors">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${task.type === 'LAB_EXAM' ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-blue-100 text-blue-700'}`}>
                        {task.type === 'LAB_EXAM' ? 'LAB EXAM' : task.type.replace('_', ' ')}
                      </span>

                      {task.subjectName && (
                        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
                          {task.subjectName}
                        </span>
                      )}
                    </div>
                    {status === 'APPROVED' && <span className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">{grade}</span>}
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white mb-2">{task.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-3">{task.description}</p>

                  {/* --- FIX: CHECK FOR attachmentUrl INSTEAD OF fileUrl --- */}
                  {((task as any).attachments?.length > 0 || (task as any).attachmentUrl) && (
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-3 flex items-center gap-1">
                      <i className="fa-solid fa-paperclip"></i> Contains Attachment
                    </div>
                  )}

                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-700">
                  {status === 'PENDING' || status === 'OVERDUE' ? (
                    <button onClick={() => handleStartExam(task)} className={`w-full font-bold py-2 rounded-lg text-white shadow-sm transition-colors ${task.type === 'LAB_EXAM' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                      {task.type === 'LAB_EXAM' ? 'Start Exam Mode' : 'View & Submit Work'}
                    </button>
                  ) : (
                    <div className="w-full text-center py-2 rounded-lg font-bold text-sm uppercase bg-green-100 text-green-700">{status}</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* --- EXAM / SUBMISSION MODAL --- */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl p-6 flex flex-col h-[85vh] animate-fade-in-up ${isExamActive ? 'border-4 border-red-500' : ''}`}>

            <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  {selectedTask.title}
                  {isExamActive && <span className="bg-red-600 text-white text-xs px-2 py-1 rounded animate-pulse">LIVE EXAM</span>}
                  {gracePeriod && !isExamActive && <span className="bg-orange-600 text-white text-xs px-2 py-1 rounded"><i className="fa-solid fa-lock mr-1"></i>INPUTS LOCKED</span>}
                </h3>
              </div>
              {isExamActive ? (
                <div className="text-3xl font-mono font-bold text-red-600 bg-red-50 px-4 py-2 rounded-lg border border-red-100">
                  {formatTime(timeLeft)}
                </div>
              ) : (
                <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark text-2xl"></i></button>
              )}
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
              <div className="md:w-1/3 overflow-y-auto pr-2 border-r border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 uppercase font-bold mb-2">Instructions</p>
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap mb-6">{selectedTask.description}</p>

                {/* --- FIX: CHECK FOR attachmentUrl INSTEAD OF fileUrl --- */}
                {((selectedTask as any).attachments?.length > 0 || (selectedTask as any).attachmentUrl) && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
                    <p className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase mb-2">Teacher Resources</p>
                    <div className="space-y-2">
                      {/* Handle Array of attachments */}
                      {(selectedTask as any).attachments?.map((url: string, index: number) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm bg-white dark:bg-slate-800 px-3 py-2 rounded border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-colors"
                        >
                          <i className="fa-solid fa-download text-blue-500"></i>
                          <span className="truncate">Attachment {index + 1}</span>
                        </a>
                      ))}
                      {/* Handle Single String (attachmentUrl) */}
                      {(selectedTask as any).attachmentUrl && !(selectedTask as any).attachments && (
                        <a
                          href={(selectedTask as any).attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm bg-white dark:bg-slate-800 px-3 py-2 rounded border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-colors"
                        >
                          <i className="fa-solid fa-download text-blue-500"></i>
                          <span className="truncate">View Assignment File</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
                {/* ------------------------------------------- */}

              </div>

              <div className="md:w-2/3 flex flex-col">
                <textarea
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  disabled={selectedTask.type === 'LAB_EXAM' && !isExamActive}
                  className={`flex-1 w-full border rounded-lg p-4 text-sm font-mono focus:ring-2 outline-none resize-none ${selectedTask.type === 'LAB_EXAM' && !isExamActive
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 focus:ring-blue-500'
                    }`}
                  placeholder={isExamActive ? "// Time is running... Type code here..." : (selectedTask.type === 'LAB_EXAM' ? "// Time Up. Input Locked." : "// Paste solution...")}
                ></textarea>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <input
                      type="file"
                      onChange={(e) => setSubmissionFile(e.target.files ? e.target.files[0] : null)}
                      disabled={selectedTask.type === 'LAB_EXAM' && !isExamActive}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || (selectedTask.type === 'LAB_EXAM' && !isExamActive && !gracePeriod)}
                    className="px-8 py-3 rounded-lg font-bold text-white shadow-md flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    {isSubmitting ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
                    Submit Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTasksPage;