// src/pages/SupervisorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export default function SupervisorDashboard({ profile }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!profile) return;
      try {
        setLoading(true);
        // This is a placeholder; a real implementation would fetch tasks for the supervisor's zones.
        const { data, error } = await supabase
          .from('tasks')
          .select('*, areas(name, zones(name, sites(name)))')
          .eq('company_id', profile.company_id)
          .in('status', ['pending', 'assigned', 'completed']);

        if (error) throw error;
        setTasks(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [profile]);

  if (loading) return <p>Loading tasks...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Task Dashboard</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs text-gray-500 uppercase border-b">
              <th className="py-3 px-4">Task</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr key={task.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">{task.title}</td>
                <td className="py-3 px-4 text-sm">{task.areas.sites.name} > {task.areas.zones.name} > {task.areas.name}</td>
                <td className="py-3 px-4 capitalize">{task.status}</td>
                <td className="py-3 px-4 space-x-2">
                  <button className="text-sm text-blue-600 hover:underline">Assign</button>
                  <button className="text-sm text-green-600 hover:underline">Complete for Cleaner</button>
                  <button className="text-sm text-purple-600 hover:underline">Verify</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
