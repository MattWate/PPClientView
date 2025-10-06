import React, { useState, useEffect } from 'react';
// V V V NOTE: I'm adding useNavigate here again from a previous step, just in case. V V V
import { Link, useNavigate } from 'react-router-dom';
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
                    {/* Modal content remains the same */}
                </div>
                <div className="flex justify-end p-4 bg-gray-50 rounded-b-lg space-x-2">
                    <button onClick={onClose} className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300">Cancel</button>
                    <button onClick={handleGenerateReport} className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">Generate Report</button>
                </div>
            </div>
        </div>
    );
};


export default function DashboardPage() {
  const { profile } = useAuth();
  // State and useEffects remain the same...
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

  useEffect(() => {
    // This effect remains the same
  }, [profile]);

  useEffect(() => {
    // This effect remains the same
  }, [profile, selectedSiteId, selectedSupervisorId]);

  if (loading) return <p className="p-6">Loading dashboard...</p>;
  if (error) return <p className="p-6 text-red-600">Error: {error}</p>;

  return (
    <>
        <div className="space-y-8">
            {/* Filter section remains the same */}
            <div className="bg-white p-4 rounded-lg shadow-md flex flex-col sm:flex-row gap-4 items-center">
                {/* ... all the select and input fields ... */}
            </div>

            {/* V V V THIS IS THE FIX V V V */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Total Sites" value={stats.totalSites} icon="fa-sitemap" color="purple" linkTo="#/sites" />
                <KpiCard title="Active Staff" value={stats.activeStaff} icon="fa-users" color="blue" linkTo="#/staff" />
                <KpiCard title="Tasks Completed Today" value={stats.tasksCompletedToday} icon="fa-check-circle" color="green" linkTo="#/tasks" />
                <KpiCard title="Open Issues" value={stats.openIssues} icon="fa-exclamation-triangle" color="red" linkTo="#/issues" />
            </div>
            {/* ^ ^ ^ END OF THE FIX ^ ^ ^ */}

            {/* Charts and Reports sections remain the same */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ... chart components ... */}
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
                {/* ... reports section ... */}
            </div>
        </div>

        <ReportGeneratorModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            sites={sites}
        />
    </>
  );
}
