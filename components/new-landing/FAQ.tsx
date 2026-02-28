import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { FaqItem } from './types';

const faqData: FaqItem[] = [
    {
        question: "What is the underlying architecture of LabFlow?",
        answer: "LabFlow is built as a modern Single Page Application (SPA) using React and Tailwind CSS. It relies on Firebase for secure, real-time NoSQL database management (Firestore) and authentication, with Cloudinary handling secure media uploads."
    },
    {
        question: "How is student attendance verified and tracked?",
        answer: "LabFlow utilizes a highly secure, timestamped digital check-in system. It leverages the device camera for selfie-based verification and logs the exact check-in time directly to the database for automated faculty review."
    },
    {
        question: "What is the Academic Lab Assistant?",
        answer: "It is an integrated AI chat interface powered by the Google Gemini API. It helps students understand programming concepts, debug code, and navigate lab manuals using formatted Markdown, acting as a 24/7 learning guide."
    },
    {
        question: "How does the lab booking system prevent conflicts?",
        answer: "The system uses a real-time booking engine powered by Firestore. It actively cross-references active lab schedules, faculty approvals, and user roles to prevent overlapping reservations and ensure efficient resource allocation."
    },
    {
        question: "How do users receive system updates and alerts?",
        answer: "The platform features a centralized, real-time in-app Notification Center. Administrators and faculty can broadcast global alerts, task deadlines, and booking status updates instantly to specific user roles."
    },
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
