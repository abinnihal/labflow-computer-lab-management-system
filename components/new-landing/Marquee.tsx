import React from 'react';

const Marquee: React.FC = () => {
    const stack = [
        "React / Next.js", "Node.js", "Express", "NestJS", "MongoDB", "PostgreSQL",
        "Tailwind CSS", "Google Calendar API", "Outlook API", "WhatsApp API", "OpenAI", "Google Gemini"
    ];

    return (
        <div className="py-20 overflow-hidden bg-brand-dark relative z-20 border-y border-white/5">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-transparent to-brand-dark z-10 pointer-events-none"></div>

            {/* Label */}
            <div className="text-center mb-8">
                <span className="text-sm font-mono text-brand-green uppercase tracking-widest border border-brand-green/20 px-3 py-1 rounded-full">
                    Technology Stack
                </span>
            </div>

            <div className="whitespace-nowrap animate-marquee flex items-center gap-16">
                {[...stack, ...stack].map((item, i) => (
                    <span key={i} className="text-3xl md:text-5xl font-bold text-white/10 hover:text-brand-green/50 transition-colors leading-none uppercase tracking-tighter">
                        {item}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default Marquee;
