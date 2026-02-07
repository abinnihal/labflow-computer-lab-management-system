import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserRole } from '../../types';
import { registerUser } from '../../services/auth';
import TerminalLoader from '../ui/TerminalLoader';
import ThemeToggle from '../ui/ThemeToggle';
import Logo from '../ui/Logo';

interface StudentSignUpProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  embedded?: boolean;
}

const StudentSignUp: React.FC<StudentSignUpProps> = ({ isDarkMode, toggleTheme, embedded = false }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);

  // Password Visibility State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentId: '',
    programType: 'UG' as 'UG' | 'PG',
    course: '',
    semester: 'S1',
  });

  // Password Strength State
  const [pwdCriteria, setPwdCriteria] = useState({
    length: false,
    lower: false,
    upper: false,
    number: false,
    special: false
  });

  // --- Dynamic Options Logic ---
  const PROGRAM_TYPES = [
    { value: 'UG', label: 'Undergraduate (UG)' },
    { value: 'PG', label: 'Postgraduate (PG)' }
  ];

  const COURSES_BY_PROGRAM: Record<string, string[]> = {
    UG: ['BCA', 'B.Sc Computer Science', 'B.Tech CSE'],
    PG: ['MCA', 'M.Sc Computer Science', 'M.Tech CSE']
  };

  const getAvailableSemesters = (course: string) => {
    // 2 Years = 4 Sems
    if (['MCA', 'M.Sc Computer Science', 'M.Tech CSE'].includes(course)) return [1, 2, 3, 4];
    // 3 Years = 6 Sems
    if (['BCA', 'B.Sc Computer Science'].includes(course)) return [1, 2, 3, 4, 5, 6, 7, 8].slice(0, 6);
    // 4 Years = 8 Sems (Default for B.Tech)
    return [1, 2, 3, 4, 5, 6, 7, 8];
  };

  // Set defaults when Program changes
  useEffect(() => {
    const defaultCourse = COURSES_BY_PROGRAM[formData.programType][0];
    setFormData(prev => ({
      ...prev,
      course: defaultCourse,
      semester: 'S1'
    }));
  }, [formData.programType]);

  const validatePassword = (pwd: string) => {
    const criteria = {
      length: pwd.length >= 8,
      lower: /[a-z]/.test(pwd),
      upper: /[A-Z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    };
    setPwdCriteria(criteria);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'password') validatePassword(value);
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, file: 'File size must be less than 5MB' }));
        setFile(null);
      } else if (!['image/jpeg', 'image/png', 'application/pdf'].includes(selectedFile.type)) {
        setErrors(prev => ({ ...prev, file: 'Only Images (JPG/PNG) or PDF allowed' }));
        setFile(null);
      } else {
        setFile(selectedFile);
        setErrors(prev => ({ ...prev, file: '' }));
      }
    } else {
      setFile(null);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[0-9]{10,15}$/;

    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    else if (!phoneRegex.test(formData.phone)) newErrors.phone = 'Invalid phone number';

    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!emailRegex.test(formData.email)) newErrors.email = 'Invalid email format';

    if (!formData.studentId.trim()) newErrors.studentId = 'Student ID is required';
    if (!formData.programType) newErrors.programType = 'Program is required';
    if (!formData.course) newErrors.course = 'Course is required';
    if (!formData.semester) newErrors.semester = 'Semester is required';

    if (!formData.password) newErrors.password = 'Password is required';
    else if (!Object.values(pwdCriteria).every(Boolean)) newErrors.password = 'Password does not meet criteria';

    if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirm Password is required';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const idProofUrl = file ? URL.createObjectURL(file) : undefined;

      // --- FIX: Dynamic Department based on Course ---
      // Instead of hardcoding 'Computer Science', we use the Course Name.
      // This ensures BCA students are saved as 'BCA' in the DB.
      const department = formData.course;

      console.log("Registering User with:", {
        course: formData.course,
        department: department,
        semester: formData.semester
      });

      await registerUser({
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        studentId: formData.studentId,
        programType: formData.programType,
        course: formData.course, // Ensure this is saved
        role: UserRole.STUDENT,
        semester: formData.semester,
        department: department, // Saved as Course Name (e.g. 'BCA')
      }, formData.password);

      setIsSuccess(true);
    } catch (err: any) {
      console.error(err);
      setErrors(prev => ({ ...prev, form: err.message || 'Registration failed. Please try again.' }));
    } finally {
      setIsLoading(false);
    }
  };

  // Password Strength Calculations
  const criteriaMetCount = Object.values(pwdCriteria).filter(Boolean).length;
  const strengthColor = criteriaMetCount <= 2 ? 'bg-red-500' : criteriaMetCount <= 4 ? 'bg-yellow-500' : 'bg-green-500';
  const strengthWidth = `${Math.min(100, (criteriaMetCount / 5) * 100)}%`;

  const renderFormContent = () => (
    <>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-6 animate-fade-in-up py-8">
          <TerminalLoader />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Creating your account...</p>
        </div>
      ) : isSuccess ? (
        <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up">
          <div className={`text-center ${embedded ? '' : 'bg-white dark:bg-slate-800 py-8 px-6 shadow-xl sm:rounded-2xl border border-slate-100 dark:border-slate-700'}`}>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
              <i className="fa-solid fa-check"></i>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Registration Request Sent</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Your student account has been created and is currently <b>pending approval</b> from the Faculty. You will be notified via email once your account is active.
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
          {errors.form && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm border border-red-200 dark:border-red-800 flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation"></i> {errors.form}
            </div>
          )}

          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Full Name</label>
                <input name="fullName" value={formData.fullName} onChange={handleChange} type="text" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Phone</label>
                <input name="phone" value={formData.phone} onChange={handleChange} type="text" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Email Address</label>
              <input name="email" value={formData.email} onChange={handleChange} type="email" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Student ID</label>
                <input name="studentId" value={formData.studentId} onChange={handleChange} type="text" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg" />
                {errors.studentId && <p className="text-red-500 text-xs mt-1">{errors.studentId}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Program Type</label>
                <select name="programType" value={formData.programType} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg">
                  {PROGRAM_TYPES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                {errors.programType && <p className="text-red-500 text-xs mt-1">{errors.programType}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Class / Course</label>
                <select name="course" value={formData.course} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg">
                  {COURSES_BY_PROGRAM[formData.programType].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.course && <p className="text-red-500 text-xs mt-1">{errors.course}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Semester</label>
                <select name="semester" value={formData.semester} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg">
                  {getAvailableSemesters(formData.course).map(i => (
                    <option key={i} value={`S${i}`}>S{i} (Semester {i})</option>
                  ))}
                </select>
                {errors.semester && <p className="text-red-500 text-xs mt-1">{errors.semester}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Password</label>
                <div className="relative">
                  <input name="password" value={formData.password} onChange={handleChange} type={showPassword ? "text" : "password"} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 pr-10" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none">
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Confirm</label>
                <div className="relative">
                  <input name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} type={showConfirmPassword ? "text" : "password"} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg pr-10" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none">
                    <i className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* Password Strength UI */}
            {formData.password && (
              <div className="pt-1">
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full ${strengthColor} transition-all duration-300`} style={{ width: strengthWidth }}></div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1">
                  <div className={`text-[10px] flex items-center gap-1 ${pwdCriteria.length ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                    <i className={`fa-solid ${pwdCriteria.length ? 'fa-check' : 'fa-circle text-[4px]'}`}></i> Min 8 Chars
                  </div>
                  <div className={`text-[10px] flex items-center gap-1 ${pwdCriteria.lower ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                    <i className={`fa-solid ${pwdCriteria.lower ? 'fa-check' : 'fa-circle text-[4px]'}`}></i> Lowercase
                  </div>
                  <div className={`text-[10px] flex items-center gap-1 ${pwdCriteria.upper ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                    <i className={`fa-solid ${pwdCriteria.upper ? 'fa-check' : 'fa-circle text-[4px]'}`}></i> Uppercase
                  </div>
                  <div className={`text-[10px] flex items-center gap-1 ${pwdCriteria.number ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                    <i className={`fa-solid ${pwdCriteria.number ? 'fa-check' : 'fa-circle text-[4px]'}`}></i> Number
                  </div>
                  <div className={`text-[10px] flex items-center gap-1 ${pwdCriteria.special ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                    <i className={`fa-solid ${pwdCriteria.special ? 'fa-check' : 'fa-circle text-[4px]'}`}></i> Special Char
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-2">Upload ID Proof (Img/PDF, Max 5MB)</label>
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*,.pdf"
                className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50"
              />
              {errors.file && <p className="text-red-500 text-xs mt-1">{errors.file}</p>}
            </div>

            <div className="flex items-center pt-2">
              <input type="checkbox" className="h-4 w-4 text-blue-600 rounded border-slate-300 dark:border-slate-600" defaultChecked />
              <label className="ml-2 text-sm text-slate-600 dark:text-slate-400">I confirm the details provided are correct.</label>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors mt-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Submit Registration'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">Already have an account? Sign In</Link>
          </div>
        </>
      )}
    </>
  );

  if (embedded) {
    return renderFormContent();
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300 relative">
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <Logo className="w-16 h-16" textClassName="text-3xl" />
        </div>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-slate-900 dark:text-white">Create your account</h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Join Labflow as a Student
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-slate-100 dark:border-slate-700">
          {renderFormContent()}
        </div>
      </div>
    </div>
  );
};

export default StudentSignUp;