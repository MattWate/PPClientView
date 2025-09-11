import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient.js';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Helper function to convert CRON to human-readable format
const parseCron = (cronString) => {
    if (!cronString) return 'N/A';
    const parts = cronString.split(' ');
    if (parts.length < 5) return 'Invalid Schedule';

    const minute = parts[0].padStart(2, '0');
    const hour = parts[1].padStart(2, '0');
    const dayOfMonth = parts[2];
    const month = parts[3];
    const dayOfWeek = parts[4];

    const formattedTime = `${hour}:${minute}`;
    const monthMap = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    if (dayOfMonth !== '*' && month !== '*' && dayOfWeek === '*') {
        if (month.includes(',')) {
             return `Quarterly on day ${dayOfMonth} at ${formattedTime}`;
        }
        return `Annually on ${monthMap[parseInt(month) - 1]} ${dayOfMonth} at ${formattedTime}`;
    }
    if (dayOfMonth !== '*' && month === '*' && dayOfWeek === '*') {
        return `Monthly on day ${dayOfMonth} at ${formattedTime}`;
    }
    if (dayOfWeek !== '*') {
        const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const days = dayOfWeek.split(',').map(d => dayMap[parseInt(d)] || '').join(', ');
        return `Weekly on ${days} at ${formattedTime}`;
    }
    return `Daily at ${formattedTime}`;
};


