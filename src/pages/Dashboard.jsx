// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    if (linkTo && onNavigate) onNavigate(linkTo);
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

// --- Modal for Generating Site Reports ---
const SiteReportModal = ({ isOpen, onClose, sites }) => {
  const navigate = useNavigate();
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleGenerate = () => {
    if (!selectedSiteId || !startDate || !endDate) {
      alert('Please select a site and date range.');
      return;
    }
    navigate(`/report/site?siteId=${selectedSiteId}&startDate=${startDate}&endDate=${endDate}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full m-4">
        <div className="p-6 border-b">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <i className="fas fa-building text-blue-600"></i>
            Generate Site Compliance Report
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Select Site</label>
            <select
              value={selectedSiteId}
              onChange={e => setSelectedSiteId(e.target.value)}
              className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="" disabled>Choose a site...</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
          </div>
        </div>
        <div className="flex justify-end p-4 bg-gray-50 rounded-b-lg gap-2">
          <button onClick={onClose} className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300">Cancel</button>
          <button onClick={handleGenerate} className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
            <i className="fas fa-file-alt mr-2"></i>Generate Report
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Modal for Generating Staff Reports ---
const StaffReportModal = ({ isOpen, onClose, staff }) => {
  const navigate = useNavigate();
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Set default date range to last 7 days
  useEffect(() => {
    if (isOpen) {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 7);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  const handleGenerate = () => {
    if (!selectedStaffId || !startDate || !endDate) {
      alert('Please select a staff member and date range.');
      return;
    }
    navigate(`/report/staff?staffId=${selectedStaffId}&startDate=${startDate}&endDate=${endDate}`);
    onClose();
  };

  if (!isOpen) return null;

  // Group staff by role for better organization
  const supervisors = staff.filter(s => s.role === 'supervisor');
  const cleaners = staff.filter(s => s.role === 'cleaner');
  const others = staff.filter(s => s.role !== 'supervisor' && s.role !== 'cleaner');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full m-4">
        <div className="p-6 border-b">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <i className="fas fa-user-chart text-green-600"></i>
            Generate Staff Performance Report
          </h3>
          <p className="text-sm text-gray-500 mt-1">View individual performance metrics and task history</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Select Staff Member</label>
            <select
              value={selectedStaffId}
              onChange={e => setSelectedStaffId(e.target.value)}
              className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
            >
              <option value="" disabled>Choose a staff member...</option>
              {supervisors.length > 0 && (
                <optgroup label="Supervisors">
                  {supervisors.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name || 'Unnamed'}</option>
                  ))}
                </optgroup>
              )}
              {cleaners.length > 0 && (
                <optgroup label="Cleaners">
                  {cleaners.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name || 'Unnamed'}</option>
                  ))}
                </optgroup>
              )}
              {others.length > 0 && (
                <optgroup label="Other Staff">
                  {others.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name || 'Unnamed'} ({s.role})</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
          </div>
          {/* Quick date range buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 7);
                setStartDate(start.toISOString().split('T')[0]);
                setEndDate(end.toISOString().split('T')[0]);
              }}
              className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200"
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => {
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 30);
                setStartDate(start.toISOString().split('T')[0]);
                setEndDate(end.toISOString().split('T')[0]);
              }}
              className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200"
            >
              Last 30 Days
            </button>
            <button
              type="button"
              onClick={() => {
                const end = new Date();
                const start = new Date(end.getFullYear(), end.getMonth(), 1);
                setStartDate(start.toISOString().split('T')[0]);
                setEndDate(end.toISOString().split('T')[0]);
              }}
              className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200"
            >
              This Month
            </button>
          </div>
        </div>
        <div className="flex justify-end p-4 bg-gray-50 rounded-b-lg gap-2">
          <button onClick={onClose} className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300">Cancel</button>
          <button onClick={handleGenerate} className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700">
            <i className="fas fa-chart-bar mr-2"></i>Generate Report
          </button>
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
  const [staff, setStaff] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState('all');
  const [selectedSupervisorId, setSelectedSupervisorId] = useState('all');
  const [slaThreshold, setSlaThreshold] = useState(90);
  const [isSiteReportModalOpen, setIsSiteReportModalOpen] = useState(false);
  const [isStaffReportModalOpen, setIsStaffReportModalOpen] = useState(false);

  // Fetch dropdown filter data
  useEffect(() => {
    if (!profile?.company_id) return;
    const fetchFilterData = async () => {
      try {
        const { data: sitesData, error: sitesError } = await supabase.from('sites').select('id, name').eq('company_id', profile.company_id);
        if (sitesError) throw sitesError;

        const { data: staffData, error: staffError } = await supabase.from('profiles').select('id, full_name, role').eq('company_id', profile.company_id).eq('is_active', true);
        if (staffError) throw staffError;

        const { data: supervisorsData, error: supervisorsError } = await supabase.from('profiles').select('id, full_name').eq('company_id', profile.company_id).eq('role', 'supervisor');
        if (supervisorsError) throw supervisorsError;

        setSites(sitesData || []);
        setStaff(staffData || []);
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
        {/* Filters */}
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

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard title="Total Sites" value={stats.totalSites} icon="fa-sitemap" color="purple" linkTo="sites" onNavigate={setCurrentPage} />
          <KpiCard title="Active Staff" value={stats.activeStaff} icon="fa-users" color="blue" linkTo="staff" onNavigate={setCurrentPage} />
          <KpiCard title="Tasks Completed Today" value={stats.tasksCompletedToday} icon="fa-check-circle" color="green" linkTo="tasks" onNavigate={setCurrentPage} />
          <KpiCard title="Open Issues" value={stats.openIssues} icon="fa-exclamation-triangle" color="red" linkTo="issues" onNavigate={setCurrentPage} />
        </div>

        {/* Charts */}
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

        {/* Reports Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            <i className="fas fa-file-alt text-gray-600 mr-2"></i>
            Reports
          </h3>
          <p className="text-gray-600 mb-6">Generate detailed reports for compliance tracking and performance reviews.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Site Report Card */}
            <div className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-100 p-3 rounded-full">
                  <i className="fas fa-building text-blue-600 text-xl"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Site Compliance Report</h4>
                  <p className="text-xs text-gray-500">Task completion & compliance by site</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">View overall compliance scores, task completion rates, and identify areas needing attention.</p>
              <button
                onClick={() => setIsSiteReportModalOpen(true)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                <i className="fas fa-chart-pie mr-2"></i>
                Generate Site Report
              </button>
            </div>

            {/* Staff Report Card */}
            <div className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-green-100 p-3 rounded-full">
                  <i className="fas fa-user-chart text-green-600 text-xl"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Staff Performance Report</h4>
                  <p className="text-xs text-gray-500">Individual performance metrics</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">Track individual staff productivity, completion rates, and work distribution across sites.</p>
              <button
                onClick={() => setIsStaffReportModalOpen(true)}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                <i className="fas fa-user-clock mr-2"></i>
                Generate Staff Report
              </button>
            </div>

            {/* Team Report Card (Coming Soon) */}
            <div className="border border-gray-200 rounded-lg p-5 bg-gray-50 opacity-75">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-purple-100 p-3 rounded-full">
                  <i className="fas fa-users text-purple-600 text-xl"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Team Overview Report</h4>
                  <p className="text-xs text-gray-500">Compare team performance</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">Compare performance across your entire team with rankings and benchmarks.</p>
              <button disabled className="w-full bg-gray-400 text-white py-2 px-4 rounded-md cursor-not-allowed">
                <i className="fas fa-clock mr-2"></i>
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SiteReportModal isOpen={isSiteReportModalOpen} onClose={() => setIsSiteReportModalOpen(false)} sites={sites} />
      <StaffReportModal isOpen={isStaffReportModalOpen} onClose={() => setIsStaffReportModalOpen(false)} staff={staff} />
    </>
  );
}
