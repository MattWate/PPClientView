import React, { useState, useEffect, useCallback } from 'react';
// --- Supabase client initialization to resolve import error ---
// NOTE: You must replace these with your actual Supabase project URL and anon key
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const SUPABASE_URL = 'https://clsirugxuvdyxdnlwqqk.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsc2lydWd4dXZkeXhkbmx3cXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNDQ2MzgsImV4cCI6MjA3MDkyMDYzOH0.gow7e2mHP_Qa0S0TsCriCfkKZ8jFTXO6ahp0mCstmoU'; // Replace with your Supabase anon key
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// --- AreaEditModal component to resolve import error ---
const AreaEditModal = ({ area, isOpen, onClose, onUpdate, profile }) => {
    const [name, setName] = useState('');
    const [areaTypeId, setAreaTypeId] = useState('');
    const [dailyCleaningFrequency, setDailyCleaningFrequency] = useState(0);
    const [areaTypes, setAreaTypes] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch area types for the dropdown
    useEffect(() => {
        if (isOpen && profile) {
            const fetchAreaTypes = async () => {
                const { data, error } = await supabase
                    .from('area_types')
                    .select('*')
                    .eq('company_id', profile.company_id);
                if (error) {
                    console.error("Error fetching area types:", error);
                } else {
                    setAreaTypes(data || []);
                }
            };
            fetchAreaTypes();
        }
    }, [isOpen, profile]);

    // Pre-fill the form when an area is selected
    useEffect(() => {
        if (area) {
            setName(area.name || '');
            setAreaTypeId(area.area_type_id || '');
            setDailyCleaningFrequency(area.daily_cleaning_frequency || 0);
            setError(null);
        }
    }, [area]);

    if (!isOpen || !area) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // --- FIX: Remove .single() and handle the array response ---
        const { data: updatedAreas, error: updateError } = await supabase
            .from('areas')
            .update({
                name: name,
                area_type_id: areaTypeId || null,
                daily_cleaning_frequency: dailyCleaningFrequency
            })
            .eq('id', area.id)
            .select();

        setLoading(false);
        if (updateError) {
            setError(updateError.message);
        } else {
            // --- FIX: Take the first item from the returned array ---
            if (updatedAreas && updatedAreas.length > 0) {
                onUpdate(updatedAreas[0]);
                onClose();
            } else {
                setError("Could not verify the update. Please refresh the page.");
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4 z-50">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-xl font-semibold mb-4">Edit Area</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Area Name</label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"/>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Area Type (Optional)</label>
                                <select value={areaTypeId} onChange={(e) => setAreaTypeId(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm">
                                    <option value="">None</option>
                                    {areaTypes.map(type => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Cleanings Per Day</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={dailyCleaningFrequency}
                                    onChange={(e) => setDailyCleaningFrequency(parseInt(e.target.value, 10) || 0)}
                                    className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
                                />
                                <p className="text-xs text-gray-500 mt-1">Number of automatic daily cleanings. Set to 0 for none.</p>
                            </div>
                            {error && <p className="text-red-600 text-sm">{error}</p>}
                        </div>
                    </div>
                    <div className="flex justify-end p-4 bg-gray-50 rounded-b-lg">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md mr-2 hover:bg-gray-300">Cancel</button>
                        <button type="submit" disabled={loading} className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50">
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- QR Code Modal for a single Area ---
const AreaQRCodeModal = ({ area, isOpen, onClose }) => {
    if (!isOpen || !area) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <style>
                {`
                    @media print {
                        body > *, .modal-overlay > *:not(.modal-content-printable) { display: none !important; }
                        .modal-overlay { background: transparent !important; }
                        .modal-content-printable {
                            visibility: visible !important; position: absolute; left: 0; top: 0;
                            width: 100%; height: 100%; overflow: visible; box-shadow: none;
                            border: none; display: flex; justify-content: center; align-items: center;
                        }
                        .print-hidden { display: none !important; }
                    }
                `}
            </style>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center transition-opacity modal-overlay" onClick={onClose}>
                <div className="bg-white rounded-lg shadow-xl max-w-sm w-full m-4 flex flex-col z-50 modal-content-printable" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center p-4 border-b print-hidden">
                        <h3 className="text-xl font-semibold">QR Code for "{area.name}"</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                    </div>
                    <div className="p-6 flex flex-col items-center" id="printable-qr-code">
                        <div className="text-center mb-4">
                            <h2 className="text-2xl font-bold">{area.name}</h2>
                            <p className="text-lg text-gray-600">Zone: {area.zoneName}</p>
                            <p className="text-md text-gray-500">Site: {area.siteName}</p>
                        </div>
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://pristinepoint.app/task/area/${area.id}`}
                            alt={`QR Code for ${area.name}`}
                            className="w-64 h-64 object-contain"
                        />
                         <p className="mt-2 text-xs text-gray-500">ID: {area.id}</p>
                    </div>
                    <div className="flex justify-end p-4 border-t print-hidden">
                        <button onClick={onClose} className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md mr-2 hover:bg-gray-300">Close</button>
                        <button onClick={handlePrint} className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">Print</button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default function SitesPage({ profile }) {
    const [sites, setSites] = useState([]);
    const [areaTypes, setAreaTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [newSiteName, setNewSiteName] = useState('');
    const [newZoneName, setNewZoneName] = useState('');
    const [newAreaName, setNewAreaName] = useState('');
    const [selectedAreaTypeId, setSelectedAreaTypeId] = useState('');

    const [activeSiteId, setActiveSiteId] = useState(null);
    const [activeZoneId, setActiveZoneId] = useState(null);

    const [editingArea, setEditingArea] = useState(null);
    const [qrModalArea, setQrModalArea] = useState(null);

    const fetchFullHierarchy = useCallback(async () => {
        if (!profile) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('sites')
                .select('*, zones(*, areas(*, area_types(id, name)))')
                .eq('company_id', profile.company_id);

            if (error) throw error;
            setSites(data || []);

            const { data: typesData, error: typesError } = await supabase
                .from('area_types')
                .select('*')
                .eq('company_id', profile.company_id);

            if (typesError) throw typesError;
            setAreaTypes(typesData || []);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [profile]);

    useEffect(() => {
        fetchFullHierarchy();
    }, [fetchFullHierarchy]);

    const handleCreate = async (e, type) => {
        e.preventDefault();
        let result;
        if (type === 'site') {
            result = await supabase.from('sites').insert({ name: newSiteName, company_id: profile.company_id });
            setNewSiteName('');
        } else if (type === 'zone') {
            result = await supabase.from('zones').insert({ name: newZoneName, site_id: activeSiteId, company_id: profile.company_id });
            setNewZoneName('');
        } else if (type === 'area') {
            result = await supabase.from('areas').insert({ name: newAreaName, zone_id: activeZoneId, company_id: profile.company_id, area_type_id: selectedAreaTypeId || null });
            setNewAreaName('');
            setSelectedAreaTypeId('');
        }
        
        if (result.error) {
            setError(result.error.message);
        } else {
            setActiveSiteId(null);
            setActiveZoneId(null);
            fetchFullHierarchy();
        }
    };

    // --- NEW: Handler to update local state without a full re-fetch ---
    const handleAreaUpdate = (updatedArea) => {
        setSites(currentSites =>
            currentSites.map(site => ({
                ...site,
                zones: site.zones.map(zone => ({
                    ...zone,
                    areas: zone.areas.map(area => {
                        if (area.id === updatedArea.id) {
                            // Merge existing area data with updated data to preserve nested objects
                            return { ...area, ...updatedArea };
                        }
                        return area;
                    })
                }))
            }))
        );
    };
    
    const handleDelete = async (type, id) => {
        if (!window.confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) return;
        
        let result;
        if (type === 'site') result = await supabase.from('sites').delete().eq('id', id);
        else if (type === 'zone') result = await supabase.from('zones').delete().eq('id', id);
        else if (type === 'area') result = await supabase.from('areas').delete().eq('id', id);
        
        if (result.error) setError(result.error.message);
        else fetchFullHierarchy();
    };

    if (loading) return <p>Loading sites...</p>;
    if (error) return <p className="text-red-600">Error: {error}</p>;

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Sites, Zones & Areas</h3>
                    <div className="space-y-4">
                        {sites.map(site => (
                            <div key={site.id} className="border rounded-lg">
                                <div className="w-full flex justify-between items-center p-4 bg-gray-50">
                                    <span className="font-semibold text-lg text-gray-700">{site.name}</span>
                                    <div>
                                        <button onClick={() => { setActiveSiteId(site.id); setActiveZoneId(null); }} className="text-sm bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-md mr-2">Add Zone</button>
                                        <button onClick={() => handleDelete('site', site.id)} className="text-sm bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md">Delete Site</button>
                                    </div>
                                </div>
                                <div className="bg-white p-4 border-t space-y-2">
                                    {site.zones.map(zone => (
                                        <div key={zone.id} className="border rounded-md">
                                            <div className="w-full flex justify-between items-center p-3 bg-gray-100">
                                                <span className="font-medium text-gray-700">{zone.name}</span>
                                                <div>
                                                    <button onClick={() => { setActiveSiteId(site.id); setActiveZoneId(zone.id); }} className="text-xs bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded-md mr-2">Add Area</button>
                                                    <button onClick={() => handleDelete('zone', zone.id)} className="text-xs bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded-md">Delete Zone</button>
                                                </div>
                                            </div>
                                            <div className="p-3">
                                                {zone.areas.length > 0 ? (
                                                    <ul className="space-y-1">
                                                        {zone.areas.map(area => (
                                                            <li key={area.id} className="flex justify-between items-center text-sm p-1 hover:bg-gray-50 rounded-md">
                                                                <div>
                                                                    <span>{area.name}</span>
                                                                    {area.daily_cleaning_frequency > 0 && 
                                                                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                                                            {area.daily_cleaning_frequency}x Daily
                                                                        </span>
                                                                    }
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <button onClick={() => setQrModalArea({ ...area, zoneName: zone.name, siteName: site.name })} className="text-xs font-semibold text-purple-600 hover:underline mr-3">QR</button>
                                                                    <button onClick={() => setEditingArea(area)} className="text-xs text-blue-600 hover:underline mr-3">Edit</button>
                                                                    <button onClick={() => handleDelete('area', area.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : <p className="text-xs text-gray-500">No areas in this zone.</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Create New Site</h3>
                        <form onSubmit={(e) => handleCreate(e, 'site')} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Site Name</label>
                                <input type="text" value={newSiteName} onChange={e => setNewSiteName(e.target.value)} required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" />
                            </div>
                            <button type="submit" className="w-full py-2 px-4 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Create Site</button>
                        </form>
                    </div>
                    {activeSiteId && !activeZoneId && (
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Add Zone to {sites.find(s => s.id === activeSiteId)?.name}</h3>
                            <form onSubmit={(e) => handleCreate(e, 'zone')} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Zone Name</label>
                                    <input type="text" value={newZoneName} onChange={e => setNewZoneName(e.target.value)} required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" />
                                </div>
                                <button type="submit" className="w-full py-2 px-4 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Add Zone</button>
                                <button type="button" onClick={() => setActiveSiteId(null)} className="w-full py-2 px-4 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 mt-2">Cancel</button>
                            </form>
                        </div>
                    )}
                    {activeZoneId && (
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Add Area to Zone</h3>
                            <form onSubmit={(e) => handleCreate(e, 'area')} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Area Name</label>
                                    <input type="text" value={newAreaName} onChange={e => setNewAreaName(e.target.value)} required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Area Type (Optional)</label>
                                    <select value={selectedAreaTypeId} onChange={e => setSelectedAreaTypeId(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm">
                                        <option value="">None</option>
                                        {areaTypes.map(type => (
                                            <option key={type.id} value={type.id}>{type.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <button type="submit" className="w-full py-2 px-4 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Add Area</button>
                                <button type="button" onClick={() => { setActiveZoneId(null); setActiveSiteId(null); }} className="w-full py-2 px-4 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 mt-2">Cancel</button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
            
            <AreaEditModal
                area={editingArea}
                isOpen={!!editingArea}
                onClose={() => setEditingArea(null)}
                onUpdate={handleAreaUpdate}
                profile={profile}
            />

            <AreaQRCodeModal
                area={qrModalArea}
                isOpen={!!qrModalArea}
                onClose={() => setQrModalArea(null)}
            />
        </>
    );
}

