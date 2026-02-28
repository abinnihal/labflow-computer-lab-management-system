import React from 'react';
import { Github, Linkedin, Mail, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
    return (
        <footer className="bg-brand-card pt-20 pb-10 border-t border-white/5">
            <div className="container mx-auto px-4">
                {/* Call to Action Banner */}
                <div className="bg-brand-green rounded-3xl p-10 md:p-16 text-center relative overflow-hidden mb-20 group">
                    <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-transparent"></div>
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to Modernize?</h2>
                        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                            {/* Routes directly to signup/login for seamless demo transition */}
                            <Link to="/signup" className="px-8 py-4 bg-brand-dark text-white font-bold rounded-full hover:scale-105 transition-transform flex items-center gap-2">
                                Request Demo <ArrowUpRight size={20} />
                            </Link>
                        </div>
                        <p className="mt-6 text-white/80 max-w-2xl mx-auto font-medium">
                            Explore the Lab Scheduling & Management System built for modern academic institutions.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-16">
                    <div>
                        <h4 className="text-xl font-bold mb-6 text-white">Platform Access</h4>
                        <ul className="space-y-4 text-gray-400">
                            {/* Functional links routing to the login portal */}
                            <li><Link to="/login" className="hover:text-brand-green transition-colors">Student Portal</Link></li>
                            <li><Link to="/login" className="hover:text-brand-green transition-colors">Faculty Portal</Link></li>
                            <li><Link to="/login" className="hover:text-brand-green transition-colors">Admin Dashboard</Link></li>
                            <li><Link to="/login" className="hover:text-brand-green transition-colors">AI Lab Assistant</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-xl font-bold mb-6 text-white">Project Resources</h4>
                        <ul className="space-y-4 text-gray-400">
                            {/* Safe anchor links or text so they don't 404 */}
                            <li className="cursor-default">React & Firebase Stack</li>
                            <li className="cursor-default">System Architecture</li>
                            <li className="cursor-default">BCA Project Report</li>
                            <li><a href="https://github.com/abinnihal/labflow-computer-lab-management-system.git" target="_blank" rel="noopener noreferrer" className="hover:text-brand-green transition-colors">Source Code</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-xl font-bold mb-6 text-white">Institution</h4>
                        <ul className="space-y-4 text-gray-400">
                            <li className="cursor-default">BCA Department</li>
                            <li className="cursor-default">CCSIT Malappuram</li>
                            <li className="cursor-default">Academic Year 2025-2026</li>
                        </ul>
                    </div>
                    <div className="col-span-2">
                        <h4 className="text-xl font-bold mb-6 text-white">Connect</h4>
                        {/* Functional Mailto link */}
                        <a href="mailto:labflow.project@gmail.com" className="text-gray-400 hover:text-white transition-colors mb-4 block">
                            labflow.project@gmail.com
                        </a>
                        <div className="flex gap-4 mt-4">
                            {/* GitHub Link - Update href with your actual repo link */}
                            <a href="https://github.com/abinnihal/labflow-computer-lab-management-system.git" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-brand-green hover:text-white transition-all" title="View Repository">
                                <Github size={18} />
                            </a>
                            {/* LinkedIn Link */}
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-brand-green hover:text-white transition-all" title="LinkedIn Profile">
                                <Linkedin size={18} />
                            </a>
                            {/* Email Link */}
                            <a href="mailto:labflow.project@gmail.com" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-brand-green hover:text-white transition-all" title="Send Email">
                                <Mail size={18} />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
                    <p>&copy; 2026 LabFlow — Academic Project. All rights reserved.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <span className="cursor-default">Designed for Evaluation</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;