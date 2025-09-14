import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';

export default function TaskDetailModal({ task, isOpen, onClose, onTaskUpdate, profile }) {
  const [cleaners, setCleaners] = useState([]);
  const [selectedCleanerId, setSelectedCleanerId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch available cleaners when the modal is opened
  useEffect(() => {
    const fetchCleaners = async () => {
      if (!isOpen || !task || !profile) return;
      // Only fetch cleaners if the task is in a state that can be assigned
      if (task.status !== 'pending' && task.status !== 'assigned') return;

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
        // Set the default selected cleaner if the task is already assigned
        if (task.assigned_to) {
          setSelectedCleanerId(task.assigned_to);
        } else {
          setSelectedCleanerId('');
        }
      } catch (err) {
        setError('Failed to load cleaners.');
        console.error('Error fetching cleaners:', err);
      }
    };

    fetchCleaners();
  }, [isOpen, task, profile]);

  const handleAction = async (actionType) => {
    setIsSubmitting(true);
    setError('');
    
    let updateData = {};
    const now = new Date().toISOString();

    switch (actionType) {
      case 'assign':
        if (!selectedCleanerId) {
          setError('Please select a cleaner to assign.');
          setIsSubmitting(false);
          return;
        }
        updateData = { assigned_to: selectedCleanerId, status: 'assigned' };
        break;
      
      case 'verify':
        updateData = { status: 'verified', verified_by: profile.id, verified_at: now };
        break;
      
      case 'complete_and_verify':
        updateData = { 
            status: 'verified', 
            completed_by: profile.id, // Supervisor completes it
            completed_at: now,
            verified_by: profile.id, // Supervisor also verifies it
            verified_at: now 
        };
        break;
        
      default:
        setIsSubmitting(false);
        return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', task.id);

      if (error) throw error;

      if (onTaskUpdate) {
        onTaskUpdate();
      }
      onClose();
    } catch (err) {
      setError(`Failed to ${actionType.replace('_', ' ')} task. Please try again.`);
      console.error(`Error during ${actionType}:`, err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !task) return null;

  const siteName = task.sites?.name || 'N/A';
  const zoneName = task.zones?.name || 'N/A';
  const areaName = task.areas?.name || 'N/A';
  const taskTitle = task.job_templates?.description || 'Unnamed Task';
  const status = task.status ? task.status.replace('_', ' ') : 'pending';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity" onClick={onClose}>
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{taskTitle}</h2>
            <p className="text-sm text-gray-500">
              {siteName} &gt; {zoneName} &gt; {areaName}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <h4 className="font-semibold text-gray-700">Status</h4>
            <p className="capitalize">{status}</p>
          </div>
        </div>
        
        {/* --- Action Buttons --- */}
        <div className="pt-4 border-t space-y-4">
            {/* Assign Section */}
            {(task.status === 'pending' || task.status === 'assigned') && (
                <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Assign to Cleaner</h4>
                    <div className="flex items-center space-x-2">
                        <select
                            value={selectedCleanerId}
                            onChange={(e) => setSelectedCleanerId(e.target.value)}
                            className="flex-grow w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        >
                            <option value="" disabled>Select a cleaner...</option>
                            {cleaners.map((cleaner) => (
                            <option key={cleaner.id} value={cleaner.id}>{cleaner.full_name}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => handleAction('assign')}
                            disabled={isSubmitting || !selectedCleanerId}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Assigning...' : 'Assign'}
                        </button>
                    </div>
                </div>
            )}

            {/* Verification Section */}
            {task.status === 'completed' && (
                <button
                    onClick={() => handleAction('verify')}
                    disabled={isSubmitting}
                    className="w-full py-2 px-4 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                    {isSubmitting ? 'Verifying...' : 'Verify Task'}
                </button>
            )}

            {/* One-Step Completion Section */}
            {(task.status === 'pending' || task.status === 'assigned') && (
                 <button
                    onClick={() => handleAction('complete_and_verify')}
                    disabled={isSubmitting}
                    className="w-full py-2 px-4 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 disabled:opacity-50"
                >
                    {isSubmitting ? 'Processing...' : 'Complete & Verify Task'}
                </button>
            )}
        </div>

        {error && <p className="text-sm text-red-600 mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
}

