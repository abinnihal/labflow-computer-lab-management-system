import React from 'react';
import { Github, Twitter, Linkedin, Mail, ArrowUpRight } from 'lucide-react';
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
                            <Link to="/signup" className="px-8 py-4 bg-brand-dark text-white font-bold rounded-full hover:scale-105 transition-transform flex items-center gap-2">
                                Request Demo <ArrowUpRight size={20} />
                            </Link>
                        </div>
                        <p className="mt-6 text-white/80 max-w-2xl mx-auto font-medium">
                            Explore the Lab Scheduling & Management System for academic institutions.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-16">
                    <div>
                        <h4 className="text-xl font-bold mb-6 text-white">Product</h4>
                        <ul className="space-y-4 text-gray-400">
                            <li><a href="#" className="hover:text-brand-green transition-colors">Overview</a></li>
                            <li><a href="#" className="hover:text-brand-green transition-colors">Student Module</a></li>
                            <li><a href="#" className="hover:text-brand-green transition-colors">Faculty Module</a></li>
                            <li><a href="#" className="hover:text-brand-green transition-colors">Admin Module</a></li>
                            <li><a href="#" className="hover:text-brand-green transition-colors">Integrations</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-xl font-bold mb-6 text-white">Resources</h4>
                        <ul className="space-y-4 text-gray-400">
                            <li><a href="#" className="hover:text-brand-green transition-colors">Documentation</a></li>
                            <li><a href="#" className="hover:text-brand-green transition-colors">API Reference</a></li>
                            <li><a href="#" className="hover:text-brand-green transition-colors">System Architecture</a></li>
                            <li><a href="#" className="hover:text-brand-green transition-colors">Community</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-xl font-bold mb-6 text-white">Company</h4>
                        <ul className="space-y-4 text-gray-400">
                            <li><a href="#" className="hover:text-brand-green transition-colors">About Us</a></li>
                            <li><a href="#" className="hover:text-brand-green transition-colors">Careers</a></li>
                            <li><a href="#" className="hover:text-brand-green transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-brand-green transition-colors">Contact</a></li>
                        </ul>
                    </div>
                    <div className="col-span-2">
                        <h4 className="text-xl font-bold mb-6 text-white">Connect</h4>
                        <p className="text-gray-400 mb-4">labflow.project@gmail.com</p>
                        <div className="flex gap-4">
                            {[Github, Twitter, Linkedin, Mail].map((Icon, i) => (
                                <a key={i} href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-brand-green hover:text-white transition-all">
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
                    <p>&copy; 2026 Labflow — Academic Project. All rights reserved.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <a href="#" className="hover:text-white">Privacy Policy</a>
                        <a href="#" className="hover:text-white">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
