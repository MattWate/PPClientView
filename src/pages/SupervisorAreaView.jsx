// src/pages/SupervisorAreaView.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient.js';
import { useAuth } from '../contexts/AuthContext.jsx';

// Status Badge Component
const StatusBadge = ({ status }) => {
  const styles = {
    verified: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    assigned: 'bg-yellow-100 text-yellow-800',
    pending: 'bg-gray-100 text-gray-800',
  };
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${styles[status] || styles.pending}`}>
      {status?.replace('_', ' ') || 'pending'}
    </span>
  );
};

// Task Action Modal - Handles Assign, Complete, Verify with Photo
const TaskActionModal = ({ task, isOpen, onClose, onUpdate, profile, cleaners }) => {
  const [action, setAction] = useState(''); // 'assign', 'complete', 'verify'
  const [selectedCleanerId, setSelectedCleanerId] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && task) {
      // Determine default action based on task status
      if (task.status === 'pending') setAction('assign');
      else if (task.status === 'assigned') setAction('complete');
      else if (task.status === 'completed') setAction('verify');
      else setAction('');
      
      setSelectedCleanerId(task.assigned_to || '');
      setPhoto(null);
      setPhotoPreview(null);
      setError('');
    }
  }, [isOpen, task]);

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

  const uploadPhoto = async () => {
    if (!photo) return null;
    
    const fileExt = photo.name.split('.').pop();
    const fileName = `${task.id}_${Date.now()}.${fileExt}`;
    const filePath = `task-photos/${profile.company_id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('task-photos')
      .upload(filePath, photo);

    if (uploadError) {
      console.error('Photo upload error:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('task-photos')
      .getPublicUrl(filePath);
    return publicUrl;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      let updateData = {};
      const now = new Date().toISOString();

      switch (action) {
        case 'assign':
          if (!selectedCleanerId) {
            setError('Please select a cleaner');
            setIsSubmitting(false);
            return;
          }
          updateData = { 
            assigned_to: selectedCleanerId, 
            status: 'assigned',
            assigned_at: now
          };
          break;

        case 'complete':
          const photoUrl = await uploadPhoto();
          updateData = { 
            status: 'completed', 
            completed_by: profile.id, 
            completed_at: now,
            completed_by_proxy: true,
            ...(photoUrl && { photo_url: photoUrl })
          };
          break;

        case 'verify':
          updateData = { 
            status: 'verified', 
            verified_by: profile.id, 
            verified_at: now 
          };
          break;

        case 'complete_and_verify':
          const photoUrl2 = await uploadPhoto();
          updateData = { 
            status: 'verified', 
            completed_by: profile.id, 
            completed_at: now,
            verified_by: profile.id, 
            verified_at: now,
            completed_by_proxy: true,
            ...(photoUrl2 && { photo_url: photoUrl2 })
          };
          break;

        default:
          setIsSubmitting(false);
          return;
      }

      const { error: updateError } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', task.id);

      if (updateError) throw updateError;

      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error updating task:', err);
      setError(err.message || 'Failed to update task');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !task) return null;

  const taskName = task.title || task.job_templates?.description || 'Cleaning Task';
  const assignedTo = task.profiles?.full_name || 'Unassigned';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b bg-indigo-50">
          <h3 className="text-xl font-bold text-indigo-800">{taskName}</h3>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={task.status} />
            <span className="text-sm text-gray-600">• Assigned to: {assignedTo}</span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Action Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
            <div className="grid grid-cols-2 gap-2">
              {(task.status === 'pending' || task.status === 'assigned') && (
                <>
                  <button
                    onClick={() => setAction('assign')}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                      action === 'assign' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <i className="fas fa-user-plus mr-2"></i>
                    {task.assigned_to ? 'Reassign' : 'Assign'}
                  </button>
                  <button
                    onClick={() => setAction('complete_and_verify')}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                      action === 'complete_and_verify' 
                        ? 'border-teal-500 bg-teal-50 text-teal-700' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <i className="fas fa-check-double mr-2"></i>
                    Complete & Verify
                  </button>
                </>
              )}
              {task.status === 'completed' && (
                <button
                  onClick={() => setAction('verify')}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors col-span-2 ${
                    action === 'verify' 
                      ? 'border-green-500 bg-green-50 text-green-700' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <i className="fas fa-clipboard-check mr-2"></i>
                  Verify Completion
                </button>
              )}
            </div>
          </div>

          {/* Assign Cleaner */}
          {action === 'assign' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Cleaner</label>
              <select
                value={selectedCleanerId}
                onChange={(e) => setSelectedCleanerId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a cleaner...</option>
                {cleaners.map(c => (
                  <option key={c.id} value={c.id}>{c.full_name || 'Unnamed'}</option>
                ))}
              </select>
            </div>
          )}

          {/* Photo Upload for Complete actions */}
          {(action === 'complete' || action === 'complete_and_verify') && (
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
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
                      <i className="fas fa-camera text-2xl text-gray-400 mb-1"></i>
                      <p className="text-xs text-gray-600">Take Photo</p>
                    </div>
                    <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="hidden" />
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
                      <i className="fas fa-image text-2xl text-gray-400 mb-1"></i>
                      <p className="text-xs text-gray-600">Choose File</p>
                    </div>
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Existing Photo */}
          {task.photo_url && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Completion Photo</label>
              <img src={task.photo_url} alt="Task completion" className="w-full h-48 object-cover rounded-lg border" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 rounded-b-lg flex gap-3">
          <button onClick={onClose} disabled={isSubmitting} className="flex-1 py-3 px-4 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 font-medium">
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !action}
            className="flex-1 py-3 px-4 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
          >
            {isSubmitting ? (
              <><i className="fas fa-spinner fa-spin mr-2"></i>Processing...</>
            ) : (
              <><i className="fas fa-check mr-2"></i>Confirm</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function SupervisorAreaView() {
  const { areaId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [area, setArea] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [cleaners, setCleaners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, assigned, completed, verified

  const fetchData = useCallback(async () => {
    if (!areaId || !profile) return;

    try {
      setLoading(true);
      setError('');

      // Fetch area details
      const { data: areaData, error: areaError } = await supabase
        .from('areas')
        .select(`
          id, name, description, daily_cleaning_frequency, zone_id,
          area_types(id, name),
          zones(id, name, sites(id, name))
        `)
        .eq('id', areaId)
        .single();
      
      if (areaError) throw areaError;
      setArea(areaData);

      // Fetch ALL tasks for this area (supervisor sees everything)
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id, title, description, status, task_type, created_at, completed_at, photo_url,
          job_templates(id, description),
          profiles:assigned_to(id, full_name)
        `)
        .eq('area_id', areaId)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

      // Fetch cleaners assigned to this zone
      if (areaData?.zone_id) {
        const { data: zoneAssignments, error: zaError } = await supabase
          .from('zone_assignments')
          .select('user_id')
          .eq('zone_id', areaData.zone_id);

        if (!zaError && zoneAssignments?.length > 0) {
          const cleanerIds = zoneAssignments.map(za => za.user_id);
          const { data: cleanersData } = await supabase
            .from('profiles')
            .select('id, full_name, role')
            .in('id', cleanerIds)
            .eq('role', 'cleaner')
            .eq('is_active', true);
          
          setCleaners(cleanersData || []);
        }
      }

    } catch (err) {
      setError('Failed to load area data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [areaId, profile]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getTaskDisplayName = (task) => {
    if (task.title && task.title !== 'Cleaning Task' && !task.title.startsWith('Standard Clean')) {
      return task.title;
    }
    return task.job_templates?.description || task.title || 'Cleaning Task';
  };

  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(t => t.status === filter);

  const taskCounts = {
    all: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    assigned: tasks.filter(t => t.status === 'assigned').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    verified: tasks.filter(t => t.status === 'verified').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading area...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <i className="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={fetchData} className="bg-indigo-600 text-white py-2 px-6 rounded-lg hover:bg-indigo-700">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button onClick={() => navigate('/app')} className="text-indigo-200 hover:text-white mb-4 flex items-center gap-2">
            <i className="fas fa-arrow-left"></i>
            Back to Dashboard
          </button>
          
          <div className="flex items-center gap-2 text-sm text-indigo-200 mb-2">
            <i className="fas fa-building"></i>
            <span>{area?.zones?.sites?.name}</span>
            <span className="opacity-50">›</span>
            <span>{area?.zones?.name}</span>
          </div>
          
          <h1 className="text-3xl font-bold">{area?.name}</h1>
          {area?.area_types?.name && (
            <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-sm">
              {area.area_types.name}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md p-2 mb-6 flex flex-wrap gap-2">
          {['all', 'pending', 'assigned', 'completed', 'verified'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} ({taskCounts[f]})
            </button>
          ))}
        </div>

        {/* Tasks List */}
        {filteredTasks.length > 0 ? (
          <div className="space-y-3">
            {filteredTasks.map(task => {
              const taskName = getTaskDisplayName(task);
              const assignedTo = task.profiles?.full_name || 'Unassigned';
              
              return (
                <div 
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-indigo-500"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{taskName}</h3>
                        {task.task_type === 'ad_hoc' && (
                          <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">Ad-hoc</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span><i className="fas fa-user mr-1"></i>{assignedTo}</span>
                        {task.photo_url && (
                          <span className="text-green-600"><i className="fas fa-camera mr-1"></i>Photo</span>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <i className="fas fa-clipboard-list text-gray-300 text-4xl mb-4"></i>
            <p className="text-gray-600">No {filter === 'all' ? '' : filter} tasks in this area.</p>
          </div>
        )}
      </div>

      {/* Task Action Modal */}
      <TaskActionModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={fetchData}
        profile={profile}
        cleaners={cleaners}
      />
    </div>
  );
}
