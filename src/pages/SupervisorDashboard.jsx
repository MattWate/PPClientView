// src/pages/SupervisorDashboard.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient.js';

/** -------- utils -------- */
const startOfToday = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const startOfTomorrow = () => { const d = startOfToday(); d.setDate(d.getDate()+1); return d; };

/** -------- modal: generate/assign/create tasks for one area -------- */
const TaskManagementModal = ({
  area,
  isOpen,
  onClose,
  onUpdate,
  allCleaners,
  profile
}) => {
  const [assigneeId, setAssigneeId] = useState('');
  
  // Ad-hoc state
  const [newAdHocTaskTitle, setNewAdHocTaskTitle] = useState('');
  const [newAdHocTaskAssigneeId, setNewAdHocTaskAssigneeId] = useState('');
  
  // Scheduled Jobs state
  const [scheduledJobs, setScheduledJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    setAssigneeId('');
    setNewAdHocTaskTitle('');
    setNewAdHocTaskAssigneeId('');
    setError('');
    setSuccessMsg('');
    setScheduledJobs([]);
    
    if (isOpen && area?.id) {
      fetchScheduledJobs(area.id);
    }
  }, [isOpen, area]);

  const fetchScheduledJobs = async (areaId) => {
    try {
      setLoadingJobs(true);
      const { data, error } = await supabase
        .from('scheduled_jobs')
        .select('*')
        .eq('area_id', areaId)
        .eq('is_active', true);
        
      if (error) throw error;
      setScheduledJobs(data || []);
    } catch (err) {
      console.error('Error fetching scheduled jobs:', err);
    } finally {
      setLoadingJobs(false);
    }
  };

  if (!isOpen || !area) return null;

  const siteId = area?.zones?.sites?.id ?? null;
  const requiredTasks = Number(area.required) || 0;
  const generatedToday = Number(area.scheduledTodayCount) || 0;
  const tasksToGenerateCount = Math.max(0, requiredTasks - generatedToday);
  const pendingTasks = (area.tasks || []).filter(t => t.status === 'pending');

  // 1. Run a specific Scheduled Job (The Bridge)
  const handleRunScheduledJob = async (job) => {
    setIsSubmitting(true);
    setError('');
    setSuccessMsg('');
    
    try {
      const { error: insertError } = await supabase.from('tasks').insert({
        title: job.title,
        description: `Scheduled Task: ${job.cron_schedule}`, // Simplified description
        company_id: area.company_id,
        area_id: area.id,
        zone_id: area.zone_id ?? null,
        site_id: siteId,
        created_by: profile?.id ?? null,
        status: 'pending',
        task_type: 'scheduled',
        scheduled_job_id: job.id // Optional: link back if schema supports it
      });

      if (insertError) throw insertError;

      setSuccessMsg(`Launched: ${job.title}`);
      onUpdate();
      // We don't close immediately so they can launch others if needed
    } catch (e) {
      console.error(e);
      setError('Failed to launch scheduled job.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Generate Generic Daily Tasks (Fallback)
  const handleGenerateGenericTasks = async () => {
    if (tasksToGenerateCount <= 0) return;
    setIsSubmitting(true); setError('');
    try {
      const batch = Array.from({ length: tasksToGenerateCount }).map(() => ({
        title: `Daily Clean - ${area.name}`,
        description: `Routine daily cleaning for ${area.name}.`,
        company_id: area.company_id,
        area_id: area.id,
        zone_id: area.zone_id ?? null,
        site_id: siteId,
        created_by: profile?.id ?? null,
        status: 'pending',
        task_type: 'scheduled',
      }));
      const { error: insertError } = await supabase.from('tasks').insert(batch);
      if (insertError) throw insertError;
      
      onUpdate();
      onClose();
    } catch (e) {
      console.error(e);
      setError('Failed to generate daily tasks.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Assign Pending Tasks
  const handleAssignPendingTasks = async () => {
    if (!assigneeId) {
      setError('Please select a cleaner to assign the pending tasks.');
      return;
    }
    setIsSubmitting(true); setError('');
    try {
      const ids = pendingTasks.map(t => t.id);
      if (ids.length === 0) return;
      
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ 
          assigned_to: assigneeId, 
          status: 'assigned', 
          assigned_at: new Date().toISOString() 
        })
        .in('id', ids);
        
      if (updateError) throw updateError;
      onUpdate(); 
      onClose();
    } catch (e) {
      console.error(e);
      setError('Failed to assign tasks.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Create Ad-Hoc Task
  const handleCreateAdHocTask = async (e) => {
    e.preventDefault();
    if (!newAdHocTaskTitle || !newAdHocTaskAssigneeId) {
      setError('Please provide a title and select a cleaner.');
      return;
    }
    setIsSubmitting(true); setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error: insertError } = await supabase.from('tasks').insert([{
        title: newAdHocTaskTitle,
        description: 'Ad-hoc task created by supervisor.',
        company_id: area.company_id,
        area_id: area.id,
        zone_id: area.zone_id ?? null,
        site_id: siteId,
        assigned_to: newAdHocTaskAssigneeId,
        created_by: user?.id ?? profile?.id ?? null,
        status: 'assigned',
        task_type: 'ad_hoc',
        assigned_at: new Date().toISOString()
      }]);
      if (insertError) throw insertError;
      onUpdate(); 
      onClose();
    } catch (e) {
      console.error(e);
      setError('Failed to create ad-hoc task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4 z-50 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <h3 className="text-xl font-bold">Manage Tasks: {area.name}</h3>
          <p className="text-sm text-gray-500">{area?.zones?.sites?.name || '—'} &gt; {area?.zones?.name || '—'}</p>
        </div>

        <div className="p-6 space-y-8">
          
          {/* SECTION 1: SCHEDULED JOBS (The "Close the Loop" feature) */}
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
            <h4 className="font-semibold text-lg text-indigo-900 mb-3 flex items-center gap-2">
              <i className="fas fa-calendar-alt"></i> Scheduled Jobs
            </h4>
            
            {loadingJobs ? (
              <p className="text-sm text-gray-500">Loading schedules...</p>
            ) : scheduledJobs.length > 0 ? (
              <ul className="space-y-2">
                {scheduledJobs.map(job => (
                  <li key={job.id} className="flex justify-between items-center bg-white p-3 rounded shadow-sm">
                    <div>
                      <span className="font-medium text-gray-800">{job.title}</span>
                      <p className="text-xs text-gray-500">Schedule: {job.cron_schedule}</p>
                    </div>
                    <button 
                      onClick={() => handleRunScheduledJob(job)}
                      disabled={isSubmitting}
                      className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Run Now
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">No scheduled jobs defined for this area.</p>
            )}

            {/* Fallback to Generic Generation if needed */}
            <div className="mt-4 pt-4 border-t border-indigo-200">
               <div className="flex justify-between items-center">
                  <span className="text-sm text-indigo-800">
                    Daily Requirement: <b>{generatedToday}</b> / <b>{requiredTasks}</b>
                  </span>
                  {tasksToGenerateCount > 0 && (
                    <button 
                      onClick={handleGenerateGenericTasks} 
                      disabled={isSubmitting}
                      className="text-xs bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded hover:bg-indigo-200"
                    >
                      + Generate {tasksToGenerateCount} Generic Tasks
                    </button>
                  )}
               </div>
            </div>
          </div>

          {/* SECTION 2: ASSIGN PENDING */}
          <div>
            <h4 className="font-semibold text-lg border-b pb-2 mb-4">Assign Pending Tasks</h4>
            {(allCleaners?.length ?? 0) === 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mb-3">
                No cleaners are assigned to this zone. Go to Assignments to add cleaners.
              </p>
            )}
            {pendingTasks.length > 0 ? (
              <div className="space-y-4">
                <p>Assign all <b>{pendingTasks.length}</b> pending task(s) to a cleaner:</p>
                <div className="flex gap-2">
                  <select 
                    value={assigneeId} 
                    onChange={e => setAssigneeId(e.target.value)} 
                    className="flex-1 p-2 border rounded-md"
                  >
                    <option value="">Select Cleaner…</option>
                    {allCleaners.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                  </select>
                  <button 
                    onClick={handleAssignPendingTasks} 
                    disabled={isSubmitting || !assigneeId} 
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    Assign
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No tasks are pending assignment.</p>
            )}
          </div>

          {/* SECTION 3: AD-HOC */}
          <div>
            <h4 className="font-semibold text-lg border-b pb-2 mb-4">Create Ad-Hoc Task</h4>
            <form onSubmit={handleCreateAdHocTask} className="space-y-4">
              <input 
                type="text" 
                value={newAdHocTaskTitle} 
                onChange={e => setNewAdHocTaskTitle(e.target.value)} 
                placeholder="e.g., Urgent Spill Cleanup" 
                className="w-full p-2 border rounded-md" 
              />
              <div className="flex gap-2">
                <select 
                    value={newAdHocTaskAssigneeId} 
                    onChange={e => setNewAdHocTaskAssigneeId(e.target.value)} 
                    className="flex-1 p-2 border rounded-md"
                >
                    <option value="">Select Cleaner…</option>
                    {allCleaners.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
                <button 
                    type="submit" 
                    disabled={isSubmitting || !newAdHocTaskTitle || !newAdHocTaskAssigneeId} 
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                    Create
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-b-lg sticky bottom-0">
          <div className="flex-1">
             {error && <p className="text-red-600 text-sm">{error}</p>}
             {successMsg && <p className="text-green-600 text-sm font-medium"><i className="fas fa-check-circle mr-1"></i>{successMsg}</p>}
          </div>
          <button onClick={onClose} className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 ml-4">Close</button>
        </div>
      </div>
    </div>
  );
};

/** -------- main dashboard -------- */
export default function SupervisorDashboard({ profile }) {
  const [zones, setZones] = useState([]);
  const [zoneCleanersMap, setZoneCleanersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedAreaId, setSelectedAreaId] = useState(null);

  const fetchData = useCallback(async () => {
    if (!profile?.id || !profile?.company_id) {
      console.log('SupervisorDashboard: Missing profile data', { profile });
      return;
    }
    
    try {
      setLoading(true); 
      setError(null);

      // Fetch zones assigned to this supervisor
      const { data: assignedZones, error: zonesError } = await supabase
        .from('zone_assignments')
        .select('zones!inner(*, sites(*))')
        .eq('user_id', profile.id);
      
      if (zonesError) throw zonesError;

      const supervisorZones = (assignedZones || []).map(z => z.zones).filter(Boolean);
      const zoneIds = supervisorZones.map(z => z.id);
      
      if (zoneIds.length === 0) { 
        setZones([]); 
        setZoneCleanersMap({}); 
        setLoading(false); 
        return; 
      }

      // Fetch areas in these zones
      const { data: areasData, error: areasError } = await supabase
        .from('areas')
        .select('id, name, zone_id, company_id, daily_cleaning_frequency')
        .in('zone_id', zoneIds);
      
      if (areasError) throw areasError;

      // Fetch tasks created today
      const start = startOfToday().toISOString();
      const end = startOfTomorrow().toISOString();
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, status, area_id, assigned_to, task_type, created_at, zone_id, profiles:assigned_to(full_name)')
        .in('zone_id', zoneIds)
        .gte('created_at', start)
        .lt('created_at', end);
      
      if (tasksError) throw tasksError;

      // Build areas with task metadata
      const areasWithMeta = (areasData || []).map(area => {
        const tasks = (tasksData || []).filter(t => t.area_id === area.id);
        const scheduledTodayCount = tasks.filter(t => t.task_type === 'scheduled').length;
        const required = Number(area.daily_cleaning_frequency) || 0;
        const remaining = Math.max(required - scheduledTodayCount, 0);
        return { ...area, tasks, scheduledTodayCount, required, remaining };
      });

      // Group areas by zone
      const areasByZone = areasWithMeta.reduce((acc, a) => { 
        (acc[a.zone_id] ||= []).push(a); 
        return acc; 
      }, {});
      
      const zonesWithAreas = supervisorZones.map(zone => ({ 
        ...zone, 
        areas: areasByZone[zone.id] || [] 
      }));
      
      setZones(zonesWithAreas);

      // Fetch cleaners assigned to these zones
      const { data: za, error: zaErr } = await supabase
        .from('zone_assignments')
        .select('zone_id, user_id')
        .in('zone_id', zoneIds);
      
      if (zaErr) throw zaErr;

      const cleanerIds = Array.from(new Set((za || []).map(r => r.user_id)));
      let cleanersById = {};
      
      if (cleanerIds.length > 0) {
        const { data: cleaners, error: cleanersErr } = await supabase
          .from('profiles')
          .select('id, full_name, role, company_id')
          .in('id', cleanerIds)
          .eq('role', 'cleaner')
          .eq('company_id', profile.company_id);
        
        if (cleanersErr) throw cleanersErr;
        cleanersById = (cleaners || []).reduce((acc, c) => { 
          acc[c.id] = { id: c.id, full_name: c.full_name || 'Unnamed' }; 
          return acc; 
        }, {});
      }

      // Map cleaners to zones
      const map = {};
      for (const row of (za || [])) {
        const c = cleanersById[row.user_id];
        if (!c) continue;
        if (!map[row.zone_id]) map[row.zone_id] = [];
        if (!map[row.zone_id].some(x => x.id === c.id)) map[row.zone_id].push(c);
      }
      setZoneCleanersMap(map);

    } catch (e) {
      console.error('Error fetching supervisor data:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const selectedArea = selectedAreaId 
    ? zones.flatMap(z => z.areas || []).find(a => a.id === selectedAreaId) 
    : null;

  if (loading) return (
    <div className="flex justify-center items-center p-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );
  
  if (error) return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <p className="text-red-800 font-semibold">Error loading dashboard</p>
      <p className="text-red-600 text-sm">{error}</p>
    </div>
  );

  if (zones.length === 0) return (
    <div className="p-12 text-center bg-white rounded-lg shadow-md">
      <i className="fas fa-info-circle text-4xl text-gray-400 mb-4"></i>
      <h3 className="text-xl font-semibold text-gray-700 mb-2">No Zones Assigned</h3>
      <p className="text-gray-600">You haven't been assigned to any zones yet. Contact your administrator.</p>
    </div>
  );

  return (
    <>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Task Assignment Dashboard</h2>
          <p className="text-gray-600">Manage daily task generation and assignments for your zones</p>
        </div>

        {zones.map(zone => (
          <div key={zone.id} className="bg-white p-6 rounded-lg shadow-md border">
            <div className="mb-4 pb-4 border-b">
              <h3 className="text-xl font-semibold text-gray-800">{zone.name}</h3>
              <p className="text-sm text-gray-500">Site: {zone?.sites?.name || '—'}</p>
            </div>
            
            <div className="space-y-4">
              {(zone.areas || []).length === 0 ? (
                <p className="text-gray-500 text-center py-4">No areas in this zone</p>
              ) : (
                (zone.areas || []).map(area => {
                  const assignedTasks = area.tasks.filter(t => t.status === 'assigned');
                  const pendingTasks = area.tasks.filter(t => t.status === 'pending');
                  return (
                    <div key={area.id} className="border rounded-md p-4 bg-gray-50">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-800">{area.name}</p>
                            {pendingTasks.length > 0 && (
                                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                                    {pendingTasks.length} Pending
                                </span>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-2 text-xs">
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                              Generated Today: <b>{area.scheduledTodayCount}</b>
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedAreaId(area.id)}
                          className="bg-blue-600 text-white py-2 px-4 text-sm rounded-md hover:bg-blue-700 whitespace-nowrap shadow-sm"
                        >
                          Manage Tasks
                        </button>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t">
                        <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">Active Tasks</h5>
                        {area.tasks.length > 0 ? (
                          <ul className="space-y-1">
                            {area.tasks.map(task => (
                              <li key={task.id} className="text-sm text-gray-700 flex justify-between items-center bg-white p-2 rounded border border-gray-100">
                                <span>{task.title}</span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        task.status === 'verified' ? 'bg-blue-100 text-blue-800' :
                                        task.status === 'assigned' ? 'bg-indigo-100 text-indigo-800' :
                                        'bg-gray-100 text-gray-600'
                                    }`}>
                                        {task.status}
                                    </span>
                                    {task.profiles && (
                                        <span className="text-xs font-semibold text-gray-600">
                                            {task.profiles.full_name}
                                        </span>
                                    )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-gray-500 italic">No tasks active today.</p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
      
      <TaskManagementModal
        profile={profile}
        area={selectedArea ? { ...selectedArea, zones: zones.find(z => z.id === selectedArea.zone_id) } : null}
        isOpen={!!selectedArea}
        onClose={() => setSelectedAreaId(null)}
        onUpdate={fetchData}
        allCleaners={selectedArea ? (zoneCleanersMap[selectedArea.zone_id] || []) : []}
      />
    </>
  );
}
