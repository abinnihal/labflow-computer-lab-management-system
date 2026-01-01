import React from 'react';

const stats = [
    { label: 'Conflict-Free', value: '100%', subtext: 'Automated scheduling algorithm' },
    { label: 'Monitoring', value: 'Real-time', subtext: 'Live lab usage tracking' },
    { label: 'Platform', value: 'Unified', subtext: 'Scheduling, Tasks & Analytics' },
    { label: 'AI Support', value: '24/7', subtext: 'Integrated code & doubt solving' },
];

const Stats: React.FC = () => {
    return (
        <section className="py-20 bg-brand-dark border-y border-white/5">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className="relative p-6 group cursor-default"
                        >
                            <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent group-hover:via-brand-green/50 transition-colors duration-500"></div>
                            <h3 className="text-4xl font-bold text-white mb-2 group-hover:text-brand-green transition-colors duration-300">
                                {stat.value}
                            </h3>
                            <p className="text-lg font-medium text-gray-300 mb-1">{stat.label}</p>
                            <p className="text-sm text-gray-600">{stat.subtext}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Stats;
