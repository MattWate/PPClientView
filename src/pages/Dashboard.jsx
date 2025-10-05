import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

// --- KpiCard Component Updated for Hash Navigation ---
const KpiCard = ({ title, value, icon, color, linkTo, setCurrentPage }) => {
  const colors = {
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    blue: 'bg-blue-100 text-blue-600',
  };

  const cardContent = (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between transition-shadow hover:shadow-lg h-full">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
      </div>
      <div className={`${colors[color]} p-4 rounded-full`}>
        <i className={`fas ${icon} text-2xl`}></i>
      </div>
    </div>
  );

  if (linkTo) {
    return (
      <a
        href={`#/${linkTo}`}
        onClick={(e) => {
          e.preventDefault();
          setCurrentPage(linkTo);
          window.location.hash = `/${linkTo}`;
        }}
      >
        {cardContent}
      </a>
    );
  }

  return cardContent;
};


export default function DashboardPage({ profile, setCurrentPage }) {
  const [stats, setStats] = useState({ totalSites: 0, activeStaff: 0, tasksCompletedToday: 0, openIssues: 0 });
  const [completionChartData, setCompletionChartData] = useState([]);
  const [complianceChartData, setComplianceChartData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [openIssues, setOpenIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [slaThreshold, setSlaThreshold] = useState(90);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!profile?.company_id) return;
      try {
        setLoading(true);
        setError(null);
        
        const [
          sitesCount,
          activeStaff,
          tasksCompleted,
          openIssues,
          completionTrend,
          complianceTrend,
          activityData,
          issuesData
        ] = await Promise.all([
          supabase.from('sites').select('*', { count: 'exact', head: true }).eq('company_id', profile.company_id),
          supabase.rpc('count_active_staff', { p_company_id: profile.company_id }),
          supabase.rpc('count_tasks_completed_today', { p_company_id: profile.company_id }),
          supabase.rpc('count_open_issues', { p_company_id: profile.company_id }),
          supabase.rpc('get_task_completion_trend_7_days', { p_company_id: profile.company_id }),
          supabase.rpc('get_compliance_trend_30_days', { p_company_id: profile.company_id }),
          supabase.from('tasks').select('*, areas(name, zones(name, sites(name))), profiles:completed_by(full_name)').eq('company_id', profile.company_id).in('status', ['completed', 'verified']).not('completed_at', 'is', null).order('completed_at', { ascending: false }).limit(5),
          supabase.from('tasks').select('*, areas(name, zones(name, sites(name)))').eq('company_id', profile.company_id).eq('task_type', 'issue').neq('status', 'verified').order('created_at', { ascending: true })
        ]);

        const errors = [sitesCount, activeStaff, tasksCompleted, openIssues, completionTrend, complianceTrend, activityData, issuesData].filter(res => res.error);
        if (errors.length > 0) throw errors[0].error;

        setStats({
          totalSites: sitesCount.count || 0,
          activeStaff: activeStaff.data || 0,
          tasksCompletedToday: tasksCompleted.data || 0,
          openIssues: openIssues.data || 0,
        });
        
        setCompletionChartData((completionTrend.data || []).map(d => ({ name: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), Completed: d.count })));
        setComplianceChartData((complianceTrend.data || []).map(d => ({ name: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), Compliance: parseFloat((d.rate * 100).toFixed(1)) })));
        setRecentActivity(activityData.data || []);
        setOpenIssues(issuesData.data || []);

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [profile]);

  if (loading) return <p className="p-6">Loading dashboard...</p>;
  if (error) return <p className="p-6 text-red-600">Error: {error}</p>;

  return (
    <div className="space-y-8">
        <div className="bg-white p-4 rounded-lg shadow-md">
            <label htmlFor="sla" className="text-sm font-medium text-gray-700">Compliance SLA: {slaThreshold}%</label>
            <input id="sla" type="range" min="50" max="100" value={slaThreshold} onChange={e => setSlaThreshold(parseInt(e.target.value, 10))} className="w-full mt-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/>
        </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total Sites" value={stats.totalSites} icon="fa-sitemap" color="purple" linkTo="sites" setCurrentPage={setCurrentPage} />
        <KpiCard title="Active Staff" value={stats.activeStaff} icon="fa-users" color="blue" linkTo="staff" setCurrentPage={setCurrentPage} />
        <KpiCard title="Tasks Completed Today" value={stats.tasksCompletedToday} icon="fa-check-circle" color="green" linkTo="tasks" setCurrentPage={setCurrentPage} />
        <KpiCard title="Open Issues" value={stats.openIssues} icon="fa-exclamation-triangle" color="red" linkTo="issues" setCurrentPage={setCurrentPage} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Task Completion Trend (Last 7 Days)</h3>
            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={completionChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" stroke="#6b7280" /><YAxis stroke="#6b7280" allowDecimals={false} /><Tooltip /><Legend /><Line type="monotone" dataKey="Completed" stroke="#10b981" strokeWidth={2} activeDot={{ r: 8 }} /></LineChart></ResponsiveContainer></div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
           <h3 className="text-xl font-semibold text-gray-800 mb-4">Compliance Rate Trend (30d)</h3>
           <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={complianceChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 10 }} /><YAxis stroke="#6b7280" unit="%" domain={[0, 100]} /><Tooltip formatter={(value) => `${value}%`} /><Bar dataKey="Compliance">{complianceChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.Compliance < slaThreshold ? '#f97316' : '#8884d8'} />))}</Bar></BarChart></ResponsiveContainer></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h3>
          <ul className="space-y-4">
            {recentActivity.length > 0 ? recentActivity.map(task => (
              <li key={task.id} className="flex items-center space-x-4">
                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500"><i className="fas fa-tasks"></i></div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{task.profiles?.full_name || 'System'} <span className="font-normal text-gray-600">{task.status === 'verified' ? 'verified' : 'completed'}</span> "{task.title}"</p>
                  <p className="text-xs text-gray-500">{task.areas?.sites?.name} &gt; {task.areas?.zones?.name} &gt; {task.areas?.name}</p>
                </div>
              </li>
            )) : <p className="text-sm text-gray-500">No recent activity to display.</p>}
          </ul>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Open Issues</h3>
          <ul className="space-y-3">
            {openIssues.length > 0 ? openIssues.map(issue => (
              <li key={issue.id} className="p-3 bg-red-50 rounded-md">
                <p className="font-semibold text-red-800">{issue.title}</p>
                <p className="text-xs text-red-600">{issue.areas?.sites?.name} &gt; {issue.areas?.zones?.name} &gt; {issue.areas?.name}</p>
              </li>
            )) : <p className="text-sm text-gray-500">No open issues.</p>}
          </ul>
        </div>
      </div>
    </div>
  );
}

