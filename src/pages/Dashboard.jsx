import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

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
  const [stats, setStats] = useState({
    totalSites: 0,
    activeStaff: 0,
    tasksCompletedToday: 0,
    openIssues: 0,
  });
  const [completionChartData, setCompletionChartData] = useState([]);
  const [complianceChartData, setComplianceChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          complianceTrend, // Fetch new compliance data
        ] = await Promise.all([
          supabase.from('sites').select('*', { count: 'exact', head: true }).eq('company_id', profile.company_id),
          supabase.rpc('count_active_staff', { p_company_id: profile.company_id }),
          supabase.rpc('count_tasks_completed_today', { p_company_id: profile.company_id }),
          supabase.rpc('count_open_issues', { p_company_id: profile.company_id }),
          supabase.rpc('get_task_completion_trend_7_days', { p_company_id: profile.company_id }),
          supabase.rpc('get_compliance_trend_30_days', { p_company_id: profile.company_id }),
        ]);

        // Check for errors in each response
        const errors = [sitesCount, activeStaff, tasksCompleted, openIssues, completionTrend, complianceTrend].filter(res => res.error);
        if (errors.length > 0) throw errors[0].error;

        setStats({
          totalSites: sitesCount.count || 0,
          activeStaff: activeStaff.data || 0,
          tasksCompletedToday: tasksCompleted.data || 0,
          openIssues: openIssues.data || 0,
        });
        
        // Format data for both charts
        setCompletionChartData((completionTrend.data || []).map(d => ({
            name: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            Completed: d.count,
        })));

        setComplianceChartData((complianceTrend.data || []).map(d => ({
            name: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            Compliance: parseFloat((d.rate * 100).toFixed(1)),
        })));

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
      {/* --- Section 1: Interactive KPI Cards --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total Sites" value={stats.totalSites} icon="fa-sitemap" color="purple" linkTo="/sites" />
        <KpiCard title="Active Staff" value={stats.activeStaff} icon="fa-users" color="blue" linkTo="/staff" />
        <KpiCard title="Tasks Completed Today" value={stats.tasksCompletedToday} icon="fa-check-circle" color="green" linkTo="/tasks" />
        <KpiCard title="Open Issues" value={stats.openIssues} icon="fa-exclamation-triangle" color="red" linkTo="/issues" />
      </div>

      {/* --- Section 2: Data Visualization (Charts) --- */}
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
                    <Bar dataKey="Compliance" fill="#8884d8" />
                </BarChart>
            </ResponsiveContainer>
           </div>
        </div>
      </div>
      
      {/* --- Section 3: Actionable Reports --- */}
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

