import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';

export default function TaskDetailModal({ task, isOpen, onClose, onTaskUpdate, profile }) {
  const [cleaners, setCleaners] = useState([]);
  const [selectedCleanerId, setSelectedCleanerId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch available cleaners when the modal opens for a new task
  useEffect(() => {
    const fetchCleaners = async () => {
      if (!isOpen || !task || !profile) return;

      try {
        setError('');
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('company_id', profile.company_id)
          .eq('role', 'cleaner')
          .eq('is_active', true);

        if (error) throw error;
        setCleaners(data || []);
      } catch (err) {
        setError('Failed to load cleaners.');
        console.error('Error fetching cleaners:', err);
      }
    };

    fetchCleaners();
  }, [isOpen, task, profile]);

  const handleAssignTask = async () => {
    if (!selectedCleanerId) {
      setError('Please select a cleaner to assign.');
      return;
    }
    setIsSubmitting(true);
    setError('');

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          assigned_to: selectedCleanerId,
          status: 'assigned',
        })
        .eq('id', task.id);

      if (error) throw error;

      // Notify the parent component to refresh its data
      if (onTaskUpdate) {
        onTaskUpdate();
      }
      onClose(); // Close the modal on success
    } catch (err) {
      setError('Failed to assign task. Please try again.');
      console.error('Error assigning task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };


  if (!isOpen || !task) {
    return null;
  }

  const siteName = task.sites?.name || 'N/A';
  const zoneName = task.zones?.name || 'N/A';
  const areaName = task.areas?.name || 'N/A';
  const taskTitle = task.job_templates?.name || 'Unnamed Task';
  const taskDescription = task.job_templates?.description || 'No description provided.';
  const status = task.status ? task.status.replace('_', ' ') : 'pending';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity" onClick={onClose}>
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{taskTitle}</h2>
            <p className="text-sm text-gray-500">
              {siteName} &gt; {zoneName} &gt; {areaName}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-700">Status</h4>
            <p className="capitalize">{status}</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700">Description</h4>
            <p className="text-gray-600">{taskDescription}</p>
          </div>
        </div>

        {/* --- NEW: Assignment Section --- */}
        {task.status === 'pending' && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-semibold text-gray-700 mb-2">Assign to Cleaner</h4>
            <div className="flex items-center space-x-2">
              <select
                value={selectedCleanerId}
                onChange={(e) => setSelectedCleanerId(e.target.value)}
                className="flex-grow w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                aria-label="Select a cleaner"
              >
                <option value="" disabled>Select a cleaner...</option>
                {cleaners.map((cleaner) => (
                  <option key={cleaner.id} value={cleaner.id}>{cleaner.full_name}</option>
                ))}
              </select>
              <button
                onClick={handleAssignTask}
                disabled={isSubmitting || !selectedCleanerId}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

        <div className="mt-8 pt-4 border-t text-right">
            <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
}

