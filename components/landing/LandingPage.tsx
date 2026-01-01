
import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';
import ThemeToggle from '../ui/ThemeToggle';

interface LandingPageProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ isDarkMode, toggleTheme }) => {
  const techStack = ['React', 'TypeScript', 'Tailwind', 'Gemini AI', 'Recharts', 'Vite', 'Node.js', 'Firebase'];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-300 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Logo className="w-10 h-10" textClassName="text-2xl" />
            <div className="flex items-center gap-6">
              <ThemeToggle isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
              <div className="hidden md:flex items-center gap-4">
                <Link to="/signup" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">Sign Up</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
           <span className="inline-block py-1 px-3 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-bold mb-6 border border-blue-100 dark:border-blue-800 animate-fade-in-up">
              🚀 Next Gen Lab Management
           </span>
           <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight mb-8 leading-tight animate-fade-in-up delay-100">
              Manage Labs with <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Intelligent Insights</span>
           </h1>
           <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up delay-200">
              Streamline attendance, scheduling, and inventory tracking with our AI-powered platform designed for modern educational institutions.
           </p>
           
           <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
              <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-xl">
                 Login
              </Link>
           </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-slate-50 dark:bg-slate-800/50 transition-colors">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {[
                 { icon: 'fa-calendar-check', title: 'Smart Scheduling', desc: 'Conflict-free booking system with automated conflict resolution and recurring slots.' },
                 { icon: 'fa-robot', title: 'AI Assistant', desc: 'Integrated Gemini AI to help students and faculty with queries and technical support.' },
                 { icon: 'fa-chart-pie', title: 'Real-time Analytics', desc: 'Track utilization, attendance trends, and performance metrics instantly.' }
               ].map((feature, idx) => (
                 <div key={idx} className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
                    <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center text-2xl mb-6">
                       <i className={`fa-solid ${feature.icon}`}></i>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* Technology Stack Marquee */}
      <div className="py-20 overflow-hidden bg-white dark:bg-[#020617] relative z-20 border-y border-gray-200 dark:border-white/5 transition-colors duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-white dark:from-[#020617] via-transparent to-white dark:to-[#020617] z-10 pointer-events-none"></div>
          
          <div className="text-center mb-8 relative z-20">
              <span className="text-sm font-mono text-blue-600 dark:text-[#0ea5e9] uppercase tracking-widest border border-blue-200 dark:border-[#0ea5e9]/20 px-3 py-1 rounded-full bg-white dark:bg-slate-900/50">
                  Technology Stack
              </span>
          </div>

          <div className="whitespace-nowrap animate-marquee flex items-center gap-16 relative z-0">
              {[...techStack, ...techStack, ...techStack, ...techStack].map((item, i) => (
                  <span key={i} className="text-3xl md:text-5xl font-bold text-gray-300 dark:text-slate-700 hover:text-blue-600 dark:hover:text-[#0ea5e9] transition-colors leading-none uppercase tracking-tighter cursor-default select-none">
                      {item}
                  </span>
              ))}
          </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pt-16 pb-8">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
               <div className="mb-8 md:mb-0">
                  <Logo className="w-8 h-8" textClassName="text-xl" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">© 2024 Labflow. All rights reserved.</p>
               </div>
               <div className="flex flex-col md:flex-row items-center gap-6">
                  <a href="#" className="text-sm font-medium text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">Contact Us</a>
                  <div className="flex gap-6">
                    <a href="#" className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-xl"><i className="fa-brands fa-github"></i></a>
                    <a href="#" className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-xl"><i className="fa-brands fa-twitter"></i></a>
                    <a href="#" className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-xl"><i className="fa-brands fa-linkedin"></i></a>
                  </div>
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default LandingPage;
