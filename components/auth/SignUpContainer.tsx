
import React, { useState } from 'react';
import StudentSignUp from './StudentSignUp';
import FacultySignUp from './FacultySignUp';
import ThemeToggle from '../ui/ThemeToggle';
import Logo from '../ui/Logo';
import { Link } from 'react-router-dom';

interface SignUpContainerProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const SignUpContainer: React.FC<SignUpContainerProps> = ({ isDarkMode, toggleTheme }) => {
  const [role, setRole] = useState<'STUDENT' | 'FACULTY'>('STUDENT');

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300 relative">
      {/* Back Button */}
      <Link to="/" className="absolute top-6 left-6 z-50 flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">
        <i className="fa-solid fa-arrow-left"></i> Back to Home
      </Link>

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
         <ThemeToggle isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <Logo className="w-16 h-16" textClassName="text-3xl" />
        </div>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-slate-900 dark:text-white">Create your account</h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Join Labflow as {role === 'STUDENT' ? 'a Student' : 'Faculty'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-slate-100 dark:border-slate-700">
          
          {/* Role Toggle */}
          <div className="flex rounded-md bg-slate-100 dark:bg-slate-700 p-1 mb-6">
            <button 
              onClick={() => setRole('STUDENT')} 
              className={`flex-1 text-sm font-medium py-2 rounded transition-all ${role === 'STUDENT' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              Student
            </button>
            <button 
              onClick={() => setRole('FACULTY')} 
              className={`flex-1 text-sm font-medium py-2 rounded transition-all ${role === 'FACULTY' ? 'bg-white dark:bg-slate-600 shadow text-purple-600 dark:text-purple-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              Faculty
            </button>
          </div>

          {/* Render Form Content */}
          {role === 'STUDENT' ? (
            <StudentSignUp isDarkMode={isDarkMode} toggleTheme={toggleTheme} embedded={true} />
          ) : (
            <FacultySignUp isDarkMode={isDarkMode} toggleTheme={toggleTheme} embedded={true} />
          )}

        </div>
      </div>
    </div>
  );
};

export default SignUpContainer;
