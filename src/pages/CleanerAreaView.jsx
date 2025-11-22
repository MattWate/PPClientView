// src/pages/CleanerAreaView.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient.js';
import { useAuth } from '../contexts/AuthContext.jsx';

// Task Completion Modal with Photo Upload
const TaskCompletionModal = ({ task, isOpen, onClose, onComplete, profile }) => {
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Reset state when modal opens/closes
    if (!isOpen) {
      setPhoto(null);
      setPhotoPreview(null);
      setError('');
    }
  }, [isOpen]);

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

      if (photo) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${task.id}_${Date.now()}.${fileExt}`;
        const filePath = `task-photos/${profile.company_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('task-photos')
          .upload(filePath, photo);

        if (uploadError) {
          console.error('Photo upload error:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('task-photos')
            .getPublicUrl(filePath);
          photoUrl = publicUrl;
        }
      }

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

  if (!isOpen || !task) return null;

  const taskName = task.title || task.job_templates?.description || 'Cleaning Task';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b bg-green-50">
          <h3 className="text-xl font-bold text-green-800">Complete Task</h3>
          <p className="text-sm text-green-600 mt-1">{taskName}</p>
        </div>

        <div className="p-6 space-y-4">
          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fas fa-camera mr-2"></i>
              Upload Photo (Optional)
            </label>
            
            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="Preview" className="w-full h-48 object-cover rounded-lg border" />
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
                <label className="flex-1 cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 hover:bg-green-50 transition-colors">
                    <i className="fas fa-camera text-3xl text-gray-400 mb-2"></i>
                    <p className="text-sm text-gray-600">Take Photo</p>
                  </div>
                  <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="hidden" />
                </label>
                <label className="flex-1 cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 hover:bg-green-50 transition-colors">
                    <i className="fas fa-image text-3xl text-gray-400 mb-2"></i>
                    <p className="text-sm text-gray-600">Choose File</p>
                  </div>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
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
          <button onClick={onClose} disabled={isSubmitting} className="flex-1 py-3 px-4 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 font-medium">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 py-3 px-4 text-white bg-green-600 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50">
            {isSubmitting ? <><i className="fas fa-spinner fa-spin mr-2"></i>Completing...</> : <><i className="fas fa-check mr-2"></i>Complete</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function CleanerAreaView() {
  const { areaId } = useParams();
  const navigate = useNavigate();
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

      // Fetch area details with type info
      const { data: areaData, error: areaError } = await supabase
        .from('areas')
        .select(`
          id, name, description, daily_cleaning_frequency,
          area_types(id, name),
          zones(id, name, sites(id, name))
        `)
        .eq('id', areaId)
        .single();
      
      if (areaError) throw areaError;
      setArea(areaData);

      // Fetch tasks assigned to this cleaner for this area
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id, title, description, status, task_type, created_at,
          job_templates(id, description)
        `)
        .eq('area_id', areaId)
        .eq('assigned_to', profile.id)
        .in('status', ['assigned', 'pending'])
        .order('created_at', { ascending: true });

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

  const handleTaskCompleted = (taskId) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const getTaskDisplayName = (task) => {
    if (task.title && task.title !== 'Cleaning Task' && !task.title.startsWith('Standard Clean')) {
      return task.title;
    }
    if (task.job_templates?.description) {
      return task.job_templates.description;
    }
    return task.title || 'Cleaning Task';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
        <p className="text-gray-600">Loading area tasks...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <i className="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Area</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={fetchData} className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700">
            <i className="fas fa-redo mr-2"></i>Try Again
          </button>
        </div>
      </div>
    );
  }

  const siteName = area?.zones?.sites?.name || 'Site';
  const zoneName = area?.zones?.name || 'Zone';
  const areaName = area?.name || 'Area';
  const areaType = area?.area_types?.name;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <button 
            onClick={() => navigate('/app')} 
            className="text-green-100 hover:text-white mb-4 flex items-center gap-2"
          >
            <i className="fas fa-arrow-left"></i>
            <span>Back to Dashboard</span>
          </button>
          
          <div className="flex items-center gap-2 text-sm text-green-100 mb-2">
            <i className="fas fa-building"></i>
            <span>{siteName}</span>
            <span className="opacity-50">›</span>
            <i className="fas fa-map-marker-alt"></i>
            <span>{zoneName}</span>
          </div>
          
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <i className="fas fa-door-open"></i>
            {areaName}
          </h1>
          
          {areaType && (
            <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-sm">
              {areaType}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Task Summary */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Your tasks in this area</p>
              <p className="text-2xl font-bold text-gray-800">{tasks.length}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <i className="fas fa-clipboard-list text-green-600 text-xl"></i>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        {tasks.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <i className="fas fa-tasks text-green-600"></i>
              Tasks to Complete
            </h2>
            
            {tasks.map(task => {
              const taskName = getTaskDisplayName(task);
              const isAdHoc = task.task_type === 'ad_hoc';
              
              return (
                <div 
                  key={task.id} 
                  className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{taskName}</h3>
                        {isAdHoc && (
                          <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                            Ad-hoc
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        <i className="fas fa-clock mr-1"></i>
                        Assigned {new Date(task.created_at).toLocaleString()}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => setSelectedTask(task)}
                      className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-5 rounded-lg shadow-md transition-all transform hover:scale-105 flex items-center gap-2"
                    >
                      <i className="fas fa-check-circle"></i>
                      <span>Done</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="bg-green-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <i className="fas fa-check-double text-green-500 text-3xl"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">All Done!</h3>
            <p className="text-gray-600 mb-6">
              You have no pending tasks in this area.
            </p>
            <button
              onClick={() => navigate('/app')}
              className="bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Dashboard
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={fetchData}
              className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50"
            >
              <i className="fas fa-sync-alt"></i>
              <span>Refresh</span>
            </button>
            <button 
              onClick={() => navigate('/app')}
              className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50"
            >
              <i className="fas fa-home"></i>
              <span>Dashboard</span>
            </button>
          </div>
        </div>
      </div>

      {/* Completion Modal */}
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
