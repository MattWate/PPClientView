// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export default function DashboardPage({ profile }) {
  const [stats, setStats] = useState({ completed: 0, issues: 0, active: 0, compliance: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [openIssues, setOpenIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!profile) return;
      try {
        setLoading(true);
        
        // Fetch stats in parallel
        const [completed, issues, activity, compliance] = await Promise.all([
          supabase.rpc('count_tasks_today', { p_company_id: profile.company_id, p_statuses: ['completed', 'verified'] }),
          supabase.rpc('count_tasks_today', { p_company_id: profile.company_id, p_task_type: 'issue' }),
          supabase.rpc('count_active_staff_today', { p_company_id: profile.company_id }),
          supabase.rpc('calculate_compliance_rate', { p_company_id: profile.company_id })
        ]);

        setStats({
          completed: completed.data || 0,
          issues: issues.data || 0,
          active: activity.data || 0,
          compliance: compliance.data ? (compliance.data * 100).toFixed(1) : 0
        });

        // Fetch recent activity
        const { data: activityData, error: activityError } = await supabase
            .from('tasks')
            .select('*, profiles:completed_by(full_name), areas(name, zones(name, sites(name)))')
            .eq('company_id', profile.company_id)
            .order('created_at', { ascending: false })
            .limit(5);
        if (activityError) throw activityError;
        setRecentActivity(activityData);

        // Fetch open issues
        const { data: issuesData, error: issuesError } = await supabase
            .from('tasks')
            .select('*, areas(name, zones(name, sites(name)))')
            .eq('company_id', profile.company_id)
            .eq('task_type', 'issue')
            .neq('status', 'verified')
            .order('created_at', { ascending: true });
        if(issuesError) throw issuesError;
        setOpenIssues(issuesData);

      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [profile]);

  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Tasks Completed Today" value={stats.completed} icon="fa-check-circle" color="green" />
        <KpiCard title="Issues Reported Today" value={stats.issues} icon="fa-exclamation-triangle" color="red" />
        <KpiCard title="Staff Active Today" value={stats.active} icon="fa-user-clock" color="blue" />
        <KpiCard title="Compliance Rate (30d)" value={`${stats.compliance}%`} icon="fa-clipboard-check" color="yellow" />
      </div>

      {/* Recent Activity & Open Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h3>
          <ul className="space-y-4">
            {recentActivity.map(task => (
              <li key={task.id} className="flex items-center space-x-4">
                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500">
                  <i className="fas fa-tasks"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {task.profiles?.full_name || 'System'} completed "{task.title}"
                  </p>
                  <p className="text-xs text-gray-500">
                    {task.areas.sites.name} > {task.areas.zones.name} > {task.areas.name}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Open Issues</h3>
          <ul className="space-y-3">
            {openIssues.map(issue => (
              <li key={issue.id} className="p-3 bg-red-50 rounded-md">
                <p className="font-semibold text-red-800">{issue.title}</p>
                <p className="text-xs text-red-600">{issue.areas.sites.name} > {issue.areas.zones.name} > {issue.areas.name}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

const KpiCard = ({ title, value, icon, color }) => {
  const colors = {
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  };
  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
      </div>
      <div className={`${colors[color]} p-3 rounded-full`}>
        <i className={`fas ${icon} text-2xl`}></i>
      </div>
    </div>
  );
};
