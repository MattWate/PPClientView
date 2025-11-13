import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient.js';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Reusable KPI Card for the Report ---
const ReportKpiCard = ({ title, value, subtext, color }) => {
    const colors = {
        blue: 'bg-blue-100 text-blue-800',
        green: 'bg-green-100 text-green-800',
        red: 'bg-red-100 text-red-800',
        amber: 'bg-amber-100 text-amber-800',
    };

    return (
        <div className={`p-4 rounded-lg shadow-md ${colors[color]}`}>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subtext && <p className="text-xs mt-1">{subtext}</p>}
        </div>
    );
};

export default function SiteReportPage() {
    const [searchParams] = useSearchParams();
    const [reportData, setReportData] = useState(null);
    const [siteName, setSiteName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const siteId = searchParams.get('siteId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    useEffect(() => {
        // Guard against missing URL parameters
        if (!siteId || !startDate || !endDate) {
            setError('Missing required parameters (site, start date, or end date) in the URL.');
            setLoading(false);
            return;
        }

        const fetchReportData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch the site name for the report header
                const { data: siteData, error: siteError } = await supabase
                    .from('sites')
                    .select('name')
                    .eq('id', siteId)
                    .single();

                if (siteError) throw siteError;
                setSiteName(siteData.name);

                // Call the database function
                const { data, error: rpcError } = await supabase.rpc('get_compliance_snapshot', {
                    p_site_id: siteId,
                    p_start_date: startDate,
                    p_end_date: endDate,
                });

                if (rpcError) throw rpcError;
                setReportData(data);

            } catch (err) {
                console.error('Error fetching report data:', err);
                setError(err.message || 'An unexpected error occurred while generating the report.');
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, [siteId, startDate, endDate]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Generating your report, please wait...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen p-8">
                <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
                    <p className="text-red-600">{error}</p>
                </div>
            </div>
        );
    }

    if (!reportData) {
        return (
            <div className="flex items-center justify-center min-h-screen p-8">
                <div className="max-w-md w-full bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                    <p className="text-gray-600">No data available for this report.</p>
                </div>
            </div>
        );
    }

    // --- Data for Pie Chart (if issue_breakdown exists) ---
    const issueData = reportData.issue_breakdown || [];
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
    
    return (
        <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-6">
                {/* --- Print Button (No-print class) --- */}
                <div className="flex justify-end mb-4 no-print">
                    <button 
                        onClick={() => window.print()}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        <i className="fas fa-print"></i>
                        Print Report
                    </button>
                </div>

                {/* --- Report Header --- */}
                <div className="border-b pb-4 mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Compliance Snapshot</h1>
                    <h2 className="text-xl font-semibold text-blue-600">{siteName}</h2>
                    <p className="text-sm text-gray-500">
                        Report for the period: {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
                    </p>
                </div>

                {/* --- Top-Line Summary --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    <ReportKpiCard
                        title="Overall Compliance"
                        value={`${reportData.summary.overall_score}%`}
                        color={reportData.summary.overall_score >= 90 ? 'green' : reportData.summary.overall_score >= 70 ? 'amber' : 'red'}
                    />
                    <ReportKpiCard
                        title="Tasks Completed"
                        value={reportData.summary.tasks_completed}
                        subtext={`out of ${reportData.summary.tasks_scheduled} scheduled`}
                        color="blue"
                    />
                    <ReportKpiCard
                        title="Tasks Missed"
                        value={reportData.summary.tasks_missed}
                        color={reportData.summary.tasks_missed > 0 ? 'red' : 'green'}
                    />
                </div>

                {/* --- Actionable Insights --- */}
                <div>
                    <h3 className="text-2xl font-semibold text-gray-800 mb-4">Actionable Insights</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-bold text-lg mb-2">Missed Tasks</h4>
                        {reportData.missed_tasks && reportData.missed_tasks.length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reportData.missed_tasks.map((task, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{task.task}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{task.area}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-sm text-gray-600 text-center py-4">Congratulations! No tasks were missed in this period.</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
