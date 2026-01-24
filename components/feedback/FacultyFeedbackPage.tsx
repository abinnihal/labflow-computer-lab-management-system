import React, { useState, useEffect } from 'react';
import { User, Feedback, MaintenanceRequest, Lab } from '../../types';
import {
   getStudentFeedbacks,
   getMaintenanceRequests,
   createMaintenanceRequest,
   replyToFeedback,
   resolveFeedback
} from '../../services/maintenanceService';
import { getAllLabs } from '../../services/labService';

interface Props {
   user: User;
}

const FacultyFeedbackPage: React.FC<Props> = ({ user }) => {
   const [activeTab, setActiveTab] = useState<'FEEDBACK' | 'MAINTENANCE'>('FEEDBACK');
   const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
   const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);

   // Maintenance Form State
   const [isFormOpen, setIsFormOpen] = useState(false);
   const [newRequest, setNewRequest] = useState({
      labId: '',
      issueTitle: '',
      description: '',
      priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH'
   });
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [successMsg, setSuccessMsg] = useState('');

   // Reply Modal State
   const [replyTarget, setReplyTarget] = useState<Feedback | null>(null);
   const [replyText, setReplyText] = useState('');

   // Labs Data
   const [labs, setLabs] = useState<Lab[]>([]);

   useEffect(() => {
      const fetchLabs = async () => {
         try {
            const data = await getAllLabs();
            setLabs(data);
            if (data.length > 0) {
               setNewRequest(prev => ({ ...prev, labId: data[0].id }));
            }
         } catch (error) {
            console.error("Failed to load labs", error);
         }
      };
      fetchLabs();
   }, []);

   useEffect(() => {
      refreshData();
   }, [user.id]);

   const refreshData = async () => {
      const fbData = await getStudentFeedbacks('FACULTY');
      setFeedbacks(fbData);

      const reqData = await getMaintenanceRequests(user.id);
      setMaintenanceRequests(reqData);
   };

   const handleSendReply = async () => {
      if (!replyTarget || !replyText.trim()) return;

      try {
         await replyToFeedback(replyTarget.id, replyText, user.id);
         setSuccessMsg('Reply sent to student!');
         setReplyTarget(null);
         setReplyText('');
         refreshData();
         setTimeout(() => setSuccessMsg(''), 3000);
      } catch (error) {
         alert("Failed to send reply");
      }
   };

   const handleAcknowledge = async (id: string) => {
      try {
         await resolveFeedback(id, user.id);
         refreshData();
         setSuccessMsg('Feedback marked as acknowledged.');
         setTimeout(() => setSuccessMsg(''), 3000);
      } catch (error) {
         console.error(error);
      }
   };

   const handleSubmitRequest = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
         await createMaintenanceRequest({
            facultyId: user.id,
            facultyName: user.name,
            labId: newRequest.labId,
            issueTitle: newRequest.issueTitle,
            description: newRequest.description,
            priority: newRequest.priority
         });

         setIsSubmitting(false);
         setIsFormOpen(false);
         setSuccessMsg('Maintenance request submitted successfully!');
         setNewRequest(prev => ({ ...prev, issueTitle: '', description: '', priority: 'MEDIUM' }));
         refreshData();
         setTimeout(() => setSuccessMsg(''), 3000);
      } catch (error: any) {
         alert("Error: " + error.message);
         setIsSubmitting(false);
      }
   };

   const getPriorityColor = (p: string) => {
      switch (p) {
         case 'HIGH': return 'bg-red-100 text-red-700';
         case 'MEDIUM': return 'bg-orange-100 text-orange-700';
         case 'LOW': return 'bg-blue-100 text-blue-700';
         default: return 'bg-slate-100 text-slate-700';
      }
   };

   // --- NEW: Smart Status Label Logic ---
   const getDisplayStatus = (status: string, category: string) => {
      if (status === 'PENDING') {
         if (category === 'LAB_ISSUE') return 'Open Ticket';
         return 'Received';
      }
      if (status === 'RESOLVED') {
         if (category === 'LAB_ISSUE') return 'Fixed';
         if (category === 'TEACHING') return 'Acknowledged';
         return 'Noted'; // General
      }
      return status;
   };

   const getStatusColor = (status: string, category: string) => {
      if (status === 'RESOLVED') return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';

      // Different colors for pending states
      if (category === 'LAB_ISSUE') return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'; // Urgent look
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'; // Normal look
   };

   return (
      <div className="space-y-6">
         <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
               <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Feedback & Maintenance</h1>
               <p className="text-slate-500 dark:text-slate-400">Review student feedback and manage lab issues.</p>
            </div>
            <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
               <button
                  onClick={() => setActiveTab('FEEDBACK')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'FEEDBACK' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
               >
                  Student Feedback
               </button>
               <button
                  onClick={() => setActiveTab('MAINTENANCE')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'MAINTENANCE' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
               >
                  Maintenance Requests
               </button>
            </div>
         </div>

         {successMsg && (
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in-down">
               <i className="fa-solid fa-circle-check"></i> {successMsg}
            </div>
         )}

         {activeTab === 'FEEDBACK' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
               <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <h3 className="font-bold text-slate-800 dark:text-white">Recent Student Feedbacks (To Faculty)</h3>
               </div>
               <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {feedbacks.map(fb => (
                     <div key={fb.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center font-bold text-sm">
                                 {fb.studentName.charAt(0)}
                              </div>
                              <div>
                                 <p className="font-bold text-slate-800 dark:text-white text-sm">{fb.studentName}</p>
                                 <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(fb.date).toLocaleDateString()}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-2">
                              {/* NEW: Smart Status Label */}
                              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getStatusColor(fb.status || 'PENDING', fb.category)}`}>
                                 {getDisplayStatus(fb.status || 'PENDING', fb.category)}
                              </span>
                              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${fb.category === 'LAB_ISSUE' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                                 {fb.category.replace('_', ' ')}
                              </span>
                           </div>
                        </div>

                        <div className="ml-13 pl-13 space-y-3">
                           <p className="text-slate-700 dark:text-slate-300 text-sm bg-slate-50 dark:bg-slate-900/30 p-3 rounded border border-slate-100 dark:border-slate-800">{fb.content}</p>

                           <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                              {fb.rating && (
                                 <div className="flex text-yellow-400 gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                       <i key={i} className={`fa-solid fa-star ${i < fb.rating! ? '' : 'text-slate-200 dark:text-slate-600'}`}></i>
                                    ))}
                                 </div>
                              )}
                              {fb.labId && (
                                 <span><i className="fa-solid fa-location-dot mr-1"></i> Lab ID: {fb.labId}</span>
                              )}
                           </div>

                           {fb.adminReply && (
                              <div className="border-l-2 border-green-500 pl-3 mt-2">
                                 <p className="text-xs font-bold text-green-600 uppercase">You Replied:</p>
                                 <p className="text-sm text-slate-600 dark:text-slate-400">{fb.adminReply}</p>
                              </div>
                           )}

                           {fb.status !== 'RESOLVED' && (
                              <div className="flex gap-2 pt-2">
                                 <button
                                    onClick={() => setReplyTarget(fb)}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-colors flex items-center gap-1"
                                 >
                                    <i className="fa-solid fa-reply"></i> Reply
                                 </button>
                                 <button
                                    onClick={() => handleAcknowledge(fb.id)}
                                    className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-xs font-bold transition-colors"
                                 >
                                    <i className="fa-solid fa-check"></i>
                                    {fb.category === 'LAB_ISSUE' ? 'Mark Fixed' : 'Acknowledge'}
                                 </button>
                              </div>
                           )}
                        </div>
                     </div>
                  ))}
                  {feedbacks.length === 0 && (
                     <div className="p-8 text-center text-slate-400 dark:text-slate-500">No feedback available.</div>
                  )}
               </div>
            </div>
         )}

         {activeTab === 'MAINTENANCE' && (
            <div className="space-y-6">
               {/* Action Bar */}
               {!isFormOpen && (
                  <div className="flex justify-end">
                     <button
                        onClick={() => setIsFormOpen(true)}
                        className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md flex items-center gap-2 transition-transform active:scale-95"
                     >
                        <i className="fa-solid fa-screwdriver-wrench"></i> Report Maintenance Issue
                     </button>
                  </div>
               )}

               {/* Request Form */}
               {isFormOpen && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 animate-fade-in-up">
                     <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">New Maintenance Request</h3>
                        <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                           <i className="fa-solid fa-xmark text-xl"></i>
                        </button>
                     </div>
                     <form onSubmit={handleSubmitRequest} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Affected Lab</label>
                              <select
                                 required
                                 value={newRequest.labId}
                                 onChange={(e) => setNewRequest({ ...newRequest, labId: e.target.value })}
                                 className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                              >
                                 {labs.map(lab => (
                                    <option key={lab.id} value={lab.id}>{lab.name}</option>
                                 ))}
                              </select>
                           </div>
                           <div>
                              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Issue Title</label>
                              <input
                                 required
                                 type="text"
                                 value={newRequest.issueTitle}
                                 onChange={(e) => setNewRequest({ ...newRequest, issueTitle: e.target.value })}
                                 placeholder="e.g. Broken Monitor, Software Crash"
                                 className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                              />
                           </div>
                        </div>

                        <div>
                           <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Priority Level</label>
                           <div className="flex gap-4">
                              {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                                 <label key={p} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                       type="radio"
                                       name="priority"
                                       checked={newRequest.priority === p}
                                       onChange={() => setNewRequest({ ...newRequest, priority: p as any })}
                                       className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className={`text-sm font-medium px-2 py-0.5 rounded ${getPriorityColor(p)}`}>{p}</span>
                                 </label>
                              ))}
                           </div>
                        </div>

                        <div>
                           <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                           <textarea
                              required
                              value={newRequest.description}
                              onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                              placeholder="Describe the issue in detail..."
                              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 h-32 focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                           ></textarea>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                           <button type="button" onClick={() => setIsFormOpen(false)} className="px-5 py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">Cancel</button>
                           <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-sm disabled:opacity-70 flex items-center gap-2">
                              {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                              Submit Request
                           </button>
                        </div>
                     </form>
                  </div>
               )}

               {/* Request History */}
               <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                     <h3 className="font-bold text-slate-800 dark:text-white">Your Maintenance History</h3>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-700">
                     {maintenanceRequests.map(req => (
                        <div key={req.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                           <div className="flex justify-between items-start mb-2">
                              <div>
                                 <h4 className="font-bold text-slate-800 dark:text-white text-base">{req.issueTitle}</h4>
                                 <p className="text-xs text-slate-500 dark:text-slate-400">{req.labName} • {new Date(req.date).toLocaleDateString()}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                 <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                    {req.status.replace('_', ' ')}
                                 </span>
                                 <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getPriorityColor(req.priority)}`}>{req.priority}</span>
                              </div>
                           </div>
                           <p className="text-slate-600 dark:text-slate-300 text-sm mt-2 bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg border border-slate-100 dark:border-slate-800">{req.description}</p>
                        </div>
                     ))}
                     {maintenanceRequests.length === 0 && (
                        <div className="p-8 text-center text-slate-400 dark:text-slate-500">No maintenance requests found.</div>
                     )}
                  </div>
               </div>
            </div>
         )}

         {/* Reply Modal */}
         {replyTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
               <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg p-6 animate-fade-in-up">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Reply to {replyTarget.studentName}</h3>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg mb-4 text-sm italic text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700">
                     "{replyTarget.content}"
                  </div>
                  <textarea
                     value={replyText}
                     onChange={(e) => setReplyText(e.target.value)}
                     placeholder="Type your reply here..."
                     className="w-full h-32 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4 bg-white dark:bg-slate-700 dark:text-white"
                  ></textarea>
                  <div className="flex justify-end gap-3">
                     <button onClick={() => setReplyTarget(null)} className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium">Cancel</button>
                     <button onClick={handleSendReply} disabled={!replyText.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold disabled:opacity-50">Send Reply</button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default FacultyFeedbackPage;