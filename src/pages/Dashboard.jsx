import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- RESTORED: This is needed for ReportGeneratorModal
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';

// --- Reusable, Clickable KPI Card Component ---
const KpiCard = ({ title, value, icon, color, linkTo, onNavigate }) => {
  const colors = {
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    blue: 'bg-blue-100 text-blue-600',
  };

  const handleClick = () => {
    if (linkTo && onNavigate) {
      onNavigate(linkTo);
    }
  };

  return (
    <div onClick={handleClick} className={`bg-white p-6 rounded-lg shadow-md flex items-center justify-between transition-shadow hover:shadow-lg h-full ${linkTo ? 'cursor-pointer' : ''}`}>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
      </div>
      <div className={`${colors[color]} p-4 rounded-full`}>
        <i className={`fas ${icon} text-2xl`}></i>
      </div>
    </div>
  );
};

// --- Modal for Generating Reports ---
const ReportGeneratorModal = ({ isOpen, onClose, sites }) => {
  const navigate = useNavigate();
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleGenerateReport = () => {
    if (!selectedSiteId || !startDate || !endDate) {
      alert('Please select a site and a date range.');
      return;
    }
    const reportUrl = `/report/site?siteId=${selectedSiteId}&startDate=${startDate}&endDate=${endDate}`;
    navigate(reportUrl);
    onClose();
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full m-4">
        <div className="p-6 border-b">
          <h3 className="text-xl font-semibold">Generate Site Compliance Report</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Select Site</label>
            <select
              value={selectedSiteId}
              onChange={e => setSelectedSiteId(e.target.value)}
              className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="" disabled>Choose a site...</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end p-4 bg-gray-50 rounded-b-lg space-x-2">
          <button onClick={onClose} className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300">Cancel</button>
          <button onClick={handleGenerateReport} className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">Generate Report</button>
        </div>
      </div>
    </div>
  );
};

export default function DashboardPage({ profile, setCurrentPage }) {
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
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Fetch dropdown filter data
  useEffect(() => {
    if (!profile?.company_id) return;
    const fetchFilterData = async () => {
      try {
        const { data: sitesData, error: sitesError } = await supabase.from('sites').select('id, name').eq('company_id', profile.company_id);
        if (sitesError) throw sitesError;

        const { data: supervisorsData, error: supervisorsError } = await supabase.from('profiles').select('id, full_name').eq('company_id', profile.company_id).eq('role', 'supervisor');
        if (supervisorsError) throw supervisorsError;

        setSites(sitesData || []);
        setSupervisors(supervisorsData || []);
      } catch (err) {
        console.error('Error fetching filter data:', err);
      }
    };
    fetchFilterData();
  }, [profile?.company_id]);

  // Fetch main dashboard data
  useEffect(() => {
    if (!profile?.company_id) return;
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const rpcParams = {
          p_company_id: profile.company_id,
          p_site_id: selectedSiteId === 'all' ? null : selectedSiteId,
          p_supervisor_id: selectedSupervisorId === 'all' ? null : selectedSupervisorId,
        };

        const [sitesCount, activeStaff, tasksCompleted, openIssues, completionTrend, complianceTrend] = await Promise.all([
          supabase.from('sites').select('*', { count: 'exact', head: true }).eq('company_id', profile.company_id),
          supabase.rpc('count_active_staff', { p_company_id: rpcParams.p_company_id, p_supervisor_id: rpcParams.p_supervisor_id }),
          supabase.rpc('count_tasks_completed_today', rpcParams),
          supabase.rpc('count_open_issues', rpcParams),
          supabase.rpc('get_task_completion_trend_7_days', rpcParams),
          supabase.rpc('get_compliance_trend_30_days', { p_company_id: profile.company_id }),
        ]);

        const firstError = sitesCount.error || activeStaff.error || tasksCompleted.error || openIssues.error || completionTrend.error || complianceTrend.error;
        if (firstError) throw firstError;

        setStats({
          totalSites: sitesCount.count ?? 0,
          activeStaff: activeStaff.data ?? 0,
          tasksCompletedToday: tasksCompleted.data ?? 0,
          openIssues: openIssues.data ?? 0,
        });

        setCompletionChartData((completionTrend.data ?? []).map(d => ({ name: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), Completed: d.count ?? 0 })));
        setComplianceChartData((complianceTrend.data ?? []).map(d => ({ name: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), Compliance: Number.isFinite(d.rate) ? Number((d.rate * 100).toFixed(1)) : 0 })));
      } catch (err) {
        setError(err.message ?? 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [profile?.company_id, selectedSiteId, selectedSupervisorId]);

  if (!profile) return <p className="p-6">Loading profile…</p>;
  if (!profile.company_id) return <p className="p-6 text-amber-600">Your profile has no company linked.</p>;
  if (loading) return <p className="p-6">Loading dashboard…</p>;
  if (error) return <p className="p-6 text-red-600">Error: {error}</p>;

  return (
    <>
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
            <input id="sla" type="range" min="50" max="100" value={slaThreshold} onChange={e => setSlaThreshold(parseInt(e.target.value, 10))} className="w-full mt-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard title="Total Sites" value={stats.totalSites} icon="fa-sitemap" color="purple" linkTo="sites" onNavigate={setCurrentPage} />
          <KpiCard title="Active Staff" value={stats.activeStaff} icon="fa-users" color="blue" linkTo="staff" onNavigate={setCurrentPage} />
          <KpiCard title="Tasks Completed Today" value={stats.tasksCompletedToday} icon="fa-check-circle" color="green" linkTo="tasks" onNavigate={setCurrentPage} />
          <KpiCard title="Open Issues" value={stats.openIssues} icon="fa-exclamation-triangle" color="red" linkTo="issues" onNavigate={setCurrentPage} />
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
                    {complianceChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.Compliance < slaThreshold ? '#f97316' : '#8884d8'} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Reports</h3>
          <div className="flex items-center space-x-4">
            <button onClick={() => setIsReportModalOpen(true)} className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">Generate Site Report</button>
            <button className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300">Generate Staff Report</button>
          </div>
        </div>
      </div>

      <ReportGeneratorModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} sites={sites} />
    </>
  );
}
