import React, { useState } from 'react';
import { Check, Layers, Users, Shield } from 'lucide-react';
import { ModuleRole } from './types';

const MODULE_DATA = {
    [ModuleRole.STUDENT]: {
        title: "Learner Experience",
        icon: Users,
        features: [
            "Profile management",
            "Google calendar-integrated schedule",
            "Check-in/check-out with timestamps",
            "Task submission (PDF/ZIP/TXT)",
            "AI problem-solving window",
            "Learner’s microblogging console",
            "Feedback submission",
            "Lab history (attended/missed)"
        ]
    },
    [ModuleRole.FACULTY]: {
        title: "Faculty Control",
        icon: Layers,
        features: [
            "Academic level selection (UG/PG)",
            "Student notifications via WhatsApp",
            "Task assignment & tracking",
            "Lab slot booking with conflict checker",
            "Google/Outlook Calendar integration",
            "Attendance monitoring & graphs",
            "Task review and feedback",
            "Lab usage dashboard summary"
        ]
    },
    [ModuleRole.ADMIN]: {
        title: "Admin Oversight",
        icon: Shield,
        features: [
            "Comprehensive Analytics dashboard",
            "User & Role management",
            "Lab maintenance logs",
            "Slot pattern configuration",
            "Booking controls & overrides",
            "Complaint management system",
            "Global notifications (WhatsApp API)",
            "Master timetable access"
        ]
    }
};

const SystemModules: React.FC = () => {
    const [activeModule, setActiveModule] = useState<ModuleRole>(ModuleRole.STUDENT);
    const currentModule = MODULE_DATA[activeModule];
    const Icon = currentModule.icon;

    return (
        <section className="py-24 relative overflow-hidden bg-brand-dark">
            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">
                        System <span className="text-brand-green">Modules</span>
                    </h2>
                    <p className="text-gray-400">Comprehensive role-based access control.</p>
                </div>

                {/* Module Tabs */}
                <div className="flex flex-wrap justify-center gap-4 mb-12">
                    {Object.values(ModuleRole).map((role) => (
                        <button
                            key={role}
                            onClick={() => setActiveModule(role)}
                            className={`px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 border flex items-center gap-2 ${activeModule === role
                                    ? 'bg-brand-green text-white border-brand-green shadow-[0_0_20px_rgba(14,165,233,0.3)]'
                                    : 'bg-brand-card text-gray-400 border-white/10 hover:border-white/30'
                                }`}
                        >
                            {role}
                        </button>
                    ))}
                </div>

                {/* Feature Display */}
                <div className="max-w-4xl mx-auto">
                    <div className="bg-gradient-to-br from-brand-card to-brand-border/30 border border-white/10 rounded-3xl p-8 md:p-12 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-green/10 blur-[100px] rounded-full group-hover:bg-brand-green/20 transition-all duration-500"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-4 bg-brand-green/10 rounded-2xl text-brand-green border border-brand-green/20">
                                    <Icon size={32} />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold text-white">{currentModule.title}</h3>
                                    <p className="text-gray-400">Key capabilities and features</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-x-12 gap-y-4">
                                {currentModule.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors">
                                        <div className="mt-1 min-w-[20px]">
                                            <Check size={18} className="text-brand-green" />
                                        </div>
                                        <span className="text-gray-200">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SystemModules;
