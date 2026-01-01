
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserRole } from '../../types';
import { registerWithEmail } from '../../services/auth';
import { createUserProfile } from '../../services/users';
import TerminalLoader from '../ui/TerminalLoader';
import ThemeToggle from '../ui/ThemeToggle';
import Logo from '../ui/Logo';

interface RegisterProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Register: React.FC<RegisterProps> = ({ isDarkMode, toggleTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState<'STUDENT' | 'FACULTY'>('STUDENT');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false); // Success message state

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Student specific
    studentId: '',
    course: 'BCA',
    semester: '1st',
    // Faculty specific
    facultyId: '',
    department: '',
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get('role');
    if (roleParam === 'FACULTY') {
      setRole('FACULTY');
    } else if (roleParam === 'STUDENT') {
      setRole('STUDENT');
    }
  }, [location]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    setError('');

    // Validation
    if (!formData.fullName || !formData.email || !formData.password || !formData.phone) {
      setError('Please fill in all required fields.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (role === 'STUDENT' && (!formData.studentId || !formData.course)) {
      setError('Please provide Student ID and Course details.');
      return;
    }
    if (role === 'FACULTY' && (!formData.facultyId || !formData.department)) {
      setError('Please provide Faculty ID and Department details.');
      return;
    }

    setIsLoading(true);

    const handleSubmit = async () => {
      setError('');

      // Validation (KEEP AS IS)
      if (!formData.fullName || !formData.email || !formData.password || !formData.phone) {
        setError('Please fill in all required fields.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (role === 'STUDENT' && (!formData.studentId || !formData.course)) {
        setError('Please provide Student ID and Course details.');
        return;
      }
      if (role === 'FACULTY' && (!formData.facultyId || !formData.department)) {
        setError('Please provide Faculty ID and Department details.');
        return;
      }

      setIsLoading(true);

      try {
        // 1️⃣ Create Firebase Auth user
        const fbUser = await registerWithEmail(formData.email, formData.password);

        // 2️⃣ Create Firestore profile (PENDING by default)
        const firestoreRole =
          role === 'STUDENT' ? 'student' : 'faculty';

        await createUserProfile(
          fbUser.uid,
          firestoreRole,
          formData.fullName
        );


        setIsSuccess(true);
      } catch (err: any) {
        setError(err.message || 'Registration failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300 relative">
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-6 animate-fade-in-up">
          <TerminalLoader />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Creating your account...</p>
        </div>
      ) : isSuccess ? (
        <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up">
          <div className="bg-white dark:bg-slate-800 py-8 px-6 shadow-xl sm:rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
              <i className="fa-solid fa-check"></i>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Registration Request Sent</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Your {role === 'STUDENT' ? 'student' : 'faculty'} account has been created and is currently <b>pending approval</b> from the {role === 'STUDENT' ? 'Faculty' : 'Administrator'}. You will be notified via email once your account is active.
            </p>
            <Link
              to="/login"
              className="block w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-colors shadow-md"
            >
              Back to Login
            </Link>
          </div>
        </div>
      ) : (
        <>
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

              <div className="flex rounded-md bg-slate-100 dark:bg-slate-700 p-1 mb-6">
                <button onClick={() => setRole('STUDENT')} className={`flex-1 text-sm font-medium py-2 rounded transition-all ${role === 'STUDENT' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Student</button>
                <button onClick={() => setRole('FACULTY')} className={`flex-1 text-sm font-medium py-2 rounded transition-all ${role === 'FACULTY' ? 'bg-white dark:bg-slate-600 shadow text-purple-600 dark:text-purple-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Faculty</button>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm border border-red-200 dark:border-red-800 flex items-center gap-2">
                  <i className="fa-solid fa-circle-exclamation"></i> {error}
                </div>
              )}

              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Full Name</label>
                    <input name="fullName" value={formData.fullName} onChange={handleChange} type="text" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Phone</label>
                    <input name="phone" value={formData.phone} onChange={handleChange} type="text" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="+1 234..." />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Email Address</label>
                  <input name="email" value={formData.email} onChange={handleChange} type="email" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="you@college.edu" />
                </div>

                {role === 'STUDENT' ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Student ID</label>
                      <input name="studentId" value={formData.studentId} onChange={handleChange} type="text" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg" placeholder="CS2023..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Course</label>
                        <select name="course" value={formData.course} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg bg-white">
                          <option value="BCA">BCA</option>
                          <option value="MCA">MCA</option>
                          <option value="BSC">BSC</option>
                          <option value="MSC">MSC</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Semester</label>
                        <select name="semester" value={formData.semester} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg bg-white">
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <option key={i} value={`${i}th`}>{i}{i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th'} Semester</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Faculty ID</label>
                      <input name="facultyId" value={formData.facultyId} onChange={handleChange} type="text" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg" placeholder="FAC..." />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Department</label>
                      <input name="department" value={formData.department} onChange={handleChange} type="text" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg" placeholder="Computer Science" />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Password</label>
                    <input name="password" value={formData.password} onChange={handleChange} type="password" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Confirm</label>
                    <input name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} type="password" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg" placeholder="••••••••" />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-2">Upload ID Proof</label>
                  <input type="file" className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50" />
                </div>

                <div className="flex items-center pt-2">
                  <input type="checkbox" className="h-4 w-4 text-blue-600 rounded border-slate-300 dark:border-slate-600" defaultChecked />
                  <label className="ml-2 text-sm text-slate-600 dark:text-slate-400">I confirm the details provided are correct.</label>
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
                  className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors mt-4 ${role === 'STUDENT' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                >
                  Submit Registration
                </button>
              </form>

              <div className="mt-6 text-center text-sm">
                <Link to="/login" className={`font-medium ${role === 'STUDENT' ? 'text-blue-600 hover:text-blue-500 dark:text-blue-400' : 'text-purple-600 hover:text-purple-500 dark:text-purple-400'}`}>Already have an account? Sign In</Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Register;
