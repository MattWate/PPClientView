import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
// import { supabase } from '../services/supabaseClient.js'; // This is the original import.
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Supabase Client (Placeholder) ---
// To resolve build errors in this environment, a placeholder client is used.
// In your actual project, you should remove this and use your original import from '../services/supabaseClient.js'.
const supabase = {
    from: (table) => ({
        select: (columns) => ({
            eq: (column, value) => ({
                single: () => {
                    if (table === 'sites') {
                        return Promise.resolve({ data: { name: 'Selected Site Name' }, error: null });
                    }
                    return Promise.resolve({ data: null, error: new Error('Table not found') });
                }
            })
        })
    }),
    rpc: (functionName, params) => {
        if (functionName === 'get_compliance_snapshot') {
            // Return realistic mock data for the report preview.
            const mockReport = {
                summary: {
                    overall_score: 92.3,
                    tasks_completed: 125,
                    tasks_scheduled: 135,
                    tasks_missed: 10,
                },
                missed_tasks: [
                    { task: 'Clean Lobby Windows', area: 'Main Lobby' },
                    { task: 'Restock Paper Towels', area: 'Restroom #2' },
                    { task: 'Empty Trash Bins', area: 'Kitchenette' },
                ],
            };
            return Promise.resolve({ data: mockReport, error: null });
        }
        return Promise.resolve({ data: null, error: new Error('RPC not found') });
    }
};


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

                // Call the new database function
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
        return <div className="p-8 text-center">Generating your report, please wait...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-600">Error: {error}</div>;
    }

    if (!reportData) {
        return <div className="p-8 text-center">No data available for this report.</div>;
    }

    // --- Data for Pie Chart (if issue_breakdown exists) ---
    const issueData = reportData.issue_breakdown || [];
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
    
    return (
        <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-6">
                {/* --- Report Header --- */}
                <div className="border-b pb-4 mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Compliance Snapshot</h1>
                    <h2 className="text-xl font-semibold text-blue-600">{siteName}</h2>
                    <p className="text-sm text-gray-500">
                        Report for the period: {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
                    </p>
                </div>

                {/* --- Top-Line Summary --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

