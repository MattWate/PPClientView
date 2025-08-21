// src/pages/Assignments.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export default function AssignmentsPage({ profile }) {
  const [sites, setSites] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedZone, setSelectedZone] = useState(null);
  const [zoneAssignments, setZoneAssignments] = useState([]);

  const fetchData = async () => {
    if (!profile) return;
    try {
      setLoading(true);
      const { data: sitesData, error: sitesError } = await supabase
        .from('sites')
        .select('*, zones(*, zone_assignments(user_id))')
        .eq('company_id', profile.company_id);
      if (sitesError) throw sitesError;
      setSites(sitesData);

      const { data: staffData, error: staffError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('company_id', profile.company_id)
        .in('role', ['supervisor', 'cleaner']);
      if (staffError) throw staffError;
      setStaff(staffData);

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  const handleZoneSelect = (zone) => {
    setSelectedZone(zone);
    setZoneAssignments(zone.zone_assignments.map(za => za.user_id));
  };

  const handleAssignmentChange = (userId) => {
    setZoneAssignments(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSaveChanges = async () => {
    try {
      // Delete all existing assignments for the selected zone
      const { error: deleteError } = await supabase
        .from('zone_assignments')
        .delete()
        .eq('zone_id', selectedZone.id);
      if (deleteError) throw deleteError;

      // Insert the new assignments
      if (zoneAssignments.length > 0) {
        const newAssignments = zoneAssignments.map(userId => ({
          zone_id: selectedZone.id,
          user_id: userId
        }));
        const { error: insertError } = await supabase
          .from('zone_assignments')
          .insert(newAssignments);
        if (insertError) throw insertError;
      }
      
      fetchData(); // Refresh all data
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) return <p>Loading data...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Select a Zone</h3>
        <div className="space-y-4">
          {sites.map(site => (
            <div key={site.id}>
              <h4 className="font-semibold text-gray-600">{site.name}</h4>
              <ul className="pl-4 mt-2 space-y-1">
                {site.zones.map(zone => (
                  <li key={zone.id}>
                    <button 
                      onClick={() => handleZoneSelect(zone)}
                      className={`w-full text-left p-2 rounded-md ${selectedZone?.id === zone.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
                    >
                      {zone.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md">
        {selectedZone ? (
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Assign Staff to "{selectedZone.name}"</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Supervisors</h4>
                <div className="space-y-2">
                  {staff.filter(s => s.role === 'supervisor').map(user => (
                    <label key={user.id} className="flex items-center space-x-3">
                      <input type="checkbox" checked={zoneAssignments.includes(user.id)} onChange={() => handleAssignmentChange(user.id)} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                      <span>{user.full_name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Cleaners</h4>
                <div className="space-y-2">
                  {staff.filter(s => s.role === 'cleaner').map(user => (
                    <label key={user.id} className="flex items-center space-x-3">
                      <input type="checkbox" checked={zoneAssignments.includes(user.id)} onChange={() => handleAssignmentChange(user.id)} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                      <span>{user.full_name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6">
              <button onClick={handleSaveChanges} className="w-full py-2 px-4 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Save Changes</button>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Please select a zone from the left to manage assignments.</p>
        )}
      </div>
    </div>
  );
}
