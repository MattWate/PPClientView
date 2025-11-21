// src/pages/StaffReportPage.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient.js';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Reusable KPI Card ---
const ReportKpiCard = ({ title, value, subtext, icon, color }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    teal: 'bg-teal-100 text-teal-800 border-teal-200',
  };

  return (
    <div className={`p-4 rounded-lg border ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {subtext && <p className="text-xs mt-1 opacity-70">{subtext}</p>}
        </div>
        {icon && <i className={`fas ${icon} text-3xl opacity-50`}></i>}
      </div>
    </div>
  );
};

// --- Status Badge ---
const StatusBadge = ({ status }) => {
  const styles = {
    completed: 'bg-green-100 text-green-800',
    verified: 'bg-blue-100 text-blue-800',
    assigned: 'bg-yellow-100 text-yellow-800',
    pending: 'bg-gray-100 text-gray-800',
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${styles[status] || styles.pending}`}>
      {status?.replace('_', ' ') || 'pending'}
    </span>
  );
};

export default function StaffReportPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(null);
  const [staffMember, setStaffMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const staffId = searchParams.get('staffId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  useEffect(() => {
    if (!staffId || !startDate || !endDate) {
      setError('Missing required parameters. Please select a staff member and date range.');
      setLoading(false);
      return;
    }

    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch staff member details
        const { data: staffData, error: staffError } = await supabase
          .from('profiles')
          .select('id, full_name, role, is_active, companies(name)')
          .eq('id', staffId)
          .single();

        if (staffError) throw staffError;
        setStaffMember(staffData);

        // 2. Fetch tasks assigned to this staff member in date range
        const { data: assignedTasks, error: assignedError } = await supabase
          .from('tasks')
          .select(`
            id, title, status, task_type, created_at, assigned_at, completed_at, verified_at,
            completed_by_proxy,
            areas(name, zones(name, sites(name)))
          `)
          .eq('assigned_to', staffId)
          .gte('created_at', `${startDate}T00:00:00`)
          .lte('created_at', `${endDate}T23:59:59`);

        if (assignedError) throw assignedError;

        // 3. Fetch tasks completed by this staff member (might differ from assigned)
        const { data: completedTasks, error: completedError } = await supabase
          .from('tasks')
          .select(`
            id, title, status, task_type, created_at, assigned_at, completed_at, verified_at,
            completed_by_proxy,
            areas(name, zones(name, sites(name)))
          `)
          .eq('completed_by', staffId)
          .gte('completed_at', `${startDate}T00:00:00`)
          .lte('completed_at', `${endDate}T23:59:59`);

        if (completedError) throw completedError;

        // 4. For supervisors: fetch tasks they verified
        let verifiedTasks = [];
        if (staffData.role === 'supervisor' || staffData.role === 'admin') {
          const { data: verified, error: verifiedError } = await supabase
            .from('tasks')
            .select(`
              id, title, status, verified_at,
              profiles:assigned_to(full_name),
              areas(name, zones(name, sites(name)))
            `)
            .eq('verified_by', staffId)
            .gte('verified_at', `${startDate}T00:00:00`)
            .lte('verified_at', `${endDate}T23:59:59`);

          if (!verifiedError) verifiedTasks = verified || [];
        }

        // 5. Fetch zone assignments for this staff member
        const { data: zoneAssignments, error: zoneError } = await supabase
          .from('zone_assignments')
          .select('zones(id, name, sites(name))')
          .eq('user_id', staffId);

        if (zoneError) throw zoneError;

        // --- Process Data ---
        const allAssigned = assignedTasks || [];
        const allCompleted = completedTasks || [];

        // Calculate statistics
        const totalAssigned = allAssigned.length;
        const totalCompleted = allCompleted.length;
        const completedOnTime = allCompleted.filter(t => t.status === 'completed' || t.status === 'verified').length;
        const completedByProxy = allAssigned.filter(t => t.completed_by_proxy).length;
        const pendingTasks = allAssigned.filter(t => t.status === 'pending' || t.status === 'assigned');
        const completionRate = totalAssigned > 0 ? Math.round((completedOnTime / totalAssigned) * 100) : 0;

        // Group by status
        const statusBreakdown = allAssigned.reduce((acc, task) => {
          const status = task.status || 'pending';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        // Group by site
        const tasksBySite = allAssigned.reduce((acc, task) => {
          const siteName = task.areas?.zones?.sites?.name || 'Unknown';
          if (!acc[siteName]) acc[siteName] = { total: 0, completed: 0 };
          acc[siteName].total++;
          if (task.status === 'completed' || task.status === 'verified') {
            acc[siteName].completed++;
          }
          return acc;
        }, {});

        // Group by day for trend chart
        const tasksByDay = allCompleted.reduce((acc, task) => {
          const day = new Date(task.completed_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          acc[day] = (acc[day] || 0) + 1;
          return acc;
        }, {});

        // Task type breakdown
        const taskTypeBreakdown = allAssigned.reduce((acc, task) => {
          const type = task.task_type || 'other';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});

        // Calculate average completion time (if we have assigned_at and completed_at)
        const completionTimes = allCompleted
          .filter(t => t.assigned_at && t.completed_at)
          .map(t => {
            const assigned = new Date(t.assigned_at);
            const completed = new Date(t.completed_at);
            return (completed - assigned) / (1000 * 60); // minutes
          });
        
        const avgCompletionTime = completionTimes.length > 0
          ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length)
          : null;

        setReportData({
          summary: {
            totalAssigned,
            totalCompleted,
            completionRate,
            completedByProxy,
            pendingCount: pendingTasks.length,
            avgCompletionTime,
            tasksVerified: verifiedTasks.length,
          },
          statusBreakdown,
          tasksBySite,
          tasksByDay,
          taskTypeBreakdown,
          pendingTasks,
          verifiedTasks,
          zoneAssignments: zoneAssignments || [],
          recentCompleted: allCompleted.slice(0, 10),
        });

      } catch (err) {
        console.error('Error fetching report data:', err);
        setError(err.message || 'Failed to generate report.');
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [staffId, startDate, endDate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Generating staff performance report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <i className="fas fa-exclamation-circle text-red-500 text-2xl mr-3"></i>
            <h3 className="text-lg font-semibold text-red-800">Error</h3>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!reportData || !staffMember) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <p className="text-gray-600">No data available for this report.</p>
      </div>
    );
  }

  const { summary, statusBreakdown, tasksBySite, tasksByDay, taskTypeBreakdown, pendingTasks, verifiedTasks, zoneAssignments, recentCompleted } = reportData;

  // Prepare chart data
  const statusChartData = Object.entries(statusBreakdown).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
    value: count,
  }));

  const siteChartData = Object.entries(tasksBySite).map(([site, data]) => ({
    name: site.length > 15 ? site.substring(0, 15) + '...' : site,
    Total: data.total,
    Completed: data.completed,
  }));

  const trendChartData = Object.entries(tasksByDay).map(([day, count]) => ({
    name: day,
    Completed: count,
  }));

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#6b7280', '#ef4444'];
  const isSupervisor = staffMember.role === 'supervisor' || staffMember.role === 'admin';

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Print Button */}
        <div className="flex justify-between items-center mb-4 no-print">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
            <i className="fas fa-arrow-left"></i>
            Back to Dashboard
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            <i className="fas fa-print"></i>
            Print Report
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6 report-container">
          {/* Report Header */}
          <div className="border-b pb-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Staff Performance Report</h1>
                <div className="mt-2 flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-user text-indigo-600 text-xl"></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-indigo-600">{staffMember.full_name || 'Unknown Staff'}</h2>
                    <p className="text-sm text-gray-500 capitalize">
                      {staffMember.role} • {staffMember.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                <p><strong>Report Period:</strong></p>
                <p>{new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</p>
                <p className="mt-2"><strong>Generated:</strong></p>
                <p>{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* KPI Summary */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Performance Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <ReportKpiCard
                title="Tasks Assigned"
                value={summary.totalAssigned}
                icon="fa-clipboard-list"
                color="blue"
              />
              <ReportKpiCard
                title="Tasks Completed"
                value={summary.totalCompleted}
                icon="fa-check-circle"
                color="green"
              />
              <ReportKpiCard
                title="Completion Rate"
                value={`${summary.completionRate}%`}
                subtext={summary.completionRate >= 90 ? 'Excellent' : summary.completionRate >= 70 ? 'Good' : 'Needs Improvement'}
                icon="fa-chart-line"
                color={summary.completionRate >= 90 ? 'green' : summary.completionRate >= 70 ? 'amber' : 'red'}
              />
              <ReportKpiCard
                title="Pending Tasks"
                value={summary.pendingCount}
                icon="fa-clock"
                color={summary.pendingCount > 5 ? 'red' : 'amber'}
              />
              {summary.avgCompletionTime && (
                <ReportKpiCard
                  title="Avg. Completion Time"
                  value={summary.avgCompletionTime < 60 ? `${summary.avgCompletionTime}m` : `${Math.round(summary.avgCompletionTime / 60)}h`}
                  icon="fa-stopwatch"
                  color="teal"
                />
              )}
              {summary.completedByProxy > 0 && (
                <ReportKpiCard
                  title="Completed by Proxy"
                  value={summary.completedByProxy}
                  subtext="Tasks completed by supervisor"
                  icon="fa-user-check"
                  color="purple"
                />
              )}
              {isSupervisor && (
                <ReportKpiCard
                  title="Tasks Verified"
                  value={summary.tasksVerified}
                  icon="fa-clipboard-check"
                  color="blue"
                />
              )}
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Task Status Breakdown */}
            {statusChartData.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-4">Task Status Breakdown</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Completion Trend */}
            {trendChartData.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-4">Daily Completion Trend</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Tasks by Site */}
          {siteChartData.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Performance by Site</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={siteChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Total" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="Completed" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Assigned Zones */}
          {zoneAssignments.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Assigned Zones</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {zoneAssignments.map((za, idx) => (
                  <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="font-medium text-blue-900">{za.zones?.name || 'Unknown Zone'}</p>
                    <p className="text-sm text-blue-600">{za.zones?.sites?.name || 'Unknown Site'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Tasks */}
          {pendingTasks.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                <i className="fas fa-exclamation-triangle text-amber-500 mr-2"></i>
                Outstanding Tasks ({pendingTasks.length})
              </h3>
              <div className="bg-amber-50 border border-amber-200 rounded-lg overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-amber-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-amber-800 uppercase">Task</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-amber-800 uppercase">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-amber-800 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-amber-800 uppercase">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-200">
                    {pendingTasks.slice(0, 10).map((task) => (
                      <tr key={task.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{task.title || 'Unnamed Task'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {task.areas?.zones?.sites?.name || '—'} › {task.areas?.name || '—'}
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(task.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pendingTasks.length > 10 && (
                  <p className="px-4 py-2 text-sm text-amber-700 bg-amber-100">
                    + {pendingTasks.length - 10} more pending tasks
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Recent Completed Tasks */}
          {recentCompleted.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                <i className="fas fa-check-circle text-green-500 mr-2"></i>
                Recently Completed Tasks
              </h3>
              <div className="bg-green-50 border border-green-200 rounded-lg overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-green-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-green-800 uppercase">Task</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-green-800 uppercase">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-green-800 uppercase">Completed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-200">
                    {recentCompleted.map((task) => (
                      <tr key={task.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {task.title || 'Unnamed Task'}
                          {task.completed_by_proxy && (
                            <span className="ml-2 text-xs text-purple-600">(proxy)</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {task.areas?.zones?.sites?.name || '—'} › {task.areas?.name || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(task.completed_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Supervisor Section: Verified Tasks */}
          {isSupervisor && verifiedTasks.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                <i className="fas fa-clipboard-check text-blue-500 mr-2"></i>
                Tasks Verified ({verifiedTasks.length})
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase">Task</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase">Cleaner</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase">Verified</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-200">
                    {verifiedTasks.slice(0, 10).map((task) => (
                      <tr key={task.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{task.title || 'Unnamed Task'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{task.profiles?.full_name || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {task.areas?.zones?.sites?.name || '—'} › {task.areas?.name || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(task.verified_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t pt-4 mt-8 text-center text-sm text-gray-500">
            <p>Generated by PristinePoint • {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
