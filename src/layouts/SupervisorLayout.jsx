import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// --- Supabase Client Initialization ---
// NOTE: This is included to make the component runnable. 
const SUPABASE_URL = 'https://clsirugxuvdyxdnlwqqk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsc2lydWd4dXZkeXhkbmx3cXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNDQ2MzgsImV4cCI6MjA3MDkyMDYzOH0.gow7e2mHP_Qa0S0TsCriCfkKZ8jFTXO6ahp0mCstmoU';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// --- START: Inlined Child Components ---

// --- 1. Inlined TaskManagementModal ---
const TaskManagementModal = ({ area, isOpen, onClose, onUpdate, allCleaners, todaysScheduledTaskCount, profile }) => {
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
    
    const requiredTasks = Number(area.daily_cleaning_frequency) || 0;
    const tasksToGenerateCount = Math.max(0, requiredTasks - todaysScheduledTaskCount);
    const pendingTasks = area.tasks.filter(t => t.status === 'pending');

    const handleGenerateTasks = async () => {
        if (tasksToGenerateCount <= 0) return;
        setIsSubmitting(true);
        setError('');
        try {
            const newTasks = Array.from({ length: tasksToGenerateCount }).map(() => ({
                title: `Standard Clean - ${area.name}`,
                description: `Scheduled daily cleaning for ${area.name}.`,
                area_id: area.id,
                zone_id: area.zone_id,
                site_id: area.zones.site_id,
                company_id: area.company_id,
                created_by: profile?.id,
                status: 'pending',
                task_type: 'scheduled',
            }));
            const { error: insertError } = await supabase.from('tasks').insert(newTasks);
            if (insertError) throw insertError;
            onUpdate();
        } catch (err) {
            setError('Failed to generate daily tasks.');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleAssignPendingTasks = async () => {
        if (!assigneeId) {
            setError('Please select a cleaner.');
            return;
        }
        setIsSubmitting(true);
        setError('');
        try {
            const taskIdsToUpdate = pendingTasks.map(t => t.id);
            const { error: updateError } = await supabase.from('tasks').update({ assigned_to: assigneeId, status: 'assigned', assigned_at: new Date().toISOString() }).in('id', taskIdsToUpdate);
            if (updateError) throw updateError;
            onUpdate();
            onClose();
        } catch (err) {
            setError('Failed to assign tasks.');
            console.error(err);
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
                area_id: area.id,
                zone_id: area.zone_id,
                site_id: area.zones.site_id,
                company_id: area.company_id,
                assigned_to: newAdHocTaskAssigneeId,
                created_by: user?.id,
                status: 'assigned',
                task_type: 'ad_hoc',
                assigned_at: new Date().toISOString()
            }]);
            if (insertError) throw insertError;
            onUpdate();
            onClose();
        } catch (err) {
            setError('Failed to create ad-hoc task.');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4 z-50" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b">
                    <h3 className="text-xl font-bold">Manage Tasks for: {area.name}</h3>
                    <p className="text-sm text-gray-500">{area.zones.sites.name} &gt; {area.zones.name}</p>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-lg border-b pb-2 mb-4">Scheduled Tasks for Today</h4>
                        {tasksToGenerateCount > 0 ? (
                            <div className="space-y-3">
                                <p>This area requires <span className="font-bold">{tasksToGenerateCount}</span> more scheduled cleaning task(s) today.</p>
                                <button onClick={handleGenerateTasks} disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50">
                                    {isSubmitting ? 'Generating...' : `Generate ${tasksToGenerateCount} Daily Task(s)`}
                                </button>
                            </div>
                        ) : ( <p className="text-gray-600">All required ({requiredTasks}) scheduled tasks for today have been generated.</p> )}
                    </div>
                    <div className="mb-8">
                        <h4 className="font-semibold text-lg border-b pb-2 mb-4">Assign Pending Tasks</h4>
                        {pendingTasks.length > 0 ? (
                            <div className="space-y-4">
                                <p>Assign all <span className="font-bold">{pendingTasks.length}</span> pending task(s) to a cleaner:</p>
                                <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className="w-full p-2 border rounded-md">
                                    <option value="">Select Cleaner...</option>
                                    {allCleaners.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                                </select>
                                <button onClick={handleAssignPendingTasks} disabled={isSubmitting || !assigneeId} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
                                    {isSubmitting ? 'Assigning...' : 'Assign Pending Tasks'}
                                </button>
                            </div>
                        ) : ( <p className="text-gray-500">No tasks are pending assignment.</p> )}
                    </div>
                    <div>
                        <h4 className="font-semibold text-lg border-b pb-2 mb-4">Create Ad-Hoc Task</h4>
                        <form onSubmit={handleCreateAdHocTask} className="space-y-4">
                            <input type="text" value={newAdHocTaskTitle} onChange={e => setNewAdHocTaskTitle(e.target.value)} placeholder="e.g., Urgent Spill Cleanup" className="w-full p-2 border rounded-md"/>
                            <select value={newAdHocTaskAssigneeId} onChange={e => setNewAdHocTaskAssigneeId(e.target.value)} className="w-full p-2 border rounded-md">
                                <option value="">Select Cleaner...</option>
                                {allCleaners.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                            </select>
                            <button type="submit" disabled={isSubmitting || !newAdHocTaskTitle || !newAdHocTaskAssigneeId} className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-50">
                                {isSubmitting ? 'Creating...' : 'Create & Assign Task'}
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

// --- 2. Inlined SupervisorDashboard ---
const SupervisorDashboard = ({ profile }) => {
    const [zones, setZones] = useState([]);
    const [cleaners, setCleaners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedArea, setSelectedArea] = useState(null);

    const fetchData = useCallback(async () => {
        if (!profile?.id || !profile?.company_id) return;
        try {
            setLoading(true);
            setError(null);

            const { data: assignedZones, error: zonesError } = await supabase.from('zone_assignments').select('zones!inner(*, sites(*))').eq('user_id', profile.id);
            if (zonesError) throw zonesError;

            const supervisorZones = assignedZones.map(z => z.zones).filter(Boolean);
            const zoneIds = supervisorZones.map(z => z.id);
            if (zoneIds.length === 0) {
                setZones([]); setLoading(false); return;
            }

            const { data: areasData, error: areasError } = await supabase.from('areas').select('*').in('zone_id', zoneIds);
            if (areasError) throw areasError;

            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);

            const { data: tasksData, error: tasksError } = await supabase.from('tasks').select('id, title, status, area_id, assigned_to, task_type, created_at').in('zone_id', zoneIds).gte('created_at', startOfToday.toISOString());
            if (tasksError) throw tasksError;

            const areasWithTasks = areasData.map(area => ({
                ...area,
                tasks: tasksData.filter(task => task.area_id === area.id) || []
            }));

            const areasByZone = areasWithTasks.reduce((acc, area) => {
                if (!acc[area.zone_id]) acc[area.zone_id] = [];
                acc[area.zone_id].push(area);
                return acc;
            }, {});

            const zonesWithAreas = supervisorZones.map(zone => ({
                ...zone,
                areas: areasByZone[zone.id] || []
            }));
            setZones(zonesWithAreas);

            const { data: cleanersData, error: cleanersError } = await supabase.from('profiles').select('id, full_name').eq('company_id', profile.company_id).eq('role', 'cleaner');
            if (cleanersError) throw cleanersError;
            setCleaners(cleanersData || []);

        } catch (err) {
            console.error("Error fetching supervisor data:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [profile]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const getCleanerName = (id) => cleaners.find(c => c.id === id)?.full_name || 'Unknown';

    if (loading) return <div className="p-6">Loading dashboard...</div>;
    if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
    
    return (
        <>
            <div className="p-6 bg-gray-50 min-h-screen">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Task Assignment Dashboard</h2>
                <div className="space-y-8">
                    {zones.length > 0 ? zones.map(zone => (
                        <div key={zone.id} className="bg-white p-4 rounded-lg shadow-md border">
                            <h3 className="text-xl font-semibold mb-1">{zone.name}</h3>
                            <p className="text-sm text-gray-500 mb-4">Site: {zone.sites.name}</p>
                            <div className="space-y-4">
                                {zone.areas?.length > 0 ? zone.areas.map(area => {
                                    const assignedTasks = area.tasks.filter(t => t.status === 'assigned');
                                    const pendingTaskCount = area.tasks.filter(t => t.status === 'pending').length;
                                    const todaysScheduledTaskCount = area.tasks.filter(t => t.task_type === 'scheduled').length;
                                    return (
                                        <div key={area.id} className="border rounded-md p-4 bg-gray-50">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold text-gray-800">{area.name}</p>
                                                    <p className="text-xs text-gray-600">Daily Tasks Generated: {todaysScheduledTaskCount} / {Number(area.daily_cleaning_frequency) || 0}</p>
                                                </div>
                                                <button onClick={() => setSelectedArea(area)} className="bg-blue-500 text-white py-1 px-3 text-sm rounded-md hover:bg-blue-600">Manage ({pendingTaskCount} Pending)</button>
                                            </div>
                                            <div className="mt-2 pl-4 border-l-2">
                                                 <h5 className="text-xs font-bold text-gray-500 uppercase mb-1">Assigned Tasks</h5>
                                                {assignedTasks.length > 0 ? (
                                                    <ul className="list-disc pl-5 space-y-1">
                                                        {assignedTasks.map(task => (<li key={task.id} className="text-sm text-gray-700">{task.title} - <span className="font-semibold">{getCleanerName(task.assigned_to)}</span></li>))}
                                                    </ul>
                                                ) : ( <p className="text-xs text-gray-500 italic">No tasks currently assigned.</p> )}
                                            </div>
                                        </div>
                                    );
                                }) : ( <p className="text-sm text-gray-500">No areas found in this zone.</p> )}
                            </div>
                        </div>
                    )) : (
                        <div className="bg-white p-6 rounded-lg shadow-md text-center">
                            <p className="text-gray-600">You are not assigned to any zones, or there are no areas in your assigned zones.</p>
                        </div>
                    )}
                </div>
            </div>
            <TaskManagementModal
                profile={profile}
                area={selectedArea ? { ...selectedArea, zones: zones.find(z => z.id === selectedArea.zone_id) } : null}
                isOpen={!!selectedArea}
                onClose={() => setSelectedArea(null)}
                onUpdate={fetchData}
                allCleaners={cleaners}
                todaysScheduledTaskCount={selectedArea ? selectedArea.tasks.filter(t => t.task_type === 'scheduled').length : 0}
            />
        </>
    );
}

// --- 3. Inlined Sidebar ---
const Sidebar = ({ navLinks, profile, setCurrentPage }) => (
    <div className="w-64 bg-gray-800 text-white flex-shrink-0 hidden md:flex md:flex-col">
      <div className="p-4">
        <h2 className="text-xl font-bold">PristinePoint</h2>
        <p className="text-sm text-gray-400">{profile?.full_name}</p>
      </div>
      <nav className="flex-1">
        <ul>
          {navLinks.map(link => (
            <li key={link.name}>
              <button
                onClick={() => setCurrentPage(link.name.toLowerCase().replace(' ', '-'))}
                className={`w-full text-left p-4 hover:bg-gray-700 ${link.current ? 'bg-gray-900' : ''}`}
              >
                {link.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
  
// --- 4. Inlined Header ---
const Header = ({ title, profile }) => (
    <header className="bg-white shadow-md p-4 flex justify-between items-center">
      <h1 className="text-2xl font-semibold text-gray-800 capitalize">{title.replace('-', ' ')}</h1>
      <div>
        <span className="text-gray-600">{profile?.full_name} ({profile?.role})</span>
      </div>
    </header>
  );

// --- END: Inlined Child Components ---


// Inline error boundary
class LocalErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('SupervisorLayout child error:', error, info); }
  render() {
    if (this.state.error) {
      return (
        <div className="m-6 p-4 rounded-md border border-red-200 bg-red-50 text-red-800">
          <div className="font-semibold mb-1">Something went wrong.</div>
          <pre className="text-xs whitespace-pre-wrap">{String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Main SupervisorLayout Component ---
export default function SupervisorLayout({ session, profile }) {
  if (!session?.user) return null;

  const safeProfile = useMemo(() => {
    const fallbackEmail = session?.user?.email ?? 'user@example.com';
    const baseProfile = profile || {};
    return {
      ...baseProfile,
      id: baseProfile.id ?? session?.user?.id ?? null,
      full_name: baseProfile.full_name ?? fallbackEmail,
      role: baseProfile.role ?? 'supervisor',
      company_id: baseProfile.company_id ?? null,
    };
  }, [profile, session]);

  const [currentPage, setCurrentPage] = useState('dashboard');

  const supervisorNavLinks = [
    { name: 'Dashboard',   current: currentPage === 'dashboard' },
    { name: 'My Tasks',    current: currentPage === 'my-tasks' },
    { name: 'Team Status', current: currentPage === 'team-status' },
    { name: 'Reports',     current: currentPage === 'reports' },
  ];

  const navigate = (page) => {
    const valid = ['dashboard', 'my-tasks', 'team-status', 'reports'];
    setCurrentPage(valid.includes(page) ? page : 'dashboard');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <SupervisorDashboard profile={safeProfile} session={session} />;
      case 'my-tasks':
        return <div className="p-6 bg-white rounded-lg shadow-md">My Tasks page coming soon.</div>;
      case 'team-status':
        return <div className="p-6 bg-white rounded-lg shadow-md">Team Status page coming soon.</div>;
      case 'reports':
        return <div className="p-6 bg-white rounded-lg shadow-md">Reports page coming soon.</div>;
      default:
        return <SupervisorDashboard profile={safeProfile} session={session} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        navLinks={supervisorNavLinks}
        user={session.user}
        profile={safeProfile}
        currentPage={currentPage}
        setCurrentPage={navigate}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={currentPage} user={session?.user} profile={safeProfile} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200">
          <div className="container mx-auto px-6 py-8">
            <LocalErrorBoundary>
              {renderPage()}
            </LocalErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}

