import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import TaskDetailModal from '../components/modals/TaskDetailModal'; // Import the new modal

// TaskCard is now a button to trigger the modal
const TaskCard = ({ task, onSelectTask }) => (
  <button
    onClick={() => onSelectTask(task)}
    className="bg-white p-4 rounded-lg shadow-md border border-gray-200 text-left hover:shadow-lg hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <h4 className="font-bold text-lg text-gray-800">{task.job_templates?.name || 'Unnamed Task'}</h4>
    <p className="text-sm text-gray-600">Site: {task.sites?.name}</p>
    <p className="text-sm text-gray-600">Zone: {task.zones?.name}</p>
    <p className="text-sm text-gray-600">Area: {task.areas?.name}</p>
    <div className="mt-3 pt-3 border-t">
        <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${
            task.status === 'completed' || task.status === 'verified' ? 'bg-green-100 text-green-800' :
            task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
        }`}>
            {task.status ? task.status.replace('_', ' ') : 'pending'}
        </span>
    </div>
  </button>
);

export default function SupervisorDashboard({ profile }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for managing the selected task and modal visibility
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchSupervisorData = useCallback(async () => {
    // ... (rest of the fetch function is unchanged)
    if (!profile) return;

    try {
      setLoading(true);
      setError(null);

      const { data: assignedZones, error: zonesError } = await supabase
        .from('zone_assignments')
        .select('zone_id')
        .eq('user_id', profile.id);

      if (zonesError) throw zonesError;
      
      const zoneIds = assignedZones.map(z => z.zone_id);

      if (zoneIds.length === 0) {
        setTasks([]);
        setLoading(false);
        return;
      }

      const { data: taskData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id,
          status,
          job_templates ( name, description ),
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
    <>
      <div className="p-6 bg-gray-50 min-h-screen">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Supervisor Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tasks.length > 0 ? (
            tasks.map(task => <TaskCard key={task.id} task={task} onSelectTask={setSelectedTask} />)
          ) : (
            <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 bg-white p-6 rounded-lg shadow-md text-center">
              <p className="text-gray-600">No tasks found for your assigned zones.</p>
            </div>
          )}
        </div>
      </div>

      {/* Render the modal when a task is selected */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </>
  );
}

