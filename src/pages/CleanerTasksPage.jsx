// src/pages/CleanerTasksPage.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export default function CleanerTasksPage({ profile }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!profile) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('tasks')
          .select('*, areas(name, zones(name, sites(name)))')
          .eq('assigned_to', profile.id)
          .eq('status', 'assigned');

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

  const handleCompleteTask = async (taskId) => {
    // In a real app, this would open the camera to scan a QR code.
    // For this prototype, we'll just mark the task as complete.
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'completed', completed_by: profile.id, completed_at: new Date() })
        .eq('id', taskId);

      if (error) throw error;
      // Refresh the task list
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) return <p>Loading your tasks...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">My Assigned Tasks</h2>
      <div className="space-y-4">
        {tasks.length > 0 ? (
          tasks.map(task => (
            <div key={task.id} className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
              <div>
                <p className="font-semibold text-lg">{task.title}</p>
                <p className="text-sm text-gray-600">
                  {task.areas.sites.name} > {task.areas.zones.name} > {task.areas.name}
                </p>
              </div>
              <button onClick={() => handleCompleteTask(task.id)} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">
                Scan to Complete
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-500">You have no assigned tasks.</p>
        )}
      </div>
    </div>
  );
}
