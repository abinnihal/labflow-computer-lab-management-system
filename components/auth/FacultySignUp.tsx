import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { registerFaculty } from '../../services/auth';
import TerminalLoader from '../ui/TerminalLoader';
import ThemeToggle from '../ui/ThemeToggle';
import Logo from '../ui/Logo';

interface FacultySignUpProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  embedded?: boolean;
}

const DEPARTMENTS = ['Computer Science', 'Information Technology', 'Data Science', 'Electronics'];

const FacultySignUp: React.FC<FacultySignUpProps> = ({ isDarkMode, toggleTheme, embedded = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);
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
    facultyId: '',
    department: 'Computer Science',
    programType: 'BOTH' as 'UG' | 'PG' | 'BOTH',
    designation: 'Assistant Professor',
    managedSemesters: [] as string[],
  });

  // NEW: State for Subject Mapping (Semester -> { Name, Code })
  const [subjectDetails, setSubjectDetails] = useState<Record<string, { name: string, code: string }>>({});

  // Password Strength State
  const [pwdCriteria, setPwdCriteria] = useState({
    length: false,
    lower: false,
    upper: false,
    number: false,
    special: false
  });

  const ALL_SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

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

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSemesterToggle = (sem: string) => {
    setFormData(prev => {
      const current = prev.managedSemesters;
      let newSemesters;
      if (current.includes(sem)) {
        // Remove semester and its subject details
        newSemesters = current.filter(s => s !== sem);
        setSubjectDetails(prevDetails => {
          const newDetails = { ...prevDetails };
          delete newDetails[sem];
          return newDetails;
        });
      } else {
        // Add semester and initialize subject details
        newSemesters = [...current, sem];
        setSubjectDetails(prevDetails => ({
          ...prevDetails,
          [sem]: { name: '', code: '' }
        }));
      }
      return { ...prev, managedSemesters: newSemesters };
    });

    if (errors.managedSemesters) {
      setErrors(prev => ({ ...prev, managedSemesters: '' }));
    }
  };

  // NEW: Handle Subject Input Changes
  const handleSubjectChange = (sem: string, field: 'name' | 'code', value: string) => {
    setSubjectDetails(prev => ({
      ...prev,
      [sem]: {
        ...prev[sem],
        [field]: value
      }
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB
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

    if (!formData.facultyId.trim()) newErrors.facultyId = 'Faculty ID is required';
    if (!formData.department.trim()) newErrors.department = 'Department is required';
    if (!formData.programType) newErrors.programType = 'Program Level is required';

    if (formData.managedSemesters.length === 0) newErrors.managedSemesters = 'Select at least one semester';

    // Validate Subject Details
    for (const sem of formData.managedSemesters) {
      if (!subjectDetails[sem]?.name || !subjectDetails[sem]?.code) {
        newErrors.subjects = `Enter Subject Name & Code for ${sem}`;
      }
    }

    if (!formData.password) newErrors.password = 'Password is required';
    else if (!Object.values(pwdCriteria).every(Boolean)) newErrors.password = 'Password does not meet criteria';

    if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirm Password is required';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    if (!file) newErrors.file = 'ID Proof upload is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Transform the map into the array format expected by the service
      const formattedSubjects = formData.managedSemesters.map(sem => ({
        name: subjectDetails[sem].name,
        code: subjectDetails[sem].code,
        semester: sem
      }));

      await registerFaculty(
        formData.email,
        formData.password,
        formData.fullName,
        formData.facultyId,
        formData.designation,
        formData.managedSemesters,
        formattedSubjects // Passing the subject data
      );

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
          <p className="text-slate-500 dark:text-slate-400 font-medium">Creating your account & assigning subjects...</p>
        </div>
      ) : isSuccess ? (
        <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up">
          <div className={`text-center ${embedded ? '' : 'bg-white dark:bg-slate-800 py-8 px-6 shadow-xl sm:rounded-2xl border border-slate-100 dark:border-slate-700'}`}>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
              <i className="fa-solid fa-check"></i>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Registration Successful</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Your faculty account has been created with the assigned subjects. It is currently <b>pending approval</b> from the Administrator.
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
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Faculty ID</label>
                <input name="facultyId" value={formData.facultyId} onChange={handleChange} type="text" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg" />
                {errors.facultyId && <p className="text-red-500 text-xs mt-1">{errors.facultyId}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg"
                >
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Program Level</label>
                <select name="programType" value={formData.programType} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg">
                  <option value="UG">Undergraduate (UG)</option>
                  <option value="PG">Postgraduate (PG)</option>
                  <option value="BOTH">Both (UG & PG)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Designation</label>
                <select name="designation" value={formData.designation} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg">
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Professor">Professor</option>
                  <option value="Lab Instructor">Lab Instructor</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-2">Teaching Semesters</label>
              <div className="grid grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                {ALL_SEMESTERS.map(sem => {
                  const semStr = `S${sem}`;
                  return (
                    <label key={sem} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.managedSemesters.includes(semStr)}
                        onChange={() => handleSemesterToggle(semStr)}
                        className="h-4 w-4 text-purple-600 rounded border-slate-300 dark:border-slate-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{semStr}</span>
                    </label>
                  );
                })}
              </div>
              {errors.managedSemesters && <p className="text-red-500 text-xs mt-1">{errors.managedSemesters}</p>}
            </div>

            {/* DYNAMIC SUBJECT INPUTS */}
            {formData.managedSemesters.length > 0 && (
              <div className="bg-blue-50 dark:bg-slate-800/50 p-4 rounded-xl border border-blue-100 dark:border-slate-700 space-y-4 animate-fade-in">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Assign Subjects</h4>
                  <span className="text-[10px] text-slate-400">Specify what you teach for each class</span>
                </div>

                {errors.subjects && (
                  <div className="text-red-500 text-xs font-bold bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-900/30">
                    <i className="fa-solid fa-circle-exclamation mr-1"></i> {errors.subjects}
                  </div>
                )}

                {formData.managedSemesters.sort().map(sem => (
                  <div key={sem} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    <span className="w-10 text-sm font-bold text-slate-700 dark:text-slate-300 pt-2 sm:pt-0">{sem}:</span>
                    <input
                      placeholder="Subject Name (e.g. Java Lab)"
                      className="flex-1 w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={subjectDetails[sem]?.name || ''}
                      onChange={(e) => handleSubjectChange(sem, 'name', e.target.value)}
                    />
                    <input
                      placeholder="Code (e.g. CS101)"
                      className="w-full sm:w-28 px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={subjectDetails[sem]?.code || ''}
                      onChange={(e) => handleSubjectChange(sem, 'code', e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Password</label>
                <div className="relative">
                  <input name="password" value={formData.password} onChange={handleChange} type={showPassword ? "text" : "password"} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg pr-10" placeholder="••••••••" />
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
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors mt-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Submit Registration'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link to="/login" className="font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400">Already have an account? Sign In</Link>
          </div>
        </>
      )}
    </>
  );

  if (embedded) {
    return renderFormContent();
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300 relative">
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <Logo className="w-16 h-16" textClassName="text-3xl" />
        </div>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-slate-900 dark:text-white">Create your account</h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Join Labflow as Faculty
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

export default FacultySignUp;