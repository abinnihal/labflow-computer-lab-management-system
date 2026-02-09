import React from 'react';

const Marquee: React.FC = () => {
    const stack = [
        "Google Firebase",
        "React (Vite)",
        "TypeScript",
        "Firebase Authentication",
        "Firestore Database",
        "Tailwind CSS",
        "React Router",
        "Lucide Icons",
        "Cloudinary",
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

            <div className="overflow-hidden">
                <div className="flex w-max animate-marquee items-center">
                    {[...stack, ...stack].map((item, i) => (
                        <span
                            key={i}
                            className="px-8 text-3xl md:text-5xl font-bold text-white/10 hover:text-brand-green/50 transition-colors leading-none uppercase tracking-tighter"
                        >
                            {item}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Marquee;
