import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { FaqItem } from './types';

const faqData: FaqItem[] = [
    { question: "How does the automated scheduling work?", answer: "The system uses a conflict-checker algorithm that cross-references faculty availability, lab capacity, and student timetables to book slots automatically without overlap." },
    { question: "What is the AI problem-solving window?", answer: "An integrated chat interface powered by OpenAI/Gemini that allows students to ask code-related doubts or troubleshooting questions directly within the lab environment." },
    { question: "How is attendance tracked?", answer: "Attendance is logged via timestamped check-in/check-out actions within the student module, providing real-time data to faculty." },
    { question: "Does it support external calendar integration?", answer: "Yes, the system fully integrates with Google Calendar and Outlook API to sync schedules across devices." },
    { question: "What notification channels are supported?", answer: "Global and specific notifications are sent via WhatsApp API and Email/Calendar invites to ensure instant updates." },
    { question: "Is the system scalable for large universities?", answer: "Yes, built on Node.js and scalable databases (MongoDB/PostgreSQL), it can handle thousands of concurrent users and complex scheduling patterns." },
];

const FAQ: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section className="py-24 bg-brand-dark relative">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">Technical <span className="text-brand-green">FAQ</span></h2>
                    <p className="text-xl text-gray-400">Understanding the system architecture</p>
                </div>

                <div className="space-y-4">
                    {faqData.map((item, index) => (
                        <div
                            key={index}
                            className="border border-white/10 rounded-2xl bg-brand-card overflow-hidden transition-all duration-300 hover:border-brand-green/30"
                        >
                            <button
                                className="w-full flex items-center justify-between p-6 text-left"
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            >
                                <span className="font-medium text-lg text-gray-200">{item.question}</span>
                                <span className={`p-2 rounded-full bg-white/5 transition-colors ${openIndex === index ? 'text-brand-green' : 'text-gray-400'}`}>
                                    {openIndex === index ? <Minus size={20} /> : <Plus size={20} />}
                                </span>
                            </button>

                            <div
                                className={`grid transition-all duration-300 ease-in-out ${openIndex === index ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                                    }`}
                            >
                                <div className="overflow-hidden">
                                    <div className="p-6 pt-0 text-gray-400 leading-relaxed border-t border-white/5 mt-2">
                                        {item.answer}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FAQ;
