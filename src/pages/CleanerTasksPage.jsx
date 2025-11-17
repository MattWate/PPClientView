// src/pages/CleanerTasksPage.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export default function CleanerTasksPage({ profile }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completingTaskId, setCompletingTaskId] = useState(null);

  const fetchTasks = async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);
      setError(null);

      // FIXED: Changed the select query to properly fetch job_templates
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id,
          status,
          created_at,
          job_templates (
            description
          ),
          areas (
            name,
            zones (
              name,
              sites (
                name
              )
            )
          )
        `)
        .eq('assigned_to', profile.id)
        .in('status', ['assigned', 'in_progress'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [profile?.id]);

  const handleCompleteTask = async (taskId) => {
    try {
      setCompletingTaskId(taskId);
      
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'completed', 
          completed_by: profile.id, 
          completed_at: new Date().toISOString() 
        })
        .eq('id', taskId);

      if (error) throw error;

      // Remove the completed task from the list
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error completing task:', error);
      setError(error.message);
    } finally {
      setCompletingTaskId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800 font-semibold">Error</p>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">My Assigned Tasks</h2>
        <p className="text-gray-600">Complete your tasks by marking them as done</p>
      </div>

      {tasks.length > 0 ? (
        <div className="space-y-4">
          {tasks.map(task => {
            const siteName = task.areas?.zones?.sites?.name || 'Unknown Site';
            const zoneName = task.areas?.zones?.name || 'Unknown Zone';
            const areaName = task.areas?.name || 'Unknown Area';
            // FIXED: Get description from job_templates instead of title
            const taskDescription = task.job_templates?.description || 'Unnamed Task';
            const isCompleting = completingTaskId === task.id;

            return (
              <div key={task.id} className="bg-white p-5 rounded-lg shadow-md border-l-4 border-green-500">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      {taskDescription}
                    </h3>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                      <span className="flex items-center">
                        <i className="fas fa-building text-gray-400 mr-1"></i>
                        {siteName}
                      </span>
                      <span className="text-gray-400">›</span>
                      <span className="flex items-center">
                        <i className="fas fa-map-marker-alt text-gray-400 mr-1"></i>
                        {zoneName}
                      </span>
                      <span className="text-gray-400">›</span>
                      <span className="flex items-center">
                        <i className="fas fa-door-open text-gray-400 mr-1"></i>
                        {areaName}
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        task.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {task.status === 'assigned' ? 'Assigned' : 'In Progress'}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleCompleteTask(task.id)}
                    disabled={isCompleting}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center justify-center gap-2"
                  >
                    {isCompleting ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Completing...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check-circle"></i>
                        Mark Complete
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <i className="fas fa-check-circle text-6xl text-green-400 mb-4"></i>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">All Caught Up!</h3>
          <p className="text-gray-600">You have no assigned tasks at the moment.</p>
        </div>
      )}
    </div>
  );
}
