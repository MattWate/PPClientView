import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// --- Supabase Client Initialization ---
// NOTE: You must replace these with your actual Supabase project URL and anon key
const SUPABASE_URL = 'https://clsirugxuvdyxdnlwqqk.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsc2lydWd4dXZkeXhkbmx3cXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNDQ2MzgsImV4cCI6MjA3MDkyMDYzOH0.gow7e2mHP_Qa0S0TsCriCfkKZ8jFTXO6ahp0mCstmoU'; // Replace with your Supabase anon key
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// --- Task Detail Modal Component ---
// This modal opens when a supervisor clicks on a task card.
const TaskDetailModal = ({ task, isOpen, onClose, onTaskUpdate, profile }) => {
    const [cleaners, setCleaners] = useState([]);
    const [selectedCleanerId, setSelectedCleanerId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Fetch available cleaners when the modal opens for reassignment
    useEffect(() => {
        if (isOpen && profile) {
            const fetchCleaners = async () => {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .eq('company_id', profile.company_id)
                    .eq('role', 'cleaner');
                if (error) {
                    console.error("Error fetching cleaners:", error);
                } else {
                    setCleaners(data || []);
                }
            };
            fetchCleaners();
        }
    }, [isOpen, profile]);

    // Reset state when the task changes
    useEffect(() => {
        if (task) {
            setSelectedCleanerId('');
            setError('');
        }
    }, [task]);

    if (!isOpen || !task) return null;

    const handleVerifyTask = async () => {
        setIsSubmitting(true);
        setError('');
        const { error } = await supabase
            .from('tasks')
            .update({ status: 'verified', verified_by: profile.id, verified_at: new Date().toISOString() })
            .eq('id', task.id);

        if (error) {
            setError('Failed to verify task. Please try again.');
            console.error(error);
        } else {
            onTaskUpdate(); // Refresh the dashboard
            onClose();
        }
        setIsSubmitting(false);
    };

    const handleReassignTask = async () => {
        if (!selectedCleanerId) {
            setError('Please select a cleaner to reassign the task to.');
            return;
        }
        setIsSubmitting(true);
        setError('');
        const { error } = await supabase
            .from('tasks')
            .update({ assigned_to: selectedCleanerId, status: 'assigned' })
            .eq('id', task.id);

        if (error) {
            setError('Failed to reassign task. Please try again.');
        } else {
            onTaskUpdate();
            onClose();
        }
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full m-4 z-50" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b">
                    <h3 className="text-xl font-bold">{task.job_templates?.description || 'Task Details'}</h3>
                    <p className="text-sm text-gray-600">
                        {task.sites?.name} &gt; {task.zones?.name} &gt; {task.areas?.name}
                    </p>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <span className="font-semibold">Status: </span>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${
                            task.status === 'completed' || task.status === 'verified' ? 'bg-green-100 text-green-800' :
                            task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                            {task.status ? task.status.replace('_', ' ') : 'pending'}
                        </span>
                    </div>

                    {/* Verification Section */}
                    {task.status === 'completed' && (
                        <div className="p-4 bg-blue-50 rounded-md">
                            <p className="text-blue-800 font-semibold mb-2">This task is ready for verification.</p>
                            <button
                                onClick={handleVerifyTask}
                                disabled={isSubmitting}
                                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Verifying...' : 'Verify & Close Task'}
                            </button>
                        </div>
                    )}

                    {/* Reassignment Section */}
                    <div className="pt-4 border-t">
                        <h4 className="font-semibold mb-2">Reassign Task</h4>
                        <select
                            value={selectedCleanerId}
                            onChange={(e) => setSelectedCleanerId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        >
                            <option value="">Select a Cleaner...</option>
                            {cleaners.map(cleaner => (
                                <option key={cleaner.id} value={cleaner.id}>{cleaner.full_name}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleReassignTask}
                            disabled={isSubmitting || !selectedCleanerId}
                            className="w-full mt-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Reassigning...' : 'Reassign'}
                        </button>
                    </div>

                    {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
                </div>
                <div className="flex justify-end p-4 bg-gray-50 rounded-b-lg">
                    <button onClick={onClose} className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Task Card Component ---
const TaskCard = ({ task, onSelectTask }) => (
  <button
    onClick={() => onSelectTask(task)}
    className="bg-white p-4 rounded-lg shadow-md border border-gray-200 text-left w-full h-full flex flex-col justify-between hover:shadow-lg hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <div>
        <h4 className="font-bold text-lg text-gray-800">{task.job_templates?.description || 'Unnamed Task'}</h4>
        <p className="text-sm text-gray-600">Site: {task.sites?.name || 'N/A'}</p>
        <p className="text-sm text-gray-600">Zone: {task.zones?.name || 'N/A'}</p>
        <p className="text-sm text-gray-600">Area: {task.areas?.name || 'N/A'}</p>
    </div>
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


// --- Main Supervisor Dashboard Component ---
export default function SupervisorDashboard({ profile }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchSupervisorData = useCallback(async () => {
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
          assigned_to,
          job_templates ( description ), 
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

      <TaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onTaskUpdate={fetchSupervisorData}
        profile={profile}
      />
    </>
  );
}

