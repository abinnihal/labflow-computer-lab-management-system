import { useEffect, useState } from 'react';

export const useTabMonitor = (isMonitoring: boolean) => {
    const [tabSwitchCount, setTabSwitchCount] = useState(0);

    useEffect(() => {
        if (!isMonitoring) {
            setTabSwitchCount(0); // Reset when exam ends/monitoring stops
            return;
        }

        const handleViolation = () => {
            setTabSwitchCount(prev => prev + 1);
            // Optional: Alert them immediately
            // alert("⚠️ Warning: You left the exam window!"); 
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                handleViolation();
            }
        };

        const handleBlur = () => {
            // Triggers when user clicks outside the window (e.g. dual monitor/split screen)
            handleViolation();
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
        };
    }, [isMonitoring]);

    return tabSwitchCount;
};