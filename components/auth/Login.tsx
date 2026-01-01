
import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import { Link } from 'react-router-dom';
import { authenticateUser } from '../../services/userService';
import TerminalLoader from '../ui/TerminalLoader';
import ThemeToggle from '../ui/ThemeToggle';
import Logo from '../ui/Logo';

interface LoginProps {
    onLogin: (user: User) => void;
    isDarkMode: boolean;
    toggleTheme: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, isDarkMode, toggleTheme }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Authenticate using Firebase-backed service
            const user = await authenticateUser(email, password);

            if (!user) {
                setError('Invalid credentials. Please check your email and password.');
                setIsLoading(false);
                return;
            }

            // Status Check Logic (UNCHANGED)
            if (user.status === 'PENDING') {
                setError('Account pending approval from Administrator.');
                setIsLoading(false);
                return;
            }
            if (user.status === 'REJECTED') {
                setError('Account registration was rejected.');
                setIsLoading(false);
                return;
            }
            if (user.status === 'DEACTIVATED') {
                setError('Account has been deactivated.');
                setIsLoading(false);
                return;
            }

            // Successful Login
            onLogin(user);

        } catch (err: any) {
            setError(err.message || 'Login failed. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 flex transition-colors duration-300 relative overflow-hidden">
            {/* Back Button */}
            <Link to="/" className="absolute top-6 left-6 z-50 flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">
                <i className="fa-solid fa-arrow-left"></i> Back to Home
            </Link>

            {/* Theme Toggle */}
            <div className="absolute top-6 right-6 z-50">
                <ThemeToggle isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
            </div>

            <div className="w-full flex min-h-screen">

                {/* Left Side - Form (60%) */}
                <div className="w-full lg:w-[60%] flex flex-col justify-center items-center p-8 sm:px-12 bg-white dark:bg-gray-900 relative z-20">
                    <div className="w-full max-w-md">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center gap-6 animate-fade-in-up py-12">
                                {/* Explicitly passing duration prop for clarity, though default is 2000 */}
                                <TerminalLoader duration={2000} />
                                <p className="text-slate-500 dark:text-slate-400 font-medium">Authenticating...</p>
                            </div>
                        ) : (
                            <>
                                <div className="mb-8 text-center lg:text-left">
                                    <div className="flex justify-center lg:justify-start mb-6 lg:hidden">
                                        <Logo className="w-14 h-14" textClassName="text-3xl" />
                                    </div>
                                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                        Welcome Back
                                    </h2>
                                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                        Enter your credentials to access the Labflow dashboard
                                    </p>
                                </div>

                                <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow-xl shadow-slate-200/50 dark:shadow-none sm:rounded-2xl sm:px-10 border border-slate-100 dark:border-slate-700">

                                    <form className="space-y-6" onSubmit={handleSubmit}>
                                        {error && (
                                            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                                <i className="fa-solid fa-circle-exclamation"></i> {error}
                                            </div>
                                        )}

                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Email Address / ID
                                            </label>
                                            <div className="mt-1">
                                                <input
                                                    id="email"
                                                    name="email"
                                                    type="text"
                                                    autoComplete="username"
                                                    required
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                    placeholder="you@college.edu"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Password
                                            </label>
                                            <div className="mt-1 relative">
                                                <input
                                                    id="password"
                                                    name="password"
                                                    type="password"
                                                    autoComplete="current-password"
                                                    required
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                            <div className="flex items-center justify-end mt-2">
                                                <div className="text-sm">
                                                    <a href="#" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">Forgot password?</a>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <button
                                                type="submit"
                                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                            >
                                                Sign in
                                            </button>
                                        </div>
                                    </form>

                                    <div className="mt-6">
                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                                            </div>
                                            <div className="relative flex justify-center text-sm">
                                                <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                                    New to Labflow?
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-6">
                                            <Link
                                                to="/signup"
                                                className="w-full flex justify-center py-2.5 px-4 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none transition-colors"
                                            >
                                                Create an account
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Right Side - Image (40%) */}
                <div className="hidden lg:flex lg:w-[40%] relative items-center justify-center overflow-hidden bg-slate-900 border-l border-slate-200 dark:border-slate-800">
                    {/* Background Image with Blur */}
                    <div
                        className="absolute inset-0 bg-cover bg-center blur-[4px] scale-105 transition-transform duration-1000 hover:scale-110 opacity-90"
                        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop')` }}
                    ></div>

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 to-slate-900/80 mix-blend-multiply"></div>

                    {/* Decorative Blobs */}
                    <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-blob"></div>
                    <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-2xl animate-blob animation-delay-2000"></div>

                    <div className="relative z-10 p-10 text-white max-w-lg text-center">
                        <div className="mb-8 flex justify-center">
                            <Logo className="w-20 h-20" textClassName="text-4xl text-white" />
                        </div>
                        <h1 className="text-3xl font-bold mb-6">Lab Management Simplified.</h1>
                        <p className="text-blue-100 text-base leading-relaxed">
                            Streamline scheduling, track attendance, and manage resources with intelligent tools designed for modern computer labs.
                        </p>
                        <div className="mt-10 flex flex-col gap-4">
                            <div className="flex items-center gap-2 bg-white/10 px-5 py-2.5 rounded-full backdrop-blur-md border border-white/10 hover:bg-white/20 transition-colors mx-auto w-fit">
                                <i className="fa-solid fa-check-circle text-green-400"></i> Smart Booking
                            </div>
                            <div className="flex items-center gap-2 bg-white/10 px-5 py-2.5 rounded-full backdrop-blur-md border border-white/10 hover:bg-white/20 transition-colors mx-auto w-fit">
                                <i className="fa-solid fa-robot text-blue-400"></i> AI Support
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Login;