export default function TasksPage({ profile }) {
  const [areaTypes, setAreaTypes] = useState([]);
  const [scheduledJobs, setScheduledJobs] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [newAreaTypeName, setNewAreaTypeName] = useState('');
  const [selectedAreaType, setSelectedAreaType] = useState(null);
  const [newJobDescription, setNewJobDescription] = useState('');
  const [newScheduledJob, setNewScheduledJob] = useState({ title: '', area_id: '' });
  
  // --- NEW: Updated schedule state to handle more options ---
  const [schedule, setSchedule] = useState({
    type: 'daily',
    time: '08:00',
    days: [], // for weekly
    dayOfMonth: 1, // for monthly & annually
    month: 1, // for annually
  });

  const fetchPageData = async () => {
    if (!profile) return;
    try {
      setLoading(true);
      setError(null);

      const { data: areaTypesData, error: areaTypesError } = await supabase
        .from('area_types')
        .select('id,name, job_templates(id,description)')
        .eq('company_id', profile.company_id);
      if (areaTypesError) throw areaTypesError;
      setAreaTypes(areaTypesData ?? []);

      const { data: scheduledJobsData, error: scheduledJobsError } = await supabase
        .from('scheduled_jobs')
        .select(`
          id, title, cron_schedule,
          areas:areas!scheduled_jobs_area_id_fkey(
            id, name,
            zones:zones(
              id, name,
              sites:sites(id, name)
            )
          )
        `)
        .eq('company_id', profile.company_id);
      if (scheduledJobsError) throw scheduledJobsError;
      setScheduledJobs(scheduledJobsData ?? []);

      const { data: sitesData, error: sitesError } = await supabase
        .from('sites')
        .select('id,name, zones(id,name, areas(id,name))')
        .eq('company_id', profile.company_id);
      if (sitesError) throw sitesError;
      setSites(sitesData ?? []);
    } catch (err) {
      setError(err.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPageData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleCreateAreaType = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const { data, error } = await supabase
        .from('area_types')
        .insert({ name: newAreaTypeName.trim(), company_id: profile.company_id })
        .select('id,name, job_templates(id,description)')
        .single();
      if (error) throw error;

      setAreaTypes(prev => [...prev, data]);
      setNewAreaTypeName('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateJobTemplate = async (e) => {
    e.preventDefault();
    if (!selectedAreaType) return;
    try {
      setError(null);
      const { error } = await supabase
        .from('job_templates')
        .insert({ description: newJobDescription.trim(), area_type_id: selectedAreaType.id });
      if (error) throw error;

      await fetchPageData();

      setAreaTypes(prev => {
        const updated = prev.find(t => t.id === selectedAreaType.id);
        if (updated) setSelectedAreaType(updated);
        return prev;
      });

      setNewJobDescription('');
    } catch (err) {
      setError(err.message);
    }
  };

  // --- NEW: Updated logic to generate advanced CRON schedules ---
  const handleCreateScheduledJob = async (e) => {
    e.preventDefault();
    try {
      const [hour, minute] = schedule.time.split(':');
      let cron_schedule = '';

      switch (schedule.type) {
        case 'daily':
          cron_schedule = `${minute} ${hour} * * *`;
          break;
        case 'weekly':
          if (schedule.days.length === 0) {
            setError('Please select at least one day for weekly schedules.');
            return;
          }
          cron_schedule = `${minute} ${hour} * * ${[...schedule.days].sort().join(',')}`;
          break;
        case 'monthly':
          cron_schedule = `${minute} ${hour} ${schedule.dayOfMonth} * *`;
          break;
        case 'quarterly':
          cron_schedule = `${minute} ${hour} ${schedule.dayOfMonth} 1,4,7,10 *`;
          break;
        case 'annually':
          cron_schedule = `${minute} ${hour} ${schedule.dayOfMonth} ${schedule.month} *`;
          break;
        default:
          throw new Error('Invalid schedule type');
      }

      if (!UUID_RE.test(newScheduledJob.area_id)) {
        setError('Please choose a valid Area before scheduling the job.');
        return;
      }

      const payload = {
        title: newScheduledJob.title.trim(),
        area_id: newScheduledJob.area_id,
        company_id: profile.company_id,
        cron_schedule,
      };

      const { error } = await supabase.from('scheduled_jobs').insert(payload);
      if (error) throw error;

      await fetchPageData();
      setNewScheduledJob({ title: '', area_id: '' });
      setSchedule({ type: 'daily', time: '08:00', days: [], dayOfMonth: 1, month: 1 });
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDayToggle = (day) => {
    setSchedule(prev => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day]
    }));
  };

  const areasExist =
    (sites ?? []).some(s => (s.zones ?? []).some(z => (z.areas ?? []).length > 0));

  if (loading) return <p>Loading templates & schedules...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="space-y-8">
      {/* Area Types and Job Templates Section (No changes here) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Area Types &amp; Job Templates</h3>
          <div className="space-y-4">
            {(areaTypes ?? []).map(type => (
              <div
                key={type.id}
                className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedAreaType(type)}
              >
                <h4 className="font-semibold text-lg text-gray-700">{type.name}</h4>
                <p className="text-sm text-gray-500">
                  {(type.job_templates ?? []).length} standard jobs
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Create New Area Type</h3>
            <form onSubmit={handleCreateAreaType} className="flex items-center space-x-2">
              <input
                type="text"
                value={newAreaTypeName}
                onChange={e => setNewAreaTypeName(e.target.value)}
                required
                placeholder="e.g., Standard Office"
                className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
              <button
                type="submit"
                className="py-2 px-4 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Create
              </button>
            </form>
          </div>
        </div>

        {selectedAreaType && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Jobs for &quot;{selectedAreaType.name}&quot;
            </h3>
            <ul className="space-y-2 mb-6">
              {(selectedAreaType.job_templates ?? []).map(job => (
                <li key={job.id} className="p-2 rounded-md bg-gray-100">
                  {job.description}
                </li>
              ))}
            </ul>
            <form onSubmit={handleCreateJobTemplate} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">New Job Description</label>
                <input
                  type="text"
                  value={newJobDescription}
                  onChange={e => setNewJobDescription(e.target.value)}
                  required
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Add Job
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Scheduled Jobs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Scheduled Jobs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b">
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Schedule</th>
                </tr>
              </thead>
              <tbody>
                {(scheduledJobs ?? []).map(job => (
                  <tr key={job.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{job.title}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {job.areas?.zones?.sites?.name ?? '—'} &nbsp;&gt;&nbsp;
                      {job.areas?.zones?.name ?? '—'} &nbsp;&gt;&nbsp;
                      {job.areas?.name ?? '—'}
                    </td>
                    <td className="py-3 px-4 text-sm">{parseCron(job.cron_schedule)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Create Scheduled Job</h3>
          <form onSubmit={handleCreateScheduledJob} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Job Title</label>
              <input
                type="text"
                value={newScheduledJob.title}
                onChange={e => setNewScheduledJob({ ...newScheduledJob, title: e.target.value })}
                required
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Area</label>
              <select
                value={newScheduledJob.area_id || ''}
                onChange={e =>
                  setNewScheduledJob({
                    ...newScheduledJob,
                    area_id: e.target.value,
                  })
                }
                required
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
              >
                <option value="" disabled hidden>
                  Select an Area
                </option>
                {(sites ?? []).map(site => (
                  <optgroup key={site.id} label={site.name}>
                    {(site.zones ?? []).flatMap(zone =>
                      (zone.areas ?? []).map(area => (
                        <option key={area.id} value={area.id}>
                          {zone.name} — {area.name}
                        </option>
                      ))
                    )}
                  </optgroup>
                ))}
              </select>
              {!areasExist && (
                <p className="mt-1 text-xs text-amber-700">
                  No Areas found. Create Zones &amp; Areas under Sites first.
                </p>
              )}
            </div>

            {/* --- NEW: Updated Frequency Dropdown and Conditional Inputs --- */}
            <div>
              <label className="text-sm font-medium text-gray-700">Frequency</label>
              <select
                value={schedule.type}
                onChange={e => setSchedule({ ...schedule, type: e.target.value, days: [] })}
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            </div>

            {schedule.type === 'weekly' && (
              <div>
                <label className="text-sm font-medium text-gray-700">Days of the Week</label>
                <div className="flex space-x-1 mt-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
                    const active = schedule.days.includes(index);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => handleDayToggle(index)}
                        aria-pressed={active}
                        className={`w-full px-2 py-1 rounded-md text-sm border ${
                          active
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-gray-100 text-gray-800 border-gray-300'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {['monthly', 'quarterly', 'annually'].includes(schedule.type) && (
                 <div>
                    <label className="text-sm font-medium text-gray-700">Day of Month</label>
                    <input
                        type="number"
                        value={schedule.dayOfMonth}
                        onChange={e => setSchedule({ ...schedule, dayOfMonth: parseInt(e.target.value) })}
                        min="1" max="31" required
                        className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
                    />
                 </div>
            )}

            {schedule.type === 'annually' && (
                 <div>
                    <label className="text-sm font-medium text-gray-700">Month</label>
                    <select
                        value={schedule.month}
                        onChange={e => setSchedule({ ...schedule, month: parseInt(e.target.value) })}
                        required
                        className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>{new Date(0, m-1).toLocaleString('default', { month: 'long' })}</option>
                        ))}
                    </select>
                 </div>
            )}


            <div>
              <label className="text-sm font-medium text-gray-700">Time</label>
              <input
                type="time"
                value={schedule.time}
                onChange={e => setSchedule({ ...schedule, time: e.target.value })}
                required
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
            >
              Schedule Job
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

