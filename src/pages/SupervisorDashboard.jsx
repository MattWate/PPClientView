import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// --- Supabase Client Initialization ---
// NOTE: You must replace these with your actual Supabase project URL and anon key
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your Supabase anon key
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Area Assignment Modal ---
// This modal allows a supervisor to assign/unassign cleaners from a specific area.
const AreaAssignmentModal = ({ area, isOpen, onClose, onUpdate, allCleaners, assignedCleanerIds }) => {
    const [selectedCleanerIds, setSelectedCleanerIds] = useState(assignedCleanerIds || []);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setSelectedCleanerIds(assignedCleanerIds || []);
    }, [assignedCleanerIds]);

    if (!isOpen || !area) return null;

    const handleCleanerToggle = (cleanerId) => {
        setSelectedCleanerIds(prev =>
            prev.includes(cleanerId) ? prev.filter(id => id !== cleanerId) : [...prev, cleanerId]
        );
    };

    const handleSaveAssignments = async () => {
        setIsSubmitting(true);
        setError('');

        try {
            // First, remove all existing assignments for this area to handle unassignments
            const { error: deleteError } = await supabase
                .from('area_assignments')
                .delete()
                .eq('area_id', area.id);

            if (deleteError) throw deleteError;

            // Now, insert the new set of assignments
            if (selectedCleanerIds.length > 0) {
                const newAssignments = selectedCleanerIds.map(userId => ({
                    area_id: area.id,
                    user_id: userId,
                    // company_id can be useful for RLS policies
                    company_id: area.zones.sites.company_id
                }));

                const { error: insertError } = await supabase
                    .from('area_assignments')
                    .insert(newAssignments);

                if (insertError) throw insertError;
            }
            onUpdate(); // Refresh the main dashboard
            onClose();
        } catch (err) {
            setError('Failed to save assignments. Please try again.');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full m-4 z-50" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b">
                    <h3 className="text-xl font-bold">Assign Cleaners to: {area.name}</h3>
                    <p className="text-sm text-gray-500">{area.zones.sites.name} &gt; {area.zones.name}</p>
                </div>
                <div className="p-6 space-y-3" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    <h4 className="font-semibold">Available Cleaners</h4>
                    {allCleaners.length > 0 ? (
                        allCleaners.map(cleaner => (
                            <div key={cleaner.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100">
                                <label htmlFor={`cleaner-${cleaner.id}`} className="flex-grow cursor-pointer">{cleaner.full_name}</label>
                                <input
                                    type="checkbox"
                                    id={`cleaner-${cleaner.id}`}
                                    checked={selectedCleanerIds.includes(cleaner.id)}
                                    onChange={() => handleCleanerToggle(cleaner.id)}
                                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">No cleaners available in this company.</p>
                    )}
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-b-lg">
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    <button onClick={onClose} className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300">
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveAssignments}
                        disabled={isSubmitting}
                        className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Saving...' : 'Save Assignments'}
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Main Supervisor Dashboard Component ---
export default function SupervisorDashboard({ profile }) {
    const [zones, setZones] = useState([]);
    const [cleaners, setCleaners] = useState([]);
    const [assignments, setAssignments] = useState({}); // { area_id: [user_id, ...], ... }
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedArea, setSelectedArea] = useState(null);

    const fetchData = useCallback(async () => {
        if (!profile) return;
        try {
            setLoading(true);
            setError(null);

            // 1. Get zones assigned to the supervisor
            const { data: assignedZones, error: zonesError } = await supabase
                .from('zone_assignments')
                .select('zones(*, sites(*))')
                .eq('user_id', profile.id);
            if (zonesError) throw zonesError;

            const supervisorZones = assignedZones.map(z => z.zones);
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

            // Group areas by zone_id
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

            // 3. Get all cleaners in the company
            const { data: cleanersData, error: cleanersError } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('company_id', profile.company_id)
                .eq('role', 'cleaner');
            if (cleanersError) throw cleanersError;
            setCleaners(cleanersData || []);

            // 4. Get all current area assignments for the areas in the supervisor's zones
            const areaIds = areasData.map(a => a.id);
            if (areaIds.length > 0) {
                 const { data: assignmentData, error: assignmentError } = await supabase
                    .from('area_assignments')
                    .select('area_id, user_id')
                    .in('area_id', areaIds);
                 if (assignmentError) throw assignmentError;

                 const assignmentsByArea = (assignmentData || []).reduce((acc, assign) => {
                     if (!acc[assign.area_id]) acc[assign.area_id] = [];
                     acc[assign.area_id].push(assign.user_id);
                     return acc;
                 }, {});
                 setAssignments(assignmentsByArea);
            }

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

    const getCleanerName = (id) => cleaners.find(c => c.id === id)?.full_name || 'Unknown Cleaner';

    if (loading) return <div className="p-6">Loading dashboard...</div>;
    if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

    return (
        <>
            <div className="p-6 bg-gray-50 min-h-screen">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Area & Staff Management</h2>
                <div className="space-y-8">
                    {zones.length > 0 ? zones.map(zone => (
                        <div key={zone.id} className="bg-white p-4 rounded-lg shadow-md border">
                            <h3 className="text-xl font-semibold mb-1">{zone.name}</h3>
                            <p className="text-sm text-gray-500 mb-4">Site: {zone.sites.name}</p>
                            <div className="space-y-4">
                                {zone.areas.length > 0 ? zone.areas.map(area => (
                                    <div key={area.id} className="border rounded-md p-4 bg-gray-50">
                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold text-gray-800">{area.name}</p>
                                            <button 
                                                onClick={() => setSelectedArea(area)}
                                                className="bg-blue-500 text-white py-1 px-3 text-sm rounded-md hover:bg-blue-600"
                                            >
                                                Manage Assignments
                                            </button>
                                        </div>
                                        <div className="mt-2 pl-4 border-l-2">
                                            <h5 className="text-xs font-bold text-gray-500 uppercase mb-1">Assigned Cleaners</h5>
                                            {(assignments[area.id] && assignments[area.id].length > 0) ? (
                                                <ul className="list-disc pl-5 space-y-1">
                                                    {assignments[area.id].map(cleanerId => (
                                                        <li key={cleanerId} className="text-sm text-gray-700">{getCleanerName(cleanerId)}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-xs text-gray-500 italic">No cleaners assigned.</p>
                                            )}
                                        </div>
                                    </div>
                                )) : (
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

            <AreaAssignmentModal
                area={selectedArea ? { ...selectedArea, zones: zones.find(z => z.id === selectedArea.zone_id) } : null}
                isOpen={!!selectedArea}
                onClose={() => setSelectedArea(null)}
                onUpdate={fetchData}
                allCleaners={cleaners}
                assignedCleanerIds={selectedArea ? assignments[selectedArea.id] : []}
            />
        </>
    );
}

