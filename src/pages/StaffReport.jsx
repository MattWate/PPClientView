// src/pages/StaffReport.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export default function StaffReport({ profile }) {
  const [staffMembers, setStaffMembers] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStaffMembers();
  }, [profile?.company_id]);

  const fetchStaffMembers = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('company_id', profile.company_id)
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setStaffMembers(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const generateReport = async () => {
    if (!selectedStaff) return;

    setLoading(true);
    try {
      // Fetch tasks completed by this staff member
      const { data: completedTasks, error: completedError } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          completed_at,
          completed_by_proxy,
          areas (
            name,
            zones (
              name,
              sites (
                name
              )
            )
          ),
          job_templates (
            description
          )
        `)
        .eq('completed_by', selectedStaff)
        .gte('completed_at', `${dateRange.start}T00:00:00`)
        .lte('completed_at', `${dateRange.end}T23:59:59`)
        .order('completed_at', { ascending: false });

      if (completedError) throw completedError;

      // Fetch tasks assigned to this staff member (pending/assigned)
      const { data: assignedTasks, error: assignedError } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          status,
          created_at,
          areas (
            name,
            zones (
              name,
              sites (
                name
              )
            )
          )
        `)
        .eq('assigned_to', selectedStaff)
        .in('status', ['assigned', 'pending'])
        .order('created_at', { ascending: false });

      if (assignedError) throw assignedError;

      // Get staff member details
      const staffMember = staffMembers.find(s => s.id === selectedStaff);

      // Calculate statistics
      const totalCompleted = completedTasks?.length || 0;
      const completedByProxy = completedTasks?.filter(t => t.completed_by_proxy).length || 0;
      const completedByStaff = totalCompleted - completedByProxy;
      const pendingTasks = assignedTasks?.length || 0;

      // Group by date
      const tasksByDate = {};
      completedTasks?.forEach(task => {
        const date = new Date(task.completed_at).toLocaleDateString();
        if (!tasksByDate[date]) {
          tasksByDate[date] = [];
        }
        tasksByDate[date].push(task);
      });

      // Group by site
      const tasksBySite = {};
      completedTasks?.forEach(task => {
        const siteName = task.areas?.zones?.sites?.name || 'Unknown Site';
        if (!tasksBySite[siteName]) {
          tasksBySite[siteName] = 0;
        }
        tasksBySite[siteName]++;
      });

      setReportData({
        staffMember,
        completedTasks: completedTasks || [],
        assignedTasks: assignedTasks || [],
        stats: {
          totalCompleted,
          completedByStaff,
          completedByProxy,
          pendingTasks,
          averagePerDay: (totalCompleted / Math.max(1, Object.keys(tasksByDate).length)).toFixed(1)
        },
        tasksByDate,
        tasksBySite
      });
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto">
      <style>
        {`
          @media print {
            .no-print {
              display: none !important;
            }
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        `}
      </style>

      {/* Report Generator - Hidden on Print */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6 no-print">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Staff Performance Report</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Staff Member
            </label>
            <select
              value={selectedStaff || ''}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Choose staff member...</option>
              {staffMembers.map(staff => (
                <option key={staff.id} value={staff.id}>
                  {staff.full_name || 'Unnamed Staff'} ({staff.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        <button
          onClick={generateReport}
          disabled={!selectedStaff || loading}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Generating Report...
            </>
          ) : (
            <>
              <i className="fas fa-chart-bar mr-2"></i>
              Generate Report
            </>
          )}
        </button>
      </div>

      {/* Report Display */}
      {reportData && (
        <div className="bg-white p-8 rounded-lg shadow-md">
          {/* Header */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Staff Performance Report
                </h1>
                <p className="text-lg text-gray-600">
                  {reportData.staffMember?.full_name || 'Unknown Staff'} 
                  <span className="text-sm ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {reportData.staffMember?.role}
                  </span>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Report Period: {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={handlePrint}
                className="no-print bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
              >
                <i className="fas fa-print mr-2"></i>
                Print Report
              </button>
            </div>
          </div>

          {/* Statistics Overview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-3xl font-bold text-green-600">
                {reportData.stats.totalCompleted}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Completed</div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-3xl font-bold text-blue-600">
                {reportData.stats.completedByStaff}
              </div>
              <div className="text-sm text-gray-600 mt-1">Completed by Staff</div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-3xl font-bold text-purple-600">
                {reportData.stats.completedByProxy}
              </div>
              <div className="text-sm text-gray-600 mt-1">Completed by Proxy</div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="text-3xl font-bold text-yellow-600">
                {reportData.stats.pendingTasks}
              </div>
              <div className="text-sm text-gray-600 mt-1">Pending Tasks</div>
            </div>

            <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
              <div className="text-3xl font-bold text-teal-600">
                {reportData.stats.averagePerDay}
              </div>
              <div className="text-sm text-gray-600 mt-1">Avg. Per Day</div>
            </div>
          </div>

          {/* Tasks by Site */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Tasks Completed by Site</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {Object.entries(reportData.tasksBySite).map(([site, count]) => (
                <div key={site} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                  <span className="text-gray-700">{site}</span>
                  <span className="font-semibold text-gray-900">{count} tasks</span>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Breakdown */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Daily Task Completion</h3>
            <div className="space-y-3">
              {Object.entries(reportData.tasksByDate).map(([date, tasks]) => (
                <div key={date} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-gray-800">{date}</h4>
                    <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
                      {tasks.length} tasks
                    </span>
                  </div>
                  <div className="space-y-1">
                    {tasks.map(task => (
                      <div key={task.id} className="text-sm text-gray-600 pl-4">
                        • {task.title || task.job_templates?.description || 'Unnamed Task'} 
                        <span className="text-gray-400 ml-2">
                          ({task.areas?.zones?.sites?.name} - {task.areas?.name})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Tasks */}
          {reportData.assignedTasks.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Current Pending Tasks</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="space-y-2">
                  {reportData.assignedTasks.map(task => (
                    <div key={task.id} className="flex justify-between items-center py-2 border-b border-yellow-200 last:border-b-0">
                      <div>
                        <div className="font-medium text-gray-900">{task.title}</div>
                        <div className="text-sm text-gray-600">
                          {task.areas?.zones?.sites?.name} › {task.areas?.zones?.name} › {task.areas?.name}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        task.status === 'assigned' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
