// src/pages/SupervisorDashboard.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

/** -------- utils -------- */
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const startOfTomorrow = () => {
  const d = startOfToday();
  d.setDate(d.getDate() + 1);
  return d;
};

/** -------- modal: generate/assign/create tasks for one area -------- */
const TaskManagementModal = ({
  area,              // { id, name, zone_id, company_id, required, scheduledTodayCount, ... , zones: { id, name, sites? } }
  isOpen,
  onClose,
  onUpdate,
  allCleaners,       // [{id, full_name}]
  profile            // current supervisor profile (for created_by fallback)
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
    setIsSubmitting(true);
    setError('');
    try {
      const batch = Array.from({ length: tasksToGenerateCount }).map(() => ({
        title: `Standard Clean - ${area.name}`,
        description: `Scheduled daily cleaning for ${area.name}.`,
        company_id: area.company_id,
        area_id: area.id,
        zone_id: area.zone_id ?? null,    // keep if your tasks table has zone_id (it does per schema)
        site_id: siteId,                  // keep if your tasks table has site_id (it does per schema)
        created_by: profile?.id ?? null,
        status: 'pending',
        task_type: 'scheduled',
      }));

      const { error: insertError } = await supabase.from('tasks').insert(batch);
      if (insertError) throw insertError;

      onUpdate(); // refresh dashboard
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
    setIsSubmitting(true);
    setError('');
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

  const handleCreateAdHocTask = async (e) => {
    e.preventDefault();
    if (!newAdHocTaskTitle || !newAdHocTaskAssigneeId) {
      setError('Please provide a title and select a cleaner.');
      return;
    }
    setIsSubmitting(true);
    setError('');
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
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4 z-50" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold">Manage Tasks for: {area.name}</h3>
          <p className="text-sm text-gray-500">
            {area?.zones?.sites?.name || '—'} &gt; {area?.zones?.name || '—'}
          </p>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Generate scheduled */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-lg border-b pb-2 mb-4">Scheduled Tasks for Today</h4>
            {tasksToGenerateCount > 0 ? (
              <div className="space-y-3">
                <p>
                  Required today: <b>{requiredTasks}</b> · Generated: <b>{generatedToday}</b> · Remaining: <b>{tasksToGenerateCount}</b>
                </p>
                <button
                  onClick={handleGenerateTasks}
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Generating…' : `Generate ${tasksToGenerateCount} Daily Task(s)`}
                </button>
              </div>
            ) : (
              <p className="text-gray-600">
                All required ({requiredTasks}) scheduled tasks for today have been generated.
              </p>
            )}
          </div>

          {/* Assign pending */}
          <div className="mb-8">
            <h4 className="font-semibold text-lg border-b pb-2 mb-4">Assign Pending Tasks</h4>
            {pendingTasks.length > 0 ? (
              <div className="space-y-4">
                <p>Assign all <b>{pendingTasks.length}</b> pending task(s) to a cleaner:</p>
                <select
                  value={assigneeId}
                  onChange={e => setAssigneeId(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select Cleaner…</option>
                  {allCleaners.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
                <button
                  onClick={handleAssignPendingTasks}
                  disabled={isSubmitting || !assigneeId}
                  className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
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
              <input
                type="text"
                value={newAdHocTaskTitle}
                onChange={e => setNewAdHocTaskTitle(e.target.value)}
                placeholder="e.g., Urgent Spill Cleanup"
                className="w-full p-2 border rounded-md"
              />
              <select
                value={newAdHocTaskAssigneeId}
                onChange={e => setNewAdHocTaskAssigneeId(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select Cleaner…</option>
                {allCleaners.map(c => (
                  <option key={c.id} value={c.id}>{c.full_name}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={isSubmitting || !newAdHocTaskTitle || !newAdHocTaskAssigneeId}
                className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating…' : 'Create & Assign Task'}
              </button>
            </form>
          </div>
        </div>

        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-b-lg">
          {error && <p className="text-red-600 text-sm max-w-md">{error}</p>}
          <button onClick={onClose} className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 ml-auto">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/** -------- main dashboard -------- */
export default function SupervisorDashboard({ profile }) {
  const [zones, setZones] = useState([]);      // [{ id, name, sites:{id,name}, areas:[...] }]
  const [cleaners, setCleaners] = useState([]); // picker list
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);

  const fetchData = useCallback(async () => {
    if (!profile?.id || !profile?.company_id) return;
    try {
      setLoading(true);
      setError(null);

      // 1) Zones assigned to this supervisor
      const { data: assignedZones, error: zonesError } = await supabase
        .from('zone_assignments')
        .select('zones!inner(*, sites(*))')
        .eq('user_id', profile.id);
      if (zonesError) throw zonesError;

      const supervisorZones = (assignedZones || []).map(z => z.zones).filter(Boolean);
      const zoneIds = supervisorZones.map(z => z.id);
      if (zoneIds.length === 0) {
        setZones([]); setLoading(false); return;
      }

      // 2) Areas (include daily_cleaning_frequency)
      const { data: areasData, error: areasError } = await supabase
        .from('areas')
        .select('id, name, zone_id, company_id, daily_cleaning_frequency')
        .in('zone_id', zoneIds);
      if (areasError) throw areasError;

      // 3) Today's tasks in these zones (tight window: today only)
      const start = startOfToday().toISOString();
      const end = startOfTomorrow().toISOString();

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, status, area_id, assigned_to, task_type, created_at, zone_id')
        .in('zone_id', zoneIds)
        .gte('created_at', start)
        .lt('created_at', end);
      if (tasksError) throw tasksError;

      // 4) Attach tasks + computed counts to each area
      const areasWithMeta = areasData.map(area => {
        const tasks = (tasksData || []).filter(t => t.area_id === area.id);
        const scheduledTodayCount = tasks.filter(t => t.task_type === 'scheduled').length;
        const required = Number(area.daily_cleaning_frequency) || 0;
        const remaining = Math.max(required - scheduledTodayCount, 0);
        return { ...area, tasks, scheduledTodayCount, required, remaining };
      });

      // 5) Group by zone and hydrate zones list (keep site on zone for display + modal site_id)
      const areasByZone = areasWithMeta.reduce((acc, a) => {
        (acc[a.zone_id] ||= []).push(a);
        return acc;
      }, {});

      const zonesWithAreas = supervisorZones.map(zone => ({
        ...zone,
        areas: areasByZone[zone.id] || []
      }));

      setZones(zonesWithAreas);

      // 6) Cleaners in company (role=cleaner)
      const { data: cleanersData, error: cleanersError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('company_id', profile.company_id)
        .eq('role', 'cleaner');
      if (cleanersError) throw cleanersError;
      setCleaners(cleanersData || []);
    } catch (e) {
      console.error('Error fetching supervisor data:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getCleanerName = (id) => cleaners.find(c => c.id === id)?.full_name || 'Unknown';

  if (loading) return <div className="p-6">Loading dashboard…</div>;
  if (error)   return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <>
      <div className="p-6 bg-gray-50 min-h-screen">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Task Assignment Dashboard</h2>

        <div className="space-y-8">
          {zones.length > 0 ? zones.map(zone => (
            <div key={zone.id} className="bg-white p-4 rounded-lg shadow-md border">
              <h3 className="text-xl font-semibold mb-1">{zone.name}</h3>
              <p className="text-sm text-gray-500 mb-4">Site: {zone?.sites?.name || '—'}</p>

              <div className="space-y-4">
                {zone.areas?.length > 0 ? zone.areas.map(area => {
                  const assignedTasks = area.tasks.filter(t => t.status === 'assigned');

                  return (
                    <div key={area.id} className="border rounded-md p-4 bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-800">{area.name}</p>
                          <p className="text-xs text-gray-600">
                            Required today: <b>{area.required}</b> ·
                            Generated: <b>{area.scheduledTodayCount}</b> ·
                            Remaining: <b>{area.remaining}</b>
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedArea(area)}
                          className="bg-blue-500 text-white py-1 px-3 text-sm rounded-md hover:bg-blue-600"
                        >
                          Manage ({area.remaining} Remaining)
                        </button>
                      </div>

                      <div className="mt-2 pl-4 border-l-2">
                        <h5 className="text-xs font-bold text-gray-500 uppercase mb-1">Assigned Tasks</h5>
                        {assignedTasks.length > 0 ? (
                          <ul className="list-disc pl-5 space-y-1">
                            {assignedTasks.map(task => (
                              <li key={task.id} className="text-sm text-gray-700">
                                {task.title} — <span className="font-semibold">{getCleanerName(task.assigned_to)}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-gray-500 italic">No tasks currently assigned in this area.</p>
                        )}
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-sm text-gray-500">No areas found in this zone.</p>
                )}
              </div>
            </div>
          )) : (
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <p className="text-gray-600">You are not assigned to any zones, or there are no areas in your assigned zones.</p>
            </div>
          )}
        </div>
      </div>

      {/* modal (inject the full zone object so it can read site id/name) */}
      <TaskManagementModal
        profile={profile}
        area={selectedArea ? { ...selectedArea, zones: zones.find(z => z.id === selectedArea.zone_id) } : null}
        isOpen={!!selectedArea}
        onClose={() => setSelectedArea(null)}
        onUpdate={fetchData}
        allCleaners={cleaners}
      />
    </>
  );
}
