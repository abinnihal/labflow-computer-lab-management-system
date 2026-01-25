import React, { useEffect, useState } from 'react';
import { User, UserRole, Lab } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getAttendanceLogs } from '../../services/attendanceService';
import { getAllLabs } from '../../services/labService';
import { getPendingFeedbackCount } from '../../services/maintenanceService';
import ApprovalList from '../approvals/ApprovalList';
import { getPendingUsersByRole } from '../../services/userService';

interface Props {
   user: User;
}

const AdminDashboard: React.FC<Props> = ({ user }) => {
   const [activeStudents, setActiveStudents] = useState(0);
   const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'APPROVALS'>('OVERVIEW');
   const [pendingCount, setPendingCount] = useState(0);

   // Real-time Data
   const [activeLabsCount, setActiveLabsCount] = useState(0);
   const [feedbackCount, setFeedbackCount] = useState(0);
   const [labUsageData, setLabUsageData] = useState<{ name: string, usage: number, capacity: number }[]>([]);
   const [totalLabs, setTotalLabs] = useState(0);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      // WRAPPER FOR ASYNC CALLS
      const fetchData = async () => {
         setLoading(true);
         try {
            // 1. Fetch Logs (ASYNC FIX)
            const logs = await getAttendanceLogs();
            setActiveStudents(logs.filter(l => l.status === 'PRESENT').length);

            // 2. Fetch Pending Faculty (ASYNC FIX)
            const pendingFaculty = await getPendingUsersByRole(UserRole.FACULTY);
            setPendingCount(pendingFaculty.length);

            // 3. Fetch Labs & Calculate Usage (ASYNC FIX)
            const labs = await getAllLabs();
            setTotalLabs(labs.length);

            const usage = labs.map(lab => {
               const activeCount = logs.filter(l => l.labId === lab.id && l.status === 'PRESENT').length;
               return {
                  name: lab.name.split(' - ')[0],
                  usage: Math.round((activeCount / lab.capacity) * 100),
                  capacity: lab.capacity,
                  activeCount: activeCount
               };
            });
            setLabUsageData(usage);

            // 4. Count Active Labs
            setActiveLabsCount(usage.filter(u => u.activeCount > 0).length);

            // 5. Fetch Pending Feedback (Assuming sync or handle async if service updated)
            // If getPendingFeedbackCount is async now, add await. If not, this is fine.
            try {
               const fbCount = await getPendingFeedbackCount(); // Added await just in case
               setFeedbackCount(fbCount);
            } catch {
               setFeedbackCount(0);
            }

         } catch (e) {
            console.error("Dashboard Error:", e);
         } finally {
            setLoading(false);
         }
      };

      fetchData();

   }, [activeTab]);

   return (
      <div className="space-y-6">
         <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
               <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Administrator Dashboard</h1>
               <p className="text-slate-500 dark:text-slate-400">System management and analytics overview.</p>
            </div>

            <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
               <button
                  onClick={() => setActiveTab('OVERVIEW')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'OVERVIEW' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
               >
                  Overview
               </button>
               <button
                  onClick={() => setActiveTab('APPROVALS')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'APPROVALS' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
               >
                  Approvals
                  {pendingCount > 0 && (
                     <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'APPROVALS' ? 'bg-white text-blue-600' : 'bg-red-500 text-white'}`}>
                        {pendingCount}
                     </span>
                  )}
               </button>
            </div>
         </div>

         {activeTab === 'APPROVALS' ? (
            <ApprovalList targetRole={UserRole.FACULTY} />
         ) : (
            <>
               {loading ? (
                  <div className="p-10 text-center text-slate-500"><i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Loading Dashboard...</div>
               ) : (
                  <>
                     {/* Key Metrics */}
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                           <div className="flex justify-between">
                              <div>
                                 <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Active Students</p>
                                 <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{activeStudents}</h3>
                                 <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Currently Checked In</p>
                              </div>
                              <div className="text-blue-500 dark:text-blue-400 text-sm font-semibold flex items-center bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded h-fit">
                                 Live
                              </div>
                           </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                           <div className="flex justify-between">
                              <div>
                                 <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Active Labs</p>
                                 <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{activeLabsCount}/{totalLabs}</h3>
                              </div>
                              <div className={`${activeLabsCount > 0 ? 'text-green-500 bg-green-50 dark:bg-green-900/20' : 'text-orange-500 bg-orange-50 dark:bg-orange-900/20'} text-sm font-semibold flex items-center px-2 py-1 rounded h-fit`}>
                                 {activeLabsCount > 0 ? 'Busy' : 'Idle'}
                              </div>
                           </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                           <div className="flex justify-between">
                              <div>
                                 <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Peak Hour</p>
                                 <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">-</h3>
                              </div>
                           </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                           <div className="flex justify-between">
                              <div>
                                 <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Feedback Pending</p>
                                 <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{feedbackCount}</h3>
                              </div>
                              <div className={`${feedbackCount > 0 ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'text-green-500 bg-green-50 dark:bg-green-900/20'} text-sm font-semibold flex items-center px-2 py-1 rounded h-fit`}>
                                 {feedbackCount > 0 ? 'Action Needed' : 'Clean'}
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                           <h3 className="font-bold text-slate-800 dark:text-white mb-6">Lab Utilization (%)</h3>
                           <div className="h-72">
                              <ResponsiveContainer width="100%" height="100%">
                                 <BarChart data={labUsageData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#94a3b8" opacity={0.2} />
                                    <XAxis type="number" domain={[0, 100]} hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 500 }} width={80} />
                                    <Tooltip
                                       cursor={{ fill: 'transparent' }}
                                       contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#fff', color: '#1e293b' }}
                                    />
                                    <Bar dataKey="usage" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
                                 </BarChart>
                              </ResponsiveContainer>
                           </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                           <h3 className="font-bold text-slate-800 dark:text-white mb-4">Recent System Logs</h3>
                           <div className="space-y-4">
                              <div className="p-8 text-center text-slate-400 dark:text-slate-500 italic text-sm">
                                 System initialized. Logs will appear here.
                              </div>
                           </div>
                        </div>
                     </div>
                  </>
               )}
            </>
         )}
      </div>
   );
};

export default AdminDashboard;