// src/pages/Sites.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export default function SitesPage({ profile }) {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [newSiteName, setNewSiteName] = useState('');
  const [newZoneName, setNewZoneName] = useState('');
  const [newAreaName, setNewAreaName] = useState('');

  const [activeSiteId, setActiveSiteId] = useState(null);
  const [activeZoneId, setActiveZoneId] = useState(null);

  const fetchFullHierarchy = async () => {
    if (!profile) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sites')
        .select('*, zones(*, areas(*))')
        .eq('company_id', profile.company_id);

      if (error) throw error;
      setSites(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFullHierarchy();
  }, [profile]);

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
      result = await supabase.from('areas').insert({ name: newAreaName, zone_id: activeZoneId, company_id: profile.company_id });
      setNewAreaName('');
    }
    
    if (result.error) {
        setError(result.error.message);
    } else {
      setActiveSiteId(null);
      setActiveZoneId(null);
      fetchFullHierarchy(); // Refresh data after any successful creation
    }
  };
  
  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) return;
    let result;
    if (type === 'site') {
      result = await supabase.from('sites').delete().eq('id', id);
    } else if (type === 'zone') {
      result = await supabase.from('zones').delete().eq('id', id);
    } else if (type === 'area') {
      result = await supabase.from('areas').delete().eq('id', id);
    }
    if (result.error) setError(result.error.message);
    else fetchFullHierarchy(); // Refresh data
  };

  if (loading) return <p>Loading sites...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
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
                                    <li key={area.id} className="flex justify-between items-center text-sm p-1">
                                        <span>{area.name}</span>
                                        <button onClick={() => handleDelete('area', area.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
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
              <button type="submit" className="w-full py-2 px-4 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Add Area</button>
              <button type="button" onClick={() => { setActiveZoneId(null); setActiveSiteId(null); }} className="w-full py-2 px-4 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 mt-2">Cancel</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
