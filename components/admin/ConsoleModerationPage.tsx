
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { toggleUserBan, isUserBanned, getBannedWords, addBannedWord, removeBannedWord } from '../../services/communityService';
import { getAllUsers } from '../../services/userService';

interface Props {
  user: User;
}

const ConsoleModerationPage: React.FC<Props> = ({ user }) => {
  // Moderation State
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState('');
  const [students, setStudents] = useState<User[]>([]);
  const [bannedUserIds, setBannedUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    refreshModerationData();
  }, []);

  const refreshModerationData = () => {
    setBannedWords(getBannedWords());
    
    // Fetch actual students from service
    const allUsers = getAllUsers();
    const studentUsers = allUsers.filter(u => u.role === UserRole.STUDENT);
    setStudents(studentUsers);

    // Sync local banned state with service
    const banned = new Set<string>();
    studentUsers.forEach(s => {
       if (isUserBanned(s.id)) banned.add(s.id);
    });
    setBannedUserIds(banned);
  };

  const handleBanToggle = (userId: string) => {
     toggleUserBan(userId);
     refreshModerationData();
  };

  const handleAddWord = () => {
     if (newWord.trim()) {
        addBannedWord(newWord.trim());
        setNewWord('');
        refreshModerationData();
     }
  };

  const handleRemoveWord = (word: string) => {
     removeBannedWord(word);
     refreshModerationData();
  };

  return (
    <div className="space-y-6">
       <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Console Moderation</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage community chat permissions and content filters.</p>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Moderation */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
               <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <h3 className="font-bold text-slate-800 dark:text-white">Student Chat Permissions</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Ban users from posting or commenting in the Learner's Console.</p>
               </div>
               <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {students.map(student => (
                     <div key={student.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                              {student.name.charAt(0)}
                           </div>
                           <div>
                              <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{student.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{student.email}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                           {bannedUserIds.has(student.id) ? (
                              <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded font-bold uppercase">Banned</span>
                           ) : (
                              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded font-bold uppercase">Active</span>
                           )}
                           <button 
                             onClick={() => handleBanToggle(student.id)}
                             className={`ml-2 px-3 py-1 rounded text-xs font-bold transition-colors ${bannedUserIds.has(student.id) ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'}`}
                           >
                             {bannedUserIds.has(student.id) ? 'UNBAN' : 'BAN / KICK'}
                           </button>
                        </div>
                     </div>
                  ))}
                  {students.length === 0 && (
                      <div className="p-8 text-center text-slate-400 dark:text-slate-500 italic">
                          No students available to moderate.
                      </div>
                  )}
               </div>
            </div>

            {/* Word Filter */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
               <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <h3 className="font-bold text-slate-800 dark:text-white">Profanity Filter</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Manage banned words. Content containing these will be auto-blocked.</p>
               </div>
               <div className="p-5">
                  <div className="flex gap-2 mb-4">
                     <input 
                       type="text" 
                       value={newWord}
                       onChange={(e) => setNewWord(e.target.value)}
                       placeholder="Add word to ban..." 
                       className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                     />
                     <button 
                       onClick={handleAddWord}
                       disabled={!newWord.trim()}
                       className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
                     >
                       Add
                     </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                     {bannedWords.map(word => (
                        <div key={word} className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-sm flex items-center gap-2 border border-slate-200 dark:border-slate-600">
                           {word}
                           <button onClick={() => handleRemoveWord(word)} className="text-slate-400 hover:text-red-500 dark:hover:text-red-400">
                              <i className="fa-solid fa-xmark text-xs"></i>
                           </button>
                        </div>
                     ))}
                     {bannedWords.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500 italic">No banned words configured.</p>}
                  </div>
               </div>
            </div>
         </div>
    </div>
  );
};

export default ConsoleModerationPage;
