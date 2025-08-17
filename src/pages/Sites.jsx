// src/pages/Sites.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export default function SitesPage({ profile }) {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newSiteName, setNewSiteName] = useState('');
  const [newZoneName, setNewZoneName] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState(null);

  useEffect(() => {
    const fetchSitesAndZones = async () => {
      try {
        setLoading(true);
        const { data: sitesData, error: sitesError } = await supabase
          .from('sites')
          .select('*, zones (*)')
          .eq('company_id', profile.company_id);

        if (sitesError) throw sitesError;
        setSites(sitesData);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSitesAndZones();
  }, [profile.company_id]);

  const handleCreateSite = async (e) => {
    e.preventDefault();
    try {
      const { data: newSite, error } = await supabase
        .from('sites')
        .insert({ name: newSiteName, company_id: profile.company_id })
        .select()
        .single();
      
      if (error) throw error;
      setSites([...sites, { ...newSite, zones: [] }]);
      setNewSiteName('');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCreateZone = async (e) => {
    e.preventDefault();
    try {
      const { data: newZone, error } = await supabase
        .from('zones')
        .insert({ name: newZoneName, site_id: selectedSiteId })
        .select()
        .single();

      if (error) throw error;

      setSites(sites.map(site => 
        site.id === selectedSiteId 
          ? { ...site, zones: [...site.zones, newZone] } 
          : site
      ));
      setNewZoneName('');
      setSelectedSiteId(null);
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) return <p>Loading sites...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Sites & Zones</h3>
        <div className="space-y-4">
          {sites.map(site => (
            <div key={site.id} className="border rounded-lg">
              <div className="w-full flex justify-between items-center p-4 bg-gray-50">
                <span className="font-semibold text-lg text-gray-700">{site.name}</span>
                <button onClick={() => setSelectedSiteId(site.id)} className="text-sm bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-md">Add Zone</button>
              </div>
              <div className="bg-white p-4 border-t">
                {site.zones.length > 0 ? (
                  <ul className="space-y-2">
                    {site.zones.map(zone => (
                      <li key={zone.id} className="p-2 rounded-md bg-gray-100">{zone.name}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No zones created for this site yet.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Create New Site</h3>
          <form onSubmit={handleCreateSite} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Site Name</label>
              <input type="text" value={newSiteName} onChange={e => setNewSiteName(e.target.value)} required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" />
            </div>
            <button type="submit" className="w-full py-2 px-4 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Create Site</button>
          </form>
        </div>
        {selectedSiteId && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Add Zone to {sites.find(s => s.id === selectedSiteId)?.name}</h3>
            <form onSubmit={handleCreateZone} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Zone Name</label>
                <input type="text" value={newZoneName} onChange={e => setNewZoneName(e.target.value)} required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" />
              </div>
              <button type="submit" className="w-full py-2 px-4 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Add Zone</button>
              <button type="button" onClick={() => setSelectedSiteId(null)} className="w-full py-2 px-4 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 mt-2">Cancel</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
