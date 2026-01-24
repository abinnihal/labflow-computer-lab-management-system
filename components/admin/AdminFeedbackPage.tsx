import React, { useState, useEffect } from 'react';
import { User, Feedback, MaintenanceRequest } from '../../types';
import {
   getStudentFeedbacks,
   getMaintenanceRequests,
   replyToFeedback,
   resolveFeedback,
   archiveFeedback,
   replyToMaintenance,
   resolveMaintenance,
   archiveMaintenance
} from '../../services/maintenanceService';

interface Props {
   user: User;
}

const AdminFeedbackPage: React.FC<Props> = ({ user }) => {
   const [activeTab, setActiveTab] = useState<'FEEDBACK' | 'MAINTENANCE'>('FEEDBACK');
   const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
   const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
   const [showArchived, setShowArchived] = useState(false);
   const [loading, setLoading] = useState(true);

   // Reply Modal State
   const [replyTarget, setReplyTarget] = useState<{ id: string, type: 'FEEDBACK' | 'MAINTENANCE', title: string } | null>(null);
   const [replyText, setReplyText] = useState('');

   useEffect(() => {
      refreshData();
   }, []);

   // FIX: Async Data Fetching
   const refreshData = async () => {
      try {
         const [fbData, reqData] = await Promise.all([
            getStudentFeedbacks('ADMIN'),
            getMaintenanceRequests()
         ]);
         setFeedbacks(fbData);
         setRequests(reqData);
      } catch (error) {
         console.error("Failed to load feedback data", error);
      } finally {
         setLoading(false);
      }
   };

   // FIX: Async Reply Handler
   const handleReplySubmit = async () => {
      if (!replyTarget || !replyText.trim()) return;

      try {
         if (replyTarget.type === 'FEEDBACK') {
            await replyToFeedback(replyTarget.id, replyText, user.id);
         } else {
            await replyToMaintenance(replyTarget.id, replyText, user.id);
         }
         setReplyTarget(null);
         setReplyText('');
         refreshData();
      } catch (error) {
         alert("Failed to send reply");
      }
   };

   // FIX: Async Resolve Handler
   const handleResolve = async (id: string, type: 'FEEDBACK' | 'MAINTENANCE') => {
      if (window.confirm("Mark this item as resolved? The submitter will be notified.")) {
         try {
            if (type === 'FEEDBACK') await resolveFeedback(id, user.id);
            else await resolveMaintenance(id, user.id);
            refreshData();
         } catch (error) {
            console.error(error);
         }
      }
   };

   // FIX: Async Archive Handler
   const handleArchive = async (id: string, type: 'FEEDBACK' | 'MAINTENANCE') => {
      if (window.confirm("Archive this ticket? It will be hidden from the main view.")) {
         try {
            if (type === 'FEEDBACK') await archiveFeedback(id);
            else await archiveMaintenance(id);
            refreshData();
         } catch (error) {
            console.error(error);
         }
      }
   };

   const filteredFeedbacks = feedbacks.filter(f => showArchived ? f.isArchived : !f.isArchived);
   const filteredRequests = requests.filter(r => showArchived ? r.isArchived : !r.isArchived);

   return (
      <div className="space-y-6">
         <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
               <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Complaints & Feedback</h1>
               <p className="text-slate-500 dark:text-slate-400">Review, resolve, and reply to issues reported by users.</p>
            </div>
            <div className="flex items-center gap-3">
               <div className="flex items-center gap-2 mr-2">
                  <input
                     type="checkbox"
                     id="showArchived"
                     checked={showArchived}
                     onChange={(e) => setShowArchived(e.target.checked)}
                     className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600"
                  />
                  <label htmlFor="showArchived" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer">Show Archived</label>
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
                     Faculty Maintenance
                  </button>
               </div>
            </div>
         </div>

         {loading ? (
            <div className="text-center py-20 text-slate-500 dark:text-slate-400">
               <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Loading feedback data...
            </div>
         ) : (
            <>
               {activeTab === 'FEEDBACK' && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                     <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredFeedbacks.map(fb => (
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
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${fb.status === 'RESOLVED' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'}`}>
                                       {fb.status || 'PENDING'}
                                    </span>
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${fb.category === 'LAB_ISSUE' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                                       {fb.category.replace('_', ' ')}
                                    </span>
                                 </div>
                              </div>

                              <div className="ml-13 pl-13 space-y-3">
                                 <p className="text-slate-700 dark:text-slate-300 text-sm">{fb.content}</p>

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
                                    <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700 p-3 rounded-lg text-sm text-slate-600 dark:text-slate-400">
                                       <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Your Reply</p>
                                       {fb.adminReply}
                                    </div>
                                 )}

                                 <div className="flex gap-2 pt-2">
                                    {!fb.adminReply && (
                                       <button onClick={() => setReplyTarget({ id: fb.id, type: 'FEEDBACK', title: `Feedback from ${fb.studentName}` })} className="px-3 py-1.5 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 rounded text-xs font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                          Reply
                                       </button>
                                    )}
                                    {fb.status !== 'RESOLVED' && (
                                       <button onClick={() => handleResolve(fb.id, 'FEEDBACK')} className="px-3 py-1.5 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 rounded text-xs font-bold hover:bg-green-50 dark:hover:bg-green-900/20">
                                          Mark Resolved
                                       </button>
                                    )}
                                    {!fb.isArchived && (
                                       <button onClick={() => handleArchive(fb.id, 'FEEDBACK')} className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800">
                                          Archive
                                       </button>
                                    )}
                                 </div>
                              </div>
                           </div>
                        ))}
                        {filteredFeedbacks.length === 0 && <div className="p-8 text-center text-slate-400 dark:text-slate-500">No feedback found.</div>}
                     </div>
                  </div>
               )}

               {activeTab === 'MAINTENANCE' && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                     <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredRequests.map(req => (
                           <div key={req.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <div className="flex justify-between items-start mb-2">
                                 <div>
                                    <h4 className="font-bold text-slate-800 dark:text-white">{req.issueTitle}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{req.labName} • Reported by {req.facultyName}</p>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${req.status === 'RESOLVED' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : req.status === 'IN_PROGRESS' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'}`}>
                                       {req.status.replace('_', ' ')}
                                    </span>
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${req.priority === 'HIGH' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                                       {req.priority}
                                    </span>
                                 </div>
                              </div>

                              <div className="space-y-3">
                                 <p className="text-slate-700 dark:text-slate-300 text-sm">{req.description}</p>

                                 {req.adminReply && (
                                    <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700 p-3 rounded-lg text-sm text-slate-600 dark:text-slate-400">
                                       <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Your Reply</p>
                                       {req.adminReply}
                                    </div>
                                 )}

                                 <div className="flex gap-2 pt-2">
                                    {!req.adminReply && (
                                       <button onClick={() => setReplyTarget({ id: req.id, type: 'MAINTENANCE', title: req.issueTitle })} className="px-3 py-1.5 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 rounded text-xs font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                          Reply / Update
                                       </button>
                                    )}
                                    {req.status !== 'RESOLVED' && (
                                       <button onClick={() => handleResolve(req.id, 'MAINTENANCE')} className="px-3 py-1.5 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 rounded text-xs font-bold hover:bg-green-50 dark:hover:bg-green-900/20">
                                          Mark Resolved
                                       </button>
                                    )}
                                    {!req.isArchived && (
                                       <button onClick={() => handleArchive(req.id, 'MAINTENANCE')} className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800">
                                          Archive
                                       </button>
                                    )}
                                 </div>
                              </div>
                           </div>
                        ))}
                        {filteredRequests.length === 0 && <div className="p-8 text-center text-slate-400 dark:text-slate-500">No maintenance requests found.</div>}
                     </div>
                  </div>
               )}
            </>
         )}

         {/* Reply Modal */}
         {replyTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
               <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg p-6 animate-fade-in-up">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Reply to: {replyTarget.title}</h3>
                  <textarea
                     value={replyText}
                     onChange={(e) => setReplyText(e.target.value)}
                     placeholder="Type your response or status update here..."
                     className="w-full h-32 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4 bg-white dark:bg-slate-700 dark:text-white"
                  ></textarea>
                  <div className="flex justify-end gap-3">
                     <button onClick={() => setReplyTarget(null)} className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium">Cancel</button>
                     <button onClick={handleReplySubmit} disabled={!replyText.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold disabled:opacity-50">Send Reply</button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default AdminFeedbackPage;