import React, { useEffect } from 'react';
import Navbar from './Navbar';
import Hero from './Hero';
import Stats from './Stats';
import Features from './Features';
import Marquee from './Marquee';
import SystemModules from './Pricing';
import FAQ from './FAQ';
import Footer from './Footer';

interface LandingPageProps {
    isDarkMode?: boolean;
    toggleTheme?: () => void;
}

const NewLandingPage: React.FC<LandingPageProps> = () => {
    // Simple intersection observer hook for fade-in animations
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('opacity-100', 'translate-y-0');
                    entry.target.classList.remove('opacity-0', 'translate-y-10');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    return (
        <div className="bg-brand-dark text-white min-h-screen font-sans selection:bg-brand-green selection:text-white">
            <Navbar />

            <main>
                <Hero />
                <Stats />

                <div className="reveal opacity-0 translate-y-10 transition-all duration-1000">
                    <Features />
                </div>

                <Marquee />

                <div id="modules" className="reveal opacity-0 translate-y-10 transition-all duration-1000">
                    <SystemModules />
                </div>

                <div className="reveal opacity-0 translate-y-10 transition-all duration-1000">
                    <FAQ />
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default NewLandingPage;
