
import React, { useState, useEffect } from 'react';
import { User, Feedback, MaintenanceRequest } from '../../types';
import { getStudentFeedbacks, getMaintenanceRequests, createMaintenanceRequest } from '../../services/maintenanceService';
import { getLabs } from '../../services/bookingService';

interface Props {
  user: User;
}

const FacultyFeedbackPage: React.FC<Props> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'FEEDBACK' | 'MAINTENANCE'>('FEEDBACK');
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  
  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    labId: '',
    issueTitle: '',
    description: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const labs = getLabs();

  useEffect(() => {
    refreshData();
    if (labs.length > 0) {
      setNewRequest(prev => ({ ...prev, labId: labs[0].id }));
    }
  }, [user.id]);

  const refreshData = () => {
    // Only show faculty targeted feedback
    setFeedbacks(getStudentFeedbacks('FACULTY'));
    setMaintenanceRequests(getMaintenanceRequests(user.id));
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      createMaintenanceRequest({
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
      setNewRequest({ labId: labs[0]?.id || '', issueTitle: '', description: '', priority: 'MEDIUM' });
      refreshData();
      setTimeout(() => setSuccessMsg(''), 3000);
    }, 1000);
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'HIGH': return 'bg-red-100 text-red-700';
      case 'MEDIUM': return 'bg-orange-100 text-orange-700';
      case 'LOW': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'RESOLVED': return 'bg-green-100 text-green-700';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
      case 'PENDING': return 'bg-slate-100 text-slate-600';
      default: return 'bg-slate-100';
    }
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
                     <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${fb.category === 'LAB_ISSUE' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
                        {fb.category.replace('_', ' ')}
                     </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-sm mt-2 ml-13 pl-13">{fb.content}</p>
                  
                  <div className="flex items-center gap-4 mt-3 pl-13 text-xs text-slate-500 dark:text-slate-400">
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
                             onChange={(e) => setNewRequest({...newRequest, labId: e.target.value})}
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
                             onChange={(e) => setNewRequest({...newRequest, issueTitle: e.target.value})}
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
                                  onChange={() => setNewRequest({...newRequest, priority: p as any})}
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
                          onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
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
                             <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getStatusColor(req.status)}`}>{req.status.replace('_', ' ')}</span>
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
    </div>
  );
};

export default FacultyFeedbackPage;