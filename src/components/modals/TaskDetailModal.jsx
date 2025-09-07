import React from 'react';

export default function TaskDetailModal({ task, isOpen, onClose }) {
  // If the modal isn't open or there's no task, render nothing.
  if (!isOpen || !task) {
    return null;
  }

  // Defensive rendering for nested data
  const siteName = task.sites?.name || 'N/A';
  const zoneName = task.zones?.name || 'N/A';
  const areaName = task.areas?.name || 'N/A';
  const taskTitle = task.job_templates?.name || 'Unnamed Task';
  const taskDescription = task.job_templates?.description || 'No description provided.';
  const status = task.status ? task.status.replace('_', ' ') : 'pending';

  return (
    // Modal backdrop
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity"
      onClick={onClose}
    >
      {/* Modal container */}
      <div
        className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()} // Prevent click inside from closing the modal
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{taskTitle}</h2>
            <p className="text-sm text-gray-500">
              {siteName} &gt; {zoneName} &gt; {areaName}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>

        {/* Task Details */}
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

        {/* Action buttons will go here in the next step */}
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
