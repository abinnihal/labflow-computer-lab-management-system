import { useEffect, useState } from 'react';

export const useTabMonitor = (isMonitoring: boolean) => {
    const [tabSwitchCount, setTabSwitchCount] = useState(0);

    useEffect(() => {
        if (!isMonitoring) {
            setTabSwitchCount(0); // Reset when monitoring stops
            return;
        }

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setTabSwitchCount(prev => prev + 1);
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [isMonitoring]);

    return tabSwitchCount;
};