import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import TaskDetailModal from '../components/modals/TaskDetailModal.jsx';

// A simple loading component
const LoadingSpinner = () => (
    <div className="flex justify-center items-center p-8">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
);

export default function SupervisorAreaView() {
  const { areaId } = useParams();
  const { profile } = useAuth();

  const [area, setArea] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchData = useCallback(async () => {
    if (!areaId || !profile) return;

    try {
      setLoading(true);
      setError('');

      // Fetch area details (same as cleaner view)
      const { data: areaData, error: areaError } = await supabase
        .from('areas')
        .select('name, zones(name, sites(name))')
        .eq('id', areaId)
        .single();
      
      if (areaError) throw areaError;
      setArea(areaData);

      // Fetch ALL tasks for this area, and join profile data for assignees
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*, job_templates(description), profiles:assigned_to(full_name)')
        .eq('area_id', areaId);

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
  
  const getStatusColor = (status) => {
    switch (status) {
        case 'verified':
        case 'completed':
            return 'bg-green-100 text-green-800';
        case 'in_progress':
        case 'assigned':
            return 'bg-yellow-100 text-yellow-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
  }


  if (loading) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <LoadingSpinner />
            <p className="text-gray-600">Loading area tasks...</p>
        </div>
    );
  }
  
  if (error) {
     return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 text-red-600">{error}</div>;
  }

  return (
    <>
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-8">
              <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
                {area?.zones?.sites?.name || 'Site'} &gt; {area?.zones?.name || 'Zone'}
              </div>
              <h1 className="block mt-1 text-2xl leading-tight font-bold text-black">
                {area?.name || 'Area Overview'}
              </h1>
              <p className="mt-4 text-gray-500">All tasks for this area are listed below. Click a task to manage it.</p>
              
              <div className="mt-6">
                <ul className="space-y-3">
                  {tasks.length > 0 ? tasks.map(task => (
                    <li key={task.id}>
                       <button 
                         onClick={() => setSelectedTask(task)}
                         className="w-full text-left p-4 border rounded-lg flex justify-between items-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                       >
                         <div>
                            <p className="text-gray-900 font-medium">{task.job_templates?.description || 'Task'}</p>
                            <p className="text-sm text-gray-500">
                                Assigned to: {task.profiles?.full_name || 'Unassigned'}
                            </p>
                         </div>
                         <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${getStatusColor(task.status)}`}>
                            {task.status ? task.status.replace('_', ' ') : 'Pending'}
                         </span>
                       </button>
                    </li>
                  )) : (
                    <div className="text-center p-4 border rounded-lg bg-gray-50">
                      <p className="text-gray-600">There are no tasks for this area.</p>
                    </div>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <TaskDetailModal
            task={selectedTask}
            isOpen={!!selectedTask}
            onClose={() => setSelectedTask(null)}
            onTaskUpdate={fetchData} // Pass the refresh function
            profile={profile}
      />
    </>
  );
}

