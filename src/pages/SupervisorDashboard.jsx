// src/pages/SupervisorDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

// A reusable card component for displaying task information
const TaskCard = ({ task }) => (
  <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
    <h4 className="font-bold text-lg text-gray-800">{task.job_templates?.name || 'Unnamed Task'}</h4>
    <p className="text-sm text-gray-600">Site: {task.sites?.name}</p>
    <p className="text-sm text-gray-600">Zone: {task.zones?.name}</p>
    <p className="text-sm text-gray-600">Area: {task.areas?.name}</p>
    <div className="mt-3 pt-3 border-t">
        <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${
            task.status === 'completed' ? 'bg-green-100 text-green-800' :
            task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
        }`}>
            {task.status ? task.status.replace('_', ' ') : 'pending'}
        </span>
    </div>
  </div>
);


export default function SupervisorDashboard({ profile }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSupervisorData = useCallback(async () => {
    if (!profile) return;

    try {
      setLoading(true);
      setError(null);

      // --- THIS IS THE FIX ---
      // Changed 'supervisor_assignments' to the correct table name 'zone_assignments'
      const { data: assignedZones, error: zonesError } = await supabase
        .from('zone_assignments')
        .select('zone_id')
        .eq('user_id', profile.id);

      if (zonesError) throw zonesError;
      
      const zoneIds = assignedZones.map(z => z.zone_id);

      if (zoneIds.length === 0) {
        setTasks([]);
        setLoading(false); // Make sure to stop loading
        return;
      }

      const { data: taskData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id,
          status,
          job_templates ( name ),
          sites ( name ),
          zones ( name ),
          areas ( name )
        `)
        .in('zone_id', zoneIds);

      if (tasksError) throw tasksError;
      
      setTasks(taskData || []);

    } catch (error) {
      console.error("Error fetching supervisor data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchSupervisorData();
  }, [fetchSupervisorData]);

  if (loading) {
    return <div className="p-6"><p>Loading dashboard...</p></div>;
  }

  if (error) {
    return <div className="p-6 text-red-600"><p>Error: {error}</p></div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Supervisor Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tasks.length > 0 ? (
          tasks.map(task => <TaskCard key={task.id} task={task} />)
        ) : (
          <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 bg-white p-6 rounded-lg shadow-md text-center">
            <p className="text-gray-600">No tasks found for your assigned zones.</p>
          </div>
        )}
      </div>
    </div>
  );
}

