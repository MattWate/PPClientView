// src/pages/SiteReportPage.jsx

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom'; // <-- 1. Import useNavigate
import { supabase } from '../services/supabaseClient'; // Adjust path if needed

export default function SiteReportPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate(); // <-- 2. Initialize the navigate function
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const siteId = searchParams.get('siteId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    useEffect(() => {
        const fetchReportData = async () => {
            if (!siteId || !startDate || !endDate) {
                setError("Missing parameters for report generation.");
                setLoading(false);
                return;
            }

            const { data, error } = await supabase.rpc('get_site_report_data', {
                p_site_id: siteId,
                p_start_date: startDate,
                p_end_date: endDate
            });

            if (error) {
                console.error("Error fetching report data:", error);
                setError(error.message);
            } else {
                setReportData(data);
            }
            setLoading(false);
        };

        fetchReportData();
    }, [siteId, startDate, endDate]);

    if (loading) return <p className="text-center p-10">Generating your report...</p>;
    if (error) return <p className="text-center p-10 text-red-600">Error: {error}</p>;
    if (!reportData) return <p className="text-center p-10">No data found for this period.</p>;

    return (
        <div className="bg-white p-8 max-w-4xl mx-auto my-10 shadow-lg report-container">
            <header className="border-b pb-4 mb-6">
                {/* V V V 3. ADDED THIS WRAPPER AND BUTTON V V V */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold">Site Compliance Report</h1>
                        <h2 className="text-xl text-gray-700 mt-1">{reportData.site.name}</h2>
                    </div>
                    <button 
                        onClick={() => navigate(-1)} 
                        className="no-print bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                    >
                        &larr; Back to Dashboard
                    </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">{reportData.site.address}</p>
                <p className="font-semibold mt-2">Period: {startDate} to {endDate}</p>
            </header>

            <section>
                <h3 className="text-2xl font-semibold mb-4">Completed Tasks</h3>
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b">
                            <th className="py-2">Task Title</th>
                            <th className="py-2">Status</th>
                            <th className="py-2">Completed On</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.tasks?.map(task => (
                            <tr key={task.id} className="border-b border-gray-200">
                                <td className="py-2">{task.title}</td>
                                <td className="py-2">{task.status}</td>
                                <td className="py-2">{new Date(task.completed_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!reportData.tasks && <p>No tasks were completed in this period.</p>}
            </section>
            
            <footer className="mt-8 text-center no-print">
                <button 
                    onClick={() => window.print()} 
                    className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700"
                >
                    Print or Save as PDF
                </button>
            </footer>
        </div>
    );
}
