import React, { useState, useEffect, useCallback } from 'react';
// This component assumes it will be provided with a Supabase client via imports,
// consistent with the rest of your project's structure.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// --- Supabase Client Initialization ---
// NOTE: You must replace these with your actual Supabase project URL and anon key
const SUPABASE_URL = 'https://clsirugxuvdyxdnlwqqk.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsc2lydWd4dXZkeXhkbmx3cXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNDQ2MzgsImV4cCI6MjA3MDkyMDYzOH0.gow7e2mHP_Qa0S0TsCriCfkKZ8jFTXO6ahp0mCstmoU'; // Replace with your Supabase anon key
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// --- Task Management Modal ---
// A unified modal for assigning pending tasks and creating new ad-hoc tasks.
const TaskManagementModal = ({ area, isOpen, onClose, onUpdate, allCleaners, pendingTasks, profile }) => {
    // State for assigning pending tasks
    const [assigneeId, setAssigneeId] = useState('');
    
    // State for creating a new ad-hoc task
    const [newAdHocTaskTitle, setNewAdHocTaskTitle] = useState('');
    const [newAdHocTaskAssigneeId, setNewAdHocTaskAssigneeId] = useState('');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Reset form state when modal opens or area changes
        setAssigneeId('');
        setNewAdHocTaskTitle('');
        setNewAdHocTaskAssigneeId('');
        setError('');
    }, [isOpen, area]);

    if (!isOpen || !area) return null;

    // Handler for assigning all pending tasks
    const handleAssignPendingTasks = async () => {
        if (!assigneeId) {
            setError('Please select a cleaner to assign the pending tasks.');
            return;
        }
        setIsSubmitting(true);
        setError('');

        try {
            const taskIdsToUpdate = pendingTasks.map(t => t.id);
            const { error: updateError } = await supabase
                .from('tasks')
                .update({ 
                    assigned_to: assigneeId, 
                    status: 'assigned', 
                    assigned_at: new Date().toISOString() 
                })
                .in('id', taskIdsToUpdate);

            if (updateError) throw updateError;
            
            onUpdate(); // Refresh the main dashboard
            onClose();

        } catch (err) {
            setError('Failed to assign tasks. Please try again.');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handler for creating and assigning a new ad-hoc task
    const handleCreateAdHocTask = async (e) => {
        e.preventDefault();
        if (!newAdHocTaskTitle || !newAdHocTaskAssigneeId) {
            setError('Please provide a title and select a cleaner for the new task.');
            return;
        }
        setIsSubmitting(true);
        setError('');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { error: insertError } = await supabase
                .from('tasks')
                .insert([{
                    title: newAdHocTaskTitle,
                    description: 'Ad-hoc task created by supervisor.',
                    area_id: area.id,
                    zone_id: area.zone_id,
                    site_id: area.zones.site_id,
                    company_id: area.company_id,
                    assigned_to: newAdHocTaskAssigneeId,
                    created_by: user?.id, 
                    status: 'assigned',
                    task_type: 'ad_hoc', // Make sure 'ad_hoc' is in your user-defined task_type enum
                    assigned_at: new Date().toISOString()
                }]);

            if (insertError) throw insertError;

            onUpdate();
            onClose();

        } catch (err) {
            setError('Failed to create ad-hoc task. Please try again.');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4 z-50" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b">
                    <h3 className="text-xl font-bold">Manage Tasks for: {area.name}</h3>
                    <p className="text-sm text-gray-500">{area.zones.sites.name} &gt; {area.zones.name}</p>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {/* Section for assigning auto-generated tasks */}
                    <div className="mb-8">
                        <h4 className="font-semibold text-lg border-b pb-2 mb-4">Assign Pending Scheduled Tasks</h4>
                        {pendingTasks.length > 0 ? (
                            <div className="space-y-4">
                                <p>Assign all <span className="font-bold">{pendingTasks.length}</span> pending task(s) to a cleaner:</p>
                                <ul className="list-disc pl-5 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                                    {pendingTasks.map(task => <li key={task.id}>{task.title}</li>)}
                                </ul>
                                <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className="w-full p-2 border rounded-md">
                                    <option value="">Select Cleaner...</option>
                                    {allCleaners.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                                </select>
                                <button onClick={handleAssignPendingTasks} disabled={isSubmitting || !assigneeId} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
                                    {isSubmitting ? 'Assigning...' : 'Assign Pending Tasks'}
                                </button>
                            </div>
                        ) : (
                            <p className="text-gray-500">No scheduled tasks are pending for this area.</p>
                        )}
                    </div>

                    {/* Section for creating ad-hoc tasks */}
                    <div>
                        <h4 className="font-semibold text-lg border-b pb-2 mb-4">Create Ad-Hoc Task</h4>
                        <form onSubmit={handleCreateAdHocTask} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Task Title</label>
                                <input type="text" value={newAdHocTaskTitle} onChange={e => setNewAdHocTaskTitle(e.target.value)} placeholder="e.g., Urgent Spill Cleanup" className="w-full p-2 border rounded-md mt-1"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Assign To</label>
                                <select value={newAdHocTaskAssigneeId} onChange={e => setNewAdHocTaskAssigneeId(e.target.value)} className="w-full p-2 border rounded-md mt-1">
                                    <option value="">Select Cleaner...</option>
                                    {allCleaners.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                                </select>
                            </div>
                            <button type="submit" disabled={isSubmitting || !newAdHocTaskTitle || !newAdHocTaskAssigneeId} className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-50">
                                {isSubmitting ? 'Creating...' : 'Create & Assign Task'}
                            </button>
                        </form>
                    </div>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-b-lg">
                     {error && <p className="text-red-600 text-sm max-w-md">{error}</p>}
                    <button onClick={onClose} className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 ml-auto">
                        Close
                    </button>
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
        if (!profile?.id || !profile?.company_id) return;
        try {
            setLoading(true);
            setError(null);

            // 1. Get zones assigned to the supervisor
            const { data: assignedZones, error: zonesError } = await supabase
                .from('zone_assignments')
                .select('zones!inner(*, sites(*))') // Use !inner to only get zones if they exist
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

            // 3. Get all relevant tasks (pending or assigned)
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
    
    const pendingTasksForModal = selectedArea ? tasks.filter(t => t.area_id === selectedArea.id && t.status === 'pending') : [];

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
                                {zone.areas?.length > 0 ? zone.areas.map(area => {
                                    const assignedTasks = tasks.filter(t => t.area_id === area.id && t.status === 'assigned');
                                    const pendingTaskCount = tasks.filter(t => t.area_id === area.id && t.status === 'pending').length;

                                    return (
                                        <div key={area.id} className="border rounded-md p-4 bg-gray-50">
                                            <div className="flex justify-between items-center">
                                                <p className="font-semibold text-gray-800">{area.name}</p>
                                                <button
                                                    onClick={() => setSelectedArea(area)}
                                                    className="bg-blue-500 text-white py-1 px-3 text-sm rounded-md hover:bg-blue-600"
                                                >
                                                    Manage ({pendingTaskCount} Pending)
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
                            <p className="text-gray-600">You are not assigned to any zones, or there are no areas in your assigned zones.</p>
                        </div>
                    )}
                </div>
            </div>
            
            <TaskManagementModal
                profile={profile}
                area={selectedArea ? { ...selectedArea, zones: zones.find(z => z.id === selectedArea.zone_id) } : null}
                isOpen={!!selectedArea}
                onClose={() => setSelectedArea(null)}
                onUpdate={fetchData}
                allCleaners={cleaners}
                pendingTasks={pendingTasksForModal}
            />
        </>
    );
}

