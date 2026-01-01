import React from 'react';
import { ArrowRight, Calendar, BrainCircuit } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-brand-dark">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-green/10 rounded-full blur-[120px] animate-blob"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-900/10 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>

                {/* Grid Overlay */}
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                }}></div>
            </div>

            <div className="container mx-auto px-4 relative z-10 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-green/10 border border-brand-green/20 text-xs font-medium text-brand-green mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></span>
                    Intelligent End-to-End Solution
                </div>

                <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 leading-tight animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    Lab Scheduling <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400">& Management</span>
                </h1>

                <p className="text-xl md:text-2xl text-gray-400 mb-12 font-light max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-100">
                    A unified platform integrating automated scheduling, attendance tracking, AI-powered assistance, and real-time analytics.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-200">
                    <Link to="/login" className="px-10 py-4 bg-brand-green text-white font-bold rounded-full hover:bg-brand-accent transition-all duration-300 flex items-center gap-2 group hover:shadow-[0_0_30px_rgba(14,165,233,0.4)]">
                        Login
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* Floating Icons Decorations */}
                <div className="absolute top-1/2 left-10 lg:left-20 p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl hidden lg:block -translate-y-1/2 rotate-6 animate-pulse duration-[4000ms]">
                    <Calendar size={40} className="text-brand-green" />
                </div>
                <div className="absolute bottom-32 right-10 lg:right-20 p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl hidden lg:block -rotate-6">
                    <BrainCircuit size={40} className="text-purple-400" />
                </div>
            </div>
        </section>
    );
};

export default Hero;
