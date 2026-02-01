import { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { getStudentTaskHistory, getTasksByFaculty } from '../services/taskService';
import { getPendingUsersByRole } from '../services/userService';
import { getPendingMaintenanceCount } from '../services/maintenanceService';

export const useBadges = (user: User | null) => {
    const [badges, setBadges] = useState({
        tasks: 0,      // For Students (Pending Assignments)
        approvals: 0,  // For Faculty (Advisor) & Admin (User approvals)
        issues: 0,     // For Admin (Lab Issues)
        grading: 0     // For Faculty (Pending Submissions)
    });

    useEffect(() => {
        if (!user) return;

        const fetchBadges = async () => {
            try {
                let newBadges = { tasks: 0, approvals: 0, issues: 0, grading: 0 };

                if (user.role === UserRole.STUDENT) {
                    // 1. Student: Count Pending Tasks
                    const history = await getStudentTaskHistory(user.id);
                    const pending = history.filter(h => h.status === 'PENDING' || h.status === 'OVERDUE').length;
                    newBadges.tasks = pending;
                }
                else if (user.role === UserRole.FACULTY) {
                    // 2. Faculty: Count Approvals (If Advisor) & Grading
                    if (user.isClassAdvisor && user.advisorSemester) {
                        const pendingStudents = await getPendingUsersByRole(UserRole.STUDENT, user.department);
                        newBadges.approvals = pendingStudents.filter(s => s.semester === user.advisorSemester).length;
                    }

                    // Count tasks created by this faculty that have pending submissions
                    // (This is a simplified check for demo purposes)
                    const myTasks = await getTasksByFaculty(user.id);
                    // Assuming you want to notify about open tasks:
                    newBadges.grading = myTasks.filter(t => t.type === 'ASSIGNMENT' && t.status === 'OPEN').length;
                }
                else if (user.role === UserRole.ADMIN) {
                    // 3. Admin: Count All Pending Users & Issues
                    const pendingStudents = await getPendingUsersByRole(UserRole.STUDENT);
                    const pendingFaculty = await getPendingUsersByRole(UserRole.FACULTY);
                    newBadges.approvals = pendingStudents.length + pendingFaculty.length;

                    const issues = await getPendingMaintenanceCount('ALL'); // Admin sees all
                    newBadges.issues = issues;
                }

                setBadges(newBadges);
            } catch (error) {
                console.error("Badge fetch failed", error);
            }
        };

        fetchBadges();

        // Poll every 60 seconds to keep badges fresh
        const interval = setInterval(fetchBadges, 60000);
        return () => clearInterval(interval);
    }, [user]);

    return badges;
};