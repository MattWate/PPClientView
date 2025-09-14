import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { supabase } from '../services/supabaseClient';


// --- Task Assignment Modal ---
// This modal allows a supervisor to assign unassigned tasks in an area to a cleaner.
const TaskAssignmentModal = ({ area, isOpen, onClose, onUpdate, allCleaners, unassignedTasks }) => {
    const [selectedCleanerId, setSelectedCleanerId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Reset state when modal opens
        setSelectedCleanerId('');
        setError('');
    }, [isOpen]);

    if (!isOpen || !area) return null;

    const handleAssignTasks = async () => {
        if (!selectedCleanerId) {
            setError('Please select a cleaner.');
            return;
        }
        if (unassignedTasks.length === 0) {
            onClose();
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const taskIdsToUpdate = unassignedTasks.map(t => t.id);

            const { error: updateError } = await supabase
                .from('tasks')
                .update({
                    assigned_to: selectedCleanerId,
                    status: 'assigned', // Update status to 'assigned'
                    assigned_at: new Date().toISOString()
                })
                .in('id', taskIdsToUpdate);

            if (updateError) throw updateError;

            onUpdate(); // Refresh the main dashboard data
            onClose();
        } catch (err) {
            setError('Failed to assign tasks. Please try again.');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full m-4 z-50" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b">
                    <h3 className="text-xl font-bold">Assign Tasks in: {area.name}</h3>
                     <p className="text-sm text-gray-500">{area.zones.sites.name} &gt; {area.zones.name}</p>
                </div>
                <div className="p-6 space-y-4">
                    {unassignedTasks.length > 0 ? (
                        <>
                            <p>Select a cleaner to assign the following <span className="font-bold">{unassignedTasks.length}</span> unassigned task(s) to:</p>
                            <ul className="list-disc pl-5 text-sm text-gray-700 max-h-40 overflow-y-auto">
                               {unassignedTasks.map(task => <li key={task.id}>{task.title}</li>)}
                            </ul>
                            <select
                                value={selectedCleanerId}
                                onChange={(e) => setSelectedCleanerId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                            >
                                <option value="">Select a Cleaner...</option>
                                {allCleaners.map(cleaner => (
                                    <option key={cleaner.id} value={cleaner.id}>{cleaner.full_name}</option>
                                ))}
                            </select>
                        </>
                    ) : (
                        <p className="text-gray-600 text-center">There are no pending tasks to assign in this area.</p>
                    )}
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-b-lg">
                     {error && <p className="text-red-600 text-sm">{error}</p>}
                    <button onClick={onClose} className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300">
                        Cancel
                    </button>
                   {unassignedTasks.length > 0 && (
                     <button
                        onClick={handleAssignTasks}
                        disabled={isSubmitting || !selectedCleanerId}
                        className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Assigning...' : 'Assign Tasks'}
                    </button>
                   )}
                </div>
            </div>
        </div>
    );
};


// --- Main Supervisor Dashboard Component ---
export default function SupervisorDashboard({ profile }) {
    const [zones, setZones] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [cleaners, setCleaners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedArea, setSelectedArea] = useState(null);

    const fetchData = useCallback(async () => {
        if (!profile) return;
        try {
            setLoading(true);
            setError(null);

            // 1. Get zones assigned to the supervisor from 'zone_assignments'
            const { data: assignedZones, error: zonesError } = await supabase
                .from('zone_assignments')
                .select('zones(*, sites(*))')
                .eq('user_id', profile.id);
            if (zonesError) throw zonesError;

            const supervisorZones = assignedZones.map(z => z.zones).filter(Boolean);
            const zoneIds = supervisorZones.map(z => z.id);

            if (zoneIds.length === 0) {
                setZones([]);
                setLoading(false);
                return;
            }

            // 2. Get all areas within those zones
            const { data: areasData, error: areasError } = await supabase
                .from('areas')
                .select('*')
                .in('zone_id', zoneIds);
            if (areasError) throw areasError;
            
             // Group areas by zone_id for easier lookup
            const areasByZone = areasData.reduce((acc, area) => {
                if (!acc[area.zone_id]) acc[area.zone_id] = [];
                acc[area.zone_id].push(area);
                return acc;
            }, {});

            const zonesWithAreas = supervisorZones.map(zone => ({
                ...zone,
                areas: areasByZone[zone.id] || []
            }));
            setZones(zonesWithAreas);

            // 3. Get all tasks within those zones (pending or assigned)
            const { data: tasksData, error: tasksError } = await supabase
                .from('tasks')
                .select('id, title, status, area_id, assigned_to')
                .in('zone_id', zoneIds)
                .in('status', ['pending', 'assigned']);
            if (tasksError) throw tasksError;
            setTasks(tasksData || []);

            // 4. Get all cleaners in the company
            const { data: cleanersData, error: cleanersError } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('company_id', profile.company_id)
                .eq('role', 'cleaner');
            if (cleanersError) throw cleanersError;
            setCleaners(cleanersData || []);

        } catch (err) {
            console.error("Error fetching supervisor data:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [profile]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const getCleanerName = (id) => cleaners.find(c => c.id === id)?.full_name || 'Unknown';

    if (loading) return <div className="p-6">Loading dashboard...</div>;
    if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
    
    // Find unassigned tasks for the selected area
    const unassignedTasksForModal = selectedArea ? tasks.filter(t => t.area_id === selectedArea.id && t.status === 'pending') : [];

    return (
        <>
            <div className="p-6 bg-gray-50 min-h-screen">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Task Assignment Dashboard</h2>
                <div className="space-y-8">
                    {zones.length > 0 ? zones.map(zone => (
                        <div key={zone.id} className="bg-white p-4 rounded-lg shadow-md border">
                            <h3 className="text-xl font-semibold mb-1">{zone.name}</h3>
                            <p className="text-sm text-gray-500 mb-4">Site: {zone.sites.name}</p>
                            <div className="space-y-4">
                                {zone.areas.length > 0 ? zone.areas.map(area => {
                                    const areaTasks = tasks.filter(t => t.area_id === area.id);
                                    const assignedTasks = areaTasks.filter(t => t.status === 'assigned');
                                    const pendingTasks = areaTasks.filter(t => t.status === 'pending');

                                    return (
                                        <div key={area.id} className="border rounded-md p-4 bg-gray-50">
                                            <div className="flex justify-between items-center">
                                                <p className="font-semibold text-gray-800">{area.name}</p>
                                                <button
                                                    onClick={() => setSelectedArea(area)}
                                                    className="bg-blue-500 text-white py-1 px-3 text-sm rounded-md hover:bg-blue-600 disabled:opacity-50"
                                                    disabled={pendingTasks.length === 0}
                                                >
                                                    Assign Tasks ({pendingTasks.length})
                                                </button>
                                            </div>
                                            <div className="mt-2 pl-4 border-l-2">
                                                 <h5 className="text-xs font-bold text-gray-500 uppercase mb-1">Assigned Tasks</h5>
                                                {(assignedTasks.length > 0) ? (
                                                    <ul className="list-disc pl-5 space-y-1">
                                                        {assignedTasks.map(task => (
                                                          <li key={task.id} className="text-sm text-gray-700">
                                                              {task.title} - <span className="font-semibold">{getCleanerName(task.assigned_to)}</span>
                                                          </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-xs text-gray-500 italic">No tasks currently assigned in this area.</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <p className="text-sm text-gray-500">No areas found in this zone.</p>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="bg-white p-6 rounded-lg shadow-md text-center">
                            <p className="text-gray-600">You are not assigned to any zones.</p>
                        </div>
                    )}
                </div>
            </div>
            
            <TaskAssignmentModal
                area={selectedArea ? { ...selectedArea, zones: zones.find(z => z.id === selectedArea.zone_id) } : null}
                isOpen={!!selectedArea}
                onClose={() => setSelectedArea(null)}
                onUpdate={fetchData}
                allCleaners={cleaners}
                unassignedTasks={unassignedTasksForModal}
            />
        </>
    );
}

