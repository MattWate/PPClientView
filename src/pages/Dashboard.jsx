import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

// --- Reusable, Clickable KPI Card Component ---
const KpiCard = ({ title, value, icon, color, linkTo }) => {
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
  return linkTo ? <Link to={linkTo}>{cardContent}</Link> : cardContent;
};

export default function DashboardPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ totalSites: 0, activeStaff: 0, tasksCompletedToday: 0, openIssues: 0 });
  const [completionChartData, setCompletionChartData] = useState([]);
  const [complianceChartData, setComplianceChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [sites, setSites] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState('all');
  const [selectedSupervisorId, setSelectedSupervisorId] = useState('all');
  const [slaThreshold, setSlaThreshold] = useState(90);

  // Effect to fetch the list of sites and supervisors for the filter dropdowns
  useEffect(() => {
    const fetchFilterData = async () => {
      if (!profile?.company_id) return;
      try {
        const { data: sitesData, error: sitesError } = await supabase.from('sites').select('id, name').eq('company_id', profile.company_id);
        if (sitesError) throw sitesError;
        setSites(sitesData || []);

        const { data: supervisorsData, error: supervisorsError } = await supabase.from('profiles').select('id, full_name').eq('company_id', profile.company_id).eq('role', 'supervisor');
        if (supervisorsError) throw supervisorsError;
        setSupervisors(supervisorsData || []);
      } catch (err) {
        console.error("Error fetching filter data:", err);
      }
    };
    fetchFilterData();
  }, [profile]);


  // Main data fetching effect, now sensitive to filter changes
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!profile?.company_id) return;
      try {
        setLoading(true);
        setError(null);
        
        const rpcParams = {
            p_company_id: profile.company_id,
            p_site_id: selectedSiteId === 'all' ? null : selectedSiteId,
            p_supervisor_id: selectedSupervisorId === 'all' ? null : selectedSupervisorId,
        };

        const [
          sitesCount,
          activeStaff,
          tasksCompleted,
          openIssues,
          completionTrend,
          complianceTrend,
        ] = await Promise.all([
          supabase.from('sites').select('*', { count: 'exact', head: true }).eq('company_id', profile.company_id),
          supabase.rpc('count_active_staff', { p_company_id: rpcParams.p_company_id, p_supervisor_id: rpcParams.p_supervisor_id }),
          supabase.rpc('count_tasks_completed_today', rpcParams),
          supabase.rpc('count_open_issues', rpcParams),
          supabase.rpc('get_task_completion_trend_7_days', rpcParams),
          supabase.rpc('get_compliance_trend_30_days', {p_company_id: profile.company_id}),
        ]);

        const errors = [sitesCount, activeStaff, tasksCompleted, openIssues, completionTrend, complianceTrend].filter(res => res.error);
        if (errors.length > 0) throw errors[0].error;

        setStats({
          totalSites: sitesCount.count || 0,
          activeStaff: activeStaff.data || 0,
          tasksCompletedToday: tasksCompleted.data || 0,
          openIssues: openIssues.data || 0,
        });
        
        setCompletionChartData((completionTrend.data || []).map(d => ({ name: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), Completed: d.count })));
        setComplianceChartData((complianceTrend.data || []).map(d => ({ name: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), Compliance: parseFloat((d.rate * 100).toFixed(1)) })));

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [profile, selectedSiteId, selectedSupervisorId]);

  if (loading) return <p className="p-6">Loading dashboard...</p>;
  if (error) return <p className="p-6 text-red-600">Error: {error}</p>;

  return (
    <div className="space-y-8">
        <div className="bg-white p-4 rounded-lg shadow-md flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 w-full sm:w-auto">
                <label className="text-sm font-medium text-gray-700">Filter by Site</label>
                <select value={selectedSiteId} onChange={e => setSelectedSiteId(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm">
                    <option value="all">All Sites</option>
                    {sites.map(site => <option key={site.id} value={site.id}>{site.name}</option>)}
                </select>
            </div>
            <div className="flex-1 w-full sm:w-auto">
                <label className="text-sm font-medium text-gray-700">Filter by Supervisor</label>
                <select value={selectedSupervisorId} onChange={e => setSelectedSupervisorId(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm">
                    <option value="all">All Supervisors</option>
                    {supervisors.map(sup => <option key={sup.id} value={sup.id}>{sup.full_name}</option>)}
                </select>
            </div>
             <div className="flex-1 w-full sm:w-auto">
                <label htmlFor="sla" className="text-sm font-medium text-gray-700">Compliance SLA: {slaThreshold}%</label>
                <input id="sla" type="range" min="50" max="100" value={slaThreshold} onChange={e => setSlaThreshold(parseInt(e.target.value, 10))} className="w-full mt-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/>
            </div>
        </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total Sites" value={stats.totalSites} icon="fa-sitemap" color="purple" linkTo="/sites" />
        <KpiCard title="Active Staff" value={stats.activeStaff} icon="fa-users" color="blue" linkTo="/staff" />
        <KpiCard title="Tasks Completed Today" value={stats.tasksCompletedToday} icon="fa-check-circle" color="green" linkTo="/tasks" />
        <KpiCard title="Open Issues" value={stats.openIssues} icon="fa-exclamation-triangle" color="red" linkTo="/issues" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Task Completion Trend (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={completionChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="Completed" stroke="#10b981" strokeWidth={2} activeDot={{ r: 8 }} />
                </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
           <h3 className="text-xl font-semibold text-gray-800 mb-4">Compliance Rate Trend (30d)</h3>
           <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complianceChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#6b7280" unit="%" domain={[0, 100]} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Bar dataKey="Compliance">
                        {complianceChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.Compliance < slaThreshold ? '#f97316' : '#8884d8'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
           </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Reports</h3>
        <div className="flex items-center space-x-4">
            <button className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300">Generate Site Report</button>
            <button className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300">Generate Staff Report</button>
        </div>
         <p className="text-sm text-gray-500 mt-2">Reporting engine coming soon...</p>
      </div>
    </div>
  );
}

