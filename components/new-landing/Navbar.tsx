import React, { useState, useEffect } from 'react';
import { Menu, X, Flag } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-brand-dark/80 backdrop-blur-md border-b border-white/5 py-4' : 'bg-transparent py-6'
            }`}>
            <div className="container mx-auto px-4 flex items-center justify-between">
                {/* Logo */}
                <div
                    className="flex items-center gap-2 font-bold text-2xl tracking-tighter cursor-pointer"
                    onClick={() => window.scrollTo(0, 0)}
                >
                    <div className="w-14 h-14 flex items-center justify-center">
                        <img
                            src="/logo.png"
                            alt="Labflow logo"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <span className="text-white">Labflow</span>
                </div>

                {/* Desktop Links */}
                <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-gray-300">
                    <a href="#" className="hover:text-brand-green transition-colors">About</a>
                    <a href="#" className="hover:text-brand-green transition-colors">Contact</a>
                </div>

                {/* Actions */}
                <div className="hidden lg:flex items-center gap-6">
                    <button className="text-gray-400 hover:text-white transition-colors" aria-label="Language/Region">
                        <Flag size={20} />
                    </button>
                    <Link to="/signup" className="px-6 py-2 bg-brand-green text-white font-bold rounded-full hover:bg-brand-accent transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]">
                        Sign Up
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="lg:hidden text-white"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="absolute top-full left-0 right-0 bg-brand-card border-b border-white/10 p-4 lg:hidden flex flex-col gap-4 animate-in fade-in slide-in-from-top-5 shadow-2xl">
                    <a href="#" className="block py-2 text-gray-300 hover:text-white">About</a>
                    <a href="#" className="block py-2 text-gray-300 hover:text-white">Contact</a>
                    <hr className="border-white/10" />
                    <div className="flex items-center gap-4 py-2 text-gray-300">
                        <Flag size={20} /> <span>Region</span>
                    </div>
                    <Link to="/signup" className="w-full py-3 bg-brand-green text-white font-bold rounded-xl text-center block">
                        Sign Up
                    </Link>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
