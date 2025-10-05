import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient.js';
import { useAuth } from '../contexts/AuthContext.jsx';

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
  const [newAdHocTaskTitle, setNewAdHocTaskTitle] = useState('');
  const [newAdHocTaskAssigneeId, setNewAdHocTaskAssigneeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setAssigneeId('');
    setNewAdHocTaskTitle('');
    setNewAdHocTaskAssigneeId('');
    setError('');
  }, [isOpen, area]);

  if (!isOpen || !area) return null;

  const siteId = area?.zones?.sites?.id ?? null;
  const requiredTasks = Number(area.required) || 0;
  const generatedToday = Number(area.scheduledTodayCount) || 0;
  const tasksToGenerateCount = Math.max(0, requiredTasks - generatedToday);
  const pendingTasks = (area.tasks || []).filter(t => t.status === 'pending');

  const handleGenerateTasks = async () => {
    if (tasksToGenerateCount <= 0) return;
    setIsSubmitting(true); setError('');
    try {
      const batch = Array.from({ length: tasksToGenerateCount }).map(() => ({
        title: `Standard Clean - ${area.name}`,
        description: `Scheduled daily cleaning for ${area.name}.`,
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

    } catch (e) {
      console.error(e);
      setError('Failed to generate daily tasks. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        .update({ assigned_to: assigneeId, status: 'assigned', assigned_at: new Date().toISOString() })
        .in('id', ids);
      if (updateError) throw updateError;
      onUpdate(); onClose();
    } catch (e) {
      console.error(e);
      setError('Failed to assign tasks.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      onUpdate(); onClose();
    } catch (e) {
      console.error(e);
      setError('Failed to create ad-hoc task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4 z-50" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold">Manage Tasks for: {area.name}</h3>
          <p className="text-sm text-gray-500">{area?.zones?.sites?.name || '—'} &gt; {area?.zones?.name || '—'}</p>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Generate scheduled */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-lg border-b pb-2 mb-4">Scheduled Tasks for Today</h4>
            {tasksToGenerateCount > 0 ? (
              <div className="space-y-3">
                <p>Required today: <b>{requiredTasks}</b> · Generated: <b>{generatedToday}</b> · Remaining: <b>{tasksToGenerateCount}</b></p>
                <button onClick={handleGenerateTasks} disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50">
                  {isSubmitting ? 'Generating…' : `Generate ${tasksToGenerateCount} Daily Task(s)`}
                </button>
              </div>
            ) : (
              <p className="text-gray-600">All required ({requiredTasks}) scheduled tasks for today have been generated.</p>
            )}
          </div>

          {/* Assign pending */}
          <div className="mb-8">
            <h4 className="font-semibold text-lg border-b pb-2 mb-4">Assign Pending Tasks</h4>
            {(allCleaners?.length ?? 0) === 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mb-3">
                No cleaners are assigned to this zone.
              </p>
            )}
            {pendingTasks.length > 0 ? (
              <div className="space-y-4">
                <p>Assign all <b>{pendingTasks.length}</b> pending task(s) to a cleaner:</p>
                <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className="w-full p-2 border rounded-md">
                  <option value="">Select Cleaner…</option>
                  {allCleaners.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
                <button onClick={handleAssignPendingTasks} disabled={isSubmitting || !assigneeId} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {isSubmitting ? 'Assigning…' : 'Assign Pending Tasks'}
                </button>
              </div>
            ) : (
              <p className="text-gray-500">No tasks are pending assignment.</p>
            )}
          </div>

          {/* Ad-hoc */}
          <div>
            <h4 className="font-semibold text-lg border-b pb-2 mb-4">Create Ad-Hoc Task</h4>
            <form onSubmit={handleCreateAdHocTask} className="space-y-4">
              <input type="text" value={newAdHocTaskTitle} onChange={e => setNewAdHocTaskTitle(e.target.value)} placeholder="e.g., Urgent Spill Cleanup" className="w-full p-2 border rounded-md" />
              <select value={newAdHocTaskAssigneeId} onChange={e => setNewAdHocTaskAssigneeId(e.target.value)} className="w-full p-2 border rounded-md">
                <option value="">Select Cleaner…</option>
                {allCleaners.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
              <button type="submit" disabled={isSubmitting || !newAdHocTaskTitle || !newAdHocTaskAssigneeId} className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-50">
                {isSubmitting ? 'Creating…' : 'Create & Assign Task'}
              </button>
            </form>
          </div>
        </div>

        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-b-lg">
          {error && <p className="text-red-600 text-sm max-w-md">{error}</p>}
          <button onClick={onClose} className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 ml-auto">Close</button>
        </div>
      </div>
    </div>
  );
};

/** -------- main dashboard -------- */
export default function SupervisorDashboard() {
  const { profile } = useAuth();
  const [zones, setZones] = useState([]);
  const [zoneCleanersMap, setZoneCleanersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedAreaId, setSelectedAreaId] = useState(null);

  const fetchData = useCallback(async () => {
    if (!profile?.id || !profile?.company_id) return;
    try {
      setLoading(true); 
      setError(null);

      const { data: assignedZones, error: zonesError } = await supabase.from('zone_assignments').select('zones!inner(*, sites(*))').eq('user_id', profile.id);
      if (zonesError) throw zonesError;

      const supervisorZones = (assignedZones || []).map(z => z.zones).filter(Boolean);
      const zoneIds = supervisorZones.map(z => z.id);
      if (zoneIds.length === 0) { setZones([]); setZoneCleanersMap({}); setLoading(false); return; }

      const { data: areasData, error: areasError } = await supabase.from('areas').select('id, name, zone_id, company_id, daily_cleaning_frequency').in('zone_id', zoneIds);
      if (areasError) throw areasError;

      const start = startOfToday().toISOString();
      const end = startOfTomorrow().toISOString();
      const { data: tasksData, error: tasksError } = await supabase.from('tasks').select('id, title, status, area_id, assigned_to, task_type, created_at, zone_id, profiles:assigned_to(full_name)').in('zone_id', zoneIds).gte('created_at', start).lt('created_at', end);
      if (tasksError) throw tasksError;

      const areasWithMeta = (areasData || []).map(area => {
        const tasks = (tasksData || []).filter(t => t.area_id === area.id);
        const scheduledTodayCount = tasks.filter(t => t.task_type === 'scheduled').length;
        const required = Number(area.daily_cleaning_frequency) || 0;
        const remaining = Math.max(required - scheduledTodayCount, 0);
        return { ...area, tasks, scheduledTodayCount, required, remaining };
      });

      const areasByZone = areasWithMeta.reduce((acc, a) => { (acc[a.zone_id] ||= []).push(a); return acc; }, {});
      const zonesWithAreas = supervisorZones.map(zone => ({ ...zone, areas: areasByZone[zone.id] || [] }));
      setZones(zonesWithAreas);

      const { data: za, error: zaErr } = await supabase.from('zone_assignments').select('zone_id, user_id').in('zone_id', zoneIds);
      if (zaErr) throw zaErr;

      const cleanerIds = Array.from(new Set((za || []).map(r => r.user_id)));
      let cleanersById = {};
      if (cleanerIds.length > 0) {
        const { data: cleaners, error: cleanersErr } = await supabase.from('profiles').select('id, full_name, role, company_id').in('id', cleanerIds).eq('role', 'cleaner').eq('company_id', profile.company_id);
        if (cleanersErr) throw cleanersErr;
        cleanersById = (cleaners || []).reduce((acc, c) => { acc[c.id] = { id: c.id, full_name: c.full_name || 'Unnamed' }; return acc; }, {});
      }

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

  useEffect(() => { fetchData(); }, [fetchData]);

  const selectedArea = selectedAreaId 
    ? zones.flatMap(z => z.areas || []).find(a => a.id === selectedAreaId) 
    : null;

  if (loading) return <div className="p-6">Loading dashboard…</div>;
  if (error)   return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <>
      <div className="p-6 bg-gray-50 min-h-screen">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Task Assignment Dashboard</h2>
        <div className="space-y-8">
          {zones.map(zone => (
            <div key={zone.id} className="bg-white p-4 rounded-lg shadow-md border">
              <h3 className="text-xl font-semibold mb-1">{zone.name}</h3>
              <p className="text-sm text-gray-500 mb-4">Site: {zone?.sites?.name || '—'}</p>
              <div className="space-y-4">
                {(zone.areas || []).map(area => {
                  const assignedTasks = area.tasks.filter(t => t.status === 'assigned');
                  return (
                    <div key={area.id} className="border rounded-md p-4 bg-gray-50">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                          <p className="font-semibold text-gray-800">{area.name}</p>
                          <p className="text-xs text-gray-600">
                            Required: <b>{area.required}</b> ·
                            Generated: <b>{area.scheduledTodayCount}</b> ·
                            Remaining: <b>{area.remaining}</b>
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedAreaId(area.id)}
                          className="bg-blue-500 text-white py-2 px-4 text-sm rounded-md hover:bg-blue-600 w-full sm:w-auto"
                        >
                          Manage ({area.remaining} Remaining)
                        </button>
                      </div>
                      <div className="mt-3 pt-3 pl-4 border-l-2 sm:border-l-0 sm:border-t-2 sm:mt-4 sm:pt-4 sm:pl-0">
                        <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">Assigned Tasks</h5>
                        {assignedTasks.length > 0 ? (
                          <ul className="space-y-1">
                            {assignedTasks.map(task => (
                              <li key={task.id} className="text-sm text-gray-700">
                                {task.title} — <span className="font-semibold">{task.profiles?.full_name || 'Unknown'}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-gray-500 italic">No tasks currently assigned in this area.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
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

