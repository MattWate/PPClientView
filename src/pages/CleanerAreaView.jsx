import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient.js';
import { useAuth } from '../contexts/AuthContext.jsx';

// A simple loading component
const LoadingSpinner = () => (
    <div className="flex justify-center items-center p-8">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
);

export default function CleanerAreaView() {
  const { areaId } = useParams();
  const { profile } = useAuth(); // We need the logged-in cleaner's profile

  const [area, setArea] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!areaId || !profile) return;

    try {
      setLoading(true);
      setError('');

      // Fetch area details
      const { data: areaData, error: areaError } = await supabase
        .from('areas')
        .select('name, zones(name, sites(name))')
        .eq('id', areaId)
        .single();
      
      if (areaError) throw areaError;
      setArea(areaData);

      // Fetch tasks for this cleaner in this area
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('id, status, job_templates(description)')
        .eq('area_id', areaId)
        .eq('assigned_to', profile.id)
        .in('status', ['assigned', 'in_progress']); // Only show tasks they can action

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

    } catch (err) {
      setError('Failed to load area data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [areaId, profile]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCompleteTask = async (taskId) => {
    try {
        // Optimistically update the UI
        setTasks(currentTasks => currentTasks.filter(t => t.id !== taskId));

        const { error } = await supabase
            .from('tasks')
            .update({
                status: 'completed',
                completed_by: profile.id,
                completed_at: new Date().toISOString(),
            })
            .eq('id', taskId);

        if (error) {
            // If the update fails, revert the UI and show an error
            setError('Failed to update task. Please try again.');
            fetchData(); // Re-fetch to get the correct state
            throw error;
        }
    } catch (err) {
        console.error('Error completing task:', err);
    }
  };


  if (loading) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <LoadingSpinner />
            <p className="text-gray-600">Loading tasks...</p>
        </div>
    );
  }
  
  if (error) {
     return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        <div className="p-8">
          <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
            {area?.zones?.sites?.name || 'Site'} &gt; {area?.zones?.name || 'Zone'}
          </div>
          <h1 className="block mt-1 text-2xl leading-tight font-bold text-black">
            {area?.name || 'Area Tasks'}
          </h1>
          <p className="mt-4 text-gray-500">Your assigned tasks for this area are listed below.</p>
          
          <div className="mt-6 space-y-4">
            {tasks.length > 0 ? tasks.map(task => (
              <div key={task.id} className="p-4 border rounded-lg flex justify-between items-center">
                <p className="text-gray-900 font-medium">{task.job_templates?.description || 'Task'}</p>
                <button 
                  onClick={() => handleCompleteTask(task.id)}
                  className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
                >
                  Complete
                </button>
              </div>
            )) : (
              <div className="text-center p-4 border rounded-lg bg-gray-50">
                <p className="text-gray-600">You have no pending tasks in this area.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

