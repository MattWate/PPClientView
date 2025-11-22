// src/pages/CleanerTasksPage.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

// Task Completion Modal with Photo Upload
const TaskCompletionModal = ({ task, isOpen, onClose, onComplete, profile }) => {
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo must be less than 5MB');
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      let photoUrl = null;

      // Upload photo if provided
      if (photo) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${task.id}_${Date.now()}.${fileExt}`;
        const filePath = `task-photos/${profile.company_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('task-photos')
          .upload(filePath, photo);

        if (uploadError) {
          console.error('Photo upload error:', uploadError);
          // Continue without photo if upload fails
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('task-photos')
            .getPublicUrl(filePath);
          photoUrl = publicUrl;
        }
      }

      // Update task
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_by: profile.id,
          completed_at: new Date().toISOString(),
          photo_url: photoUrl,
        })
        .eq('id', task.id);

      if (updateError) throw updateError;

      onComplete(task.id);
      onClose();
    } catch (err) {
      console.error('Error completing task:', err);
      setError(err.message || 'Failed to complete task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setPhoto(null);
    setPhotoPreview(null);
    setNotes('');
    setError('');
    onClose();
  };

  if (!isOpen || !task) return null;

  const taskName = task.title || task.job_templates?.description || 'Cleaning Task';
  const siteName = task.areas?.zones?.sites?.name || 'Unknown Site';
  const zoneName = task.areas?.zones?.name || 'Unknown Zone';
  const areaName = task.areas?.name || 'Unknown Area';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b bg-green-50">
          <h3 className="text-xl font-bold text-green-800">Complete Task</h3>
          <p className="text-sm text-green-600 mt-1">{taskName}</p>
        </div>

        <div className="p-6 space-y-4">
          {/* Location Info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">
              <i className="fas fa-map-marker-alt mr-2 text-gray-400"></i>
              {siteName} › {zoneName} › {areaName}
            </p>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fas fa-camera mr-2"></i>
              Upload Photo (Optional)
            </label>
            
            {photoPreview ? (
              <div className="relative">
                <img 
                  src={photoPreview} 
                  alt="Task preview" 
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                {/* Camera capture (mobile) */}
                <label className="flex-1 cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 hover:bg-green-50 transition-colors">
                    <i className="fas fa-camera text-3xl text-gray-400 mb-2"></i>
                    <p className="text-sm text-gray-600">Take Photo</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
                
                {/* File picker */}
                <label className="flex-1 cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 hover:bg-green-50 transition-colors">
                    <i className="fas fa-image text-3xl text-gray-400 mb-2"></i>
                    <p className="text-sm text-gray-600">Choose File</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">Max 5MB. JPG, PNG supported.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 rounded-b-lg flex gap-3">
          <button
            onClick={resetAndClose}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 text-white bg-green-600 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Completing...
              </>
            ) : (
              <>
                <i className="fas fa-check mr-2"></i>
                Mark Complete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function CleanerTasksPage({ profile }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchTasks = async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          status,
          task_type,
          created_at,
          job_templates (
            id,
            description
          ),
          areas (
            id,
            name,
            zones (
              id,
              name,
              sites (
                id,
                name
              )
            )
          )
        `)
        .eq('assigned_to', profile.id)
        .in('status', ['assigned', 'pending'])
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

  const handleTaskCompleted = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  // Helper to get display name for a task
  const getTaskDisplayName = (task) => {
    // Priority: explicit title > job template description > fallback
    if (task.title && task.title !== 'Cleaning Task' && !task.title.startsWith('Standard Clean')) {
      return task.title;
    }
    if (task.job_templates?.description) {
      return task.job_templates.description;
    }
    if (task.title) {
      return task.title;
    }
    return 'Cleaning Task';
  };

  // Group tasks by site > zone > area for better organization
  const groupedTasks = tasks.reduce((acc, task) => {
    const siteName = task.areas?.zones?.sites?.name || 'Unassigned';
    const zoneName = task.areas?.zones?.name || 'Unassigned';
    const areaName = task.areas?.name || 'Unassigned';
    
    const key = `${siteName}|||${zoneName}|||${areaName}`;
    if (!acc[key]) {
      acc[key] = {
        site: siteName,
        zone: zoneName,
        area: areaName,
        areaId: task.areas?.id,
        tasks: []
      };
    }
    acc[key].tasks.push(task);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800 font-semibold">Error</p>
        <p className="text-red-600 text-sm">{error}</p>
        <button onClick={fetchTasks} className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
          <i className="fas fa-redo mr-2"></i>Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">My Tasks</h2>
            <p className="text-gray-600">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned to you
            </p>
          </div>
          <button 
            onClick={fetchTasks}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-3 rounded-full transition-colors"
            title="Refresh tasks"
          >
            <i className="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>

      {tasks.length > 0 ? (
        <div className="space-y-6">
          {Object.values(groupedTasks).map((group, groupIndex) => (
            <div key={groupIndex} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Location Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4">
                <div className="flex items-center gap-2 text-sm opacity-90 mb-1">
                  <i className="fas fa-building"></i>
                  <span>{group.site}</span>
                  <span className="opacity-50">›</span>
                  <i className="fas fa-map-marker-alt"></i>
                  <span>{group.zone}</span>
                </div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <i className="fas fa-door-open"></i>
                  {group.area}
                </h3>
                <p className="text-sm opacity-80 mt-1">
                  {group.tasks.length} task{group.tasks.length !== 1 ? 's' : ''} in this area
                </p>
              </div>

              {/* Tasks List */}
              <div className="divide-y divide-gray-100">
                {group.tasks.map(task => {
                  const taskName = getTaskDisplayName(task);
                  const isScheduled = task.task_type === 'scheduled';
                  const isAdHoc = task.task_type === 'ad_hoc';

                  return (
                    <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {taskName}
                            </h4>
                            {isAdHoc && (
                              <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                                Ad-hoc
                              </span>
                            )}
                            {isScheduled && (
                              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                                Scheduled
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            <i className="fas fa-clock mr-1"></i>
                            Assigned {new Date(task.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedTask(task)}
                          className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-5 rounded-lg shadow-md transition-colors flex items-center gap-2"
                        >
                          <i className="fas fa-check-circle"></i>
                          <span className="hidden sm:inline">Complete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="bg-green-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <i className="fas fa-check-circle text-5xl text-green-500"></i>
          </div>
          <h3 className="text-2xl font-bold text-gray-700 mb-2">All Caught Up!</h3>
          <p className="text-gray-600 max-w-sm mx-auto">
            You have no assigned tasks at the moment. Scan a QR code to see tasks for a specific area.
          </p>
        </div>
      )}

      {/* Task Completion Modal */}
      <TaskCompletionModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onComplete={handleTaskCompleted}
        profile={profile}
      />
    </div>
  );
}
