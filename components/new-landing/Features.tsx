import React, { useState } from 'react';
import { Share2, Clock, ShieldCheck, File } from 'lucide-react';

const Features: React.FC = () => {
    return (
        <section className="py-24 bg-brand-dark">
            <div className="container mx-auto px-4">
                {/* Section 1 */}
                <div className="flex flex-col lg:flex-row items-center gap-16 mb-32">
                    <div className="lg:w-1/2">
                        <h2 className="text-5xl md:text-7xl font-bold leading-tight mb-8">
                            Eliminates <br />
                            <span className="text-brand-green">Fragmented</span> <br />
                            Tools.
                        </h2>
                        <p className="text-xl text-gray-400 leading-relaxed max-w-lg">
                            No more juggling between spreadsheets, calendars, and messaging apps. Labflow brings everything under one roof.
                        </p>
                    </div>
                    <div className="lg:w-1/2">
                        <div className="bg-brand-card p-8 rounded-3xl border border-white/10 relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/10 rounded-full blur-3xl"></div>
                            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                <ShieldCheck className="text-brand-green" /> Core Objectives
                            </h3>
                            <ul className="space-y-4 text-gray-400 leading-relaxed mb-6">
                                <li className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-green mt-2"></div>
                                    <span>Automated & conflict-free lab scheduling</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-green mt-2"></div>
                                    <span>Real-time lab usage monitoring</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-green mt-2"></div>
                                    <span>Centralized microblogging communication</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-green mt-2"></div>
                                    <span>Detailed analytics for admin and faculty</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* System Flow Grid */}
                <div className="mb-20">
                    <h2 className="text-4xl md:text-6xl font-bold text-center mb-4">System <span className="text-brand-green">Flow</span></h2>
                    <p className="text-center text-gray-400 mb-16">Seamless operations from scheduling to analytics</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                step: "Step 1",
                                title: "Scheduling",
                                icon: Clock,
                                desc: "Faculty books slots. Conflict checker ensures availability. Students are notified via WhatsApp & Calendar."
                            },
                            {
                                step: "Step 2",
                                title: "Execution",
                                icon: Share2,
                                desc: "Students check-in with timestamps. Attendance is logged automatically. AI window assists with doubts."
                            },
                            {
                                step: "Step 3",
                                title: "Submission",
                                icon: File,
                                desc: "Tasks are assigned and submitted (PDF/ZIP). Microblogging console enables peer communication."
                            },
                            {
                                step: "Step 4",
                                title: "Analytics",
                                icon: ShieldCheck,
                                desc: "Faculty reviews performance. Admins access usage logs, maintenance reports, and dashboard summaries."
                            }
                        ].map((item, idx) => (
                            <div key={idx} className="group p-8 rounded-3xl bg-brand-card border border-white/5 hover:border-brand-green/30 transition-all duration-300 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-brand-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-xs font-mono text-brand-green border border-brand-green/30 px-2 py-1 rounded inline-block">{item.step}</span>
                                    <item.icon className="text-brand-green/50 group-hover:text-brand-green transition-colors" size={24} />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-white group-hover:text-brand-green transition-colors">{item.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Features;
