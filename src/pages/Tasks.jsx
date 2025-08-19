// src/pages/Tasks.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

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
  const [newScheduledJob, setNewScheduledJob] = useState({ title: '', area_id: '', cron_schedule: '' });
  
  const fetchPageData = async () => {
    if (!profile) return;
    try {
      setLoading(true);
      const { data: areaTypesData, error: areaTypesError } = await supabase
        .from('area_types')
        .select('*, job_templates (*)')
        .eq('company_id', profile.company_id);
      if (areaTypesError) throw areaTypesError;
      setAreaTypes(areaTypesData);

      const { data: scheduledJobsData, error: scheduledJobsError } = await supabase
        .from('scheduled_jobs')
        .select('*, areas(name, zones(name, sites(name)))')
        .eq('company_id', profile.company_id);
      if (scheduledJobsError) throw scheduledJobsError;
      setScheduledJobs(scheduledJobsData);

      const { data: sitesData, error: sitesError } = await supabase
        .from('sites')
        .select('*, zones(*, areas(*))')
        .eq('company_id', profile.company_id);
      if (sitesError) throw sitesError;
      setSites(sitesData);

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPageData();
  }, [profile]);

  const handleCreateAreaType = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('area_types')
      .insert({ name: newAreaTypeName, company_id: profile.company_id })
      .select('*, job_templates (*)')
      .single();
    if (error) setError(error.message);
    else {
      setAreaTypes([...areaTypes, data]);
      setNewAreaTypeName('');
    }
  };

  const handleCreateJobTemplate = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('job_templates')
      .insert({ description: newJobDescription, area_type_id: selectedAreaType.id })
      .select()
      .single();
    if (error) setError(error.message);
    else {
      fetchPageData(); // Refresh all data
      setNewJobDescription('');
    }
  };

  const handleCreateScheduledJob = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('scheduled_jobs')
      .insert({ ...newScheduledJob, company_id: profile.company_id });
    
    if (error) setError(error.message);
    else {
      fetchPageData(); // Refresh all data
      setNewScheduledJob({ title: '', area_id: '', cron_schedule: '' });
    }
  };

  if (loading) return <p>Loading templates & schedules...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="space-y-6">
      {/* Area Types and Job Templates Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          {/* ... existing area types code ... */}
        </div>
        <div>
          {/* ... existing create area type and job template forms ... */}
        </div>
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
                  <th className="py-3 px-4">Schedule (Cron)</th>
                </tr>
              </thead>
              <tbody>
                {scheduledJobs.map(job => (
                  <tr key={job.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{job.title}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{job.areas.sites.name} > {job.areas.zones.name} > {job.areas.name}</td>
                    <td className="py-3 px-4 font-mono text-sm">{job.cron_schedule}</td>
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
              <input type="text" value={newScheduledJob.title} onChange={e => setNewScheduledJob({...newScheduledJob, title: e.target.value})} required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Area</label>
              <select value={newScheduledJob.area_id} onChange={e => setNewScheduledJob({...newScheduledJob, area_id: e.target.value})} required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm">
                <option value="">Select an Area</option>
                {sites.map(site => (
                  <optgroup key={site.id} label={site.name}>
                    {site.zones.map(zone => (
                      <optgroup key={zone.id} label={`-- ${zone.name}`}>
                        {zone.areas.map(area => (
                          <option key={area.id} value={area.id}>{`--- ${area.name}`}</option>
                        ))}
                      </optgroup>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Cron Schedule</label>
              <input type="text" value={newScheduledJob.cron_schedule} onChange={e => setNewScheduledJob({...newScheduledJob, cron_schedule: e.target.value})} required placeholder="e.g., 0 8 * * 1-5" className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm font-mono" />
              <p className="text-xs text-gray-500 mt-1">e.g., "0 8 * * 1-5" for 8am on weekdays.</p>
            </div>
            <button type="submit" className="w-full py-2 px-4 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700">Schedule Job</button>
          </form>
        </div>
      </div>
    </div>
  );
}
