// src/pages/Sites.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import QRCode from 'react-qr-code';

export default function Sites({ profile }) {
  const [sites, setSites] = useState([]);
  const [areaTypes, setAreaTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Collapse State
  const [collapsedSites, setCollapsedSites] = useState(new Set());
  const [collapsedZones, setCollapsedZones] = useState(new Set());

  // Selection State for adding new items
  const [selectedSite, setSelectedSite] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);

  // Form State
  const [newSite, setNewSite] = useState({ name: '', address: '' });
  const [newZone, setNewZone] = useState({ name: '' });
  const [newArea, setNewArea] = useState({ name: '', area_type_id: '', daily_cleaning_frequency: 1 });

  // QR Code State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState({ areaId: '', areaName: '', url: '' });

  const fetchData = async () => {
    if (!profile?.company_id) return;
    try {
      setLoading(true);
      
      // Fetch Sites with Zones and Areas
      const { data: sitesData, error: sitesError } = await supabase
        .from('sites')
        .select(`
          id, name, address,
          zones (
            id, name,
            areas (
              id, name, daily_cleaning_frequency,
              area_types (id, name)
            )
          )
        `)
        .eq('company_id', profile.company_id)
        .order('name');

      if (sitesError) throw sitesError;
      setSites(sitesData || []);

      // Fetch Area Types for dropdown
      const { data: typesData, error: typesError } = await supabase
        .from('area_types')
        .select('id, name')
        .eq('company_id', profile.company_id);
      
      if (typesError) throw typesError;
      setAreaTypes(typesData || []);

    } catch (error) {
      console.error('Error loading sites:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile?.company_id]);

  // Toggle functions
  const toggleSite = (siteId) => {
    setCollapsedSites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(siteId)) newSet.delete(siteId);
      else newSet.add(siteId);
      return newSet;
    });
  };

  const toggleZone = (zoneId) => {
    setCollapsedZones(prev => {
      const newSet = new Set(prev);
      if (newSet.has(zoneId)) newSet.delete(zoneId);
      else newSet.add(zoneId);
      return newSet;
    });
  };

  const expandAll = () => {
    setCollapsedSites(new Set());
    setCollapsedZones(new Set());
  };

  const collapseAll = () => {
    const allSiteIds = sites.map(s => s.id);
    const allZoneIds = sites.flatMap(s => s.zones?.map(z => z.id) || []);
    setCollapsedSites(new Set(allSiteIds));
    setCollapsedZones(new Set(allZoneIds));
  };

  // Creation Handlers
  const handleAddSite = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('sites')
        .insert({
          company_id: profile.company_id,
          name: newSite.name,
          address: newSite.address
        });
      if (error) throw error;
      setNewSite({ name: '', address: '' });
      fetchData();
    } catch (error) {
      alert('Error adding site: ' + error.message);
    }
  };

  const handleAddZone = async (e) => {
    e.preventDefault();
    if (!selectedSite) return;
    try {
      const { error } = await supabase
        .from('zones')
        .insert({
          company_id: profile.company_id,
          site_id: selectedSite,
          name: newZone.name
        });
      if (error) throw error;
      setNewZone({ name: '' });
      fetchData();
    } catch (error) {
      alert('Error adding zone: ' + error.message);
    }
  };

  const handleAddArea = async (e) => {
    e.preventDefault();
    if (!selectedZone) return;
    try {
      const { error } = await supabase
        .from('areas')
        .insert({
          company_id: profile.company_id,
          zone_id: selectedZone,
          name: newArea.name,
          area_type_id: newArea.area_type_id || null,
          daily_cleaning_frequency: newArea.daily_cleaning_frequency
        });
      if (error) throw error;
      setNewArea({ name: '', area_type_id: '', daily_cleaning_frequency: 1 });
      fetchData();
    } catch (error) {
      alert('Error adding area: ' + error.message);
    }
  };

  const getZoneName = (zoneId) => {
    for (const site of sites) {
      const zone = site.zones?.find(z => z.id === zoneId);
      if (zone) return zone.name;
    }
    return 'Unknown Zone';
  };

  // QR Code Logic
  const handleShowQRCode = (area, zoneName, siteName) => {
    // Construct the URL that leads to the PublicScanPage
    // Using hash router format (#/public-scan/...)
    const baseUrl = window.location.origin; 
    const url = `${baseUrl}/#/public-scan/${area.id}`;
    
    setQrData({
      areaId: area.id,
      areaName: `${siteName} - ${zoneName} - ${area.name}`,
      url: url
    });
    setQrModalOpen(true);
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-100px)]">
      {/* STICKY SIDEBAR */}
      <div className="w-80 flex-shrink-0 overflow-y-auto">
        <div className="space-y-4">
          {/* View Controls */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="font-semibold text-gray-700 mb-3">View Controls</h3>
            <div className="flex gap-2">
              <button
                onClick={expandAll}
                className="flex-1 bg-green-50 text-green-700 py-2 px-3 rounded-md hover:bg-green-100 text-sm font-medium"
              >
                <i className="fas fa-plus-square mr-1"></i>
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="flex-1 bg-gray-50 text-gray-700 py-2 px-3 rounded-md hover:bg-gray-100 text-sm font-medium"
              >
                <i className="fas fa-minus-square mr-1"></i>
                Collapse All
              </button>
            </div>
          </div>

          {/* Add New Site */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="font-semibold text-gray-700 mb-3">Add New Site</h3>
            <form onSubmit={handleAddSite} className="space-y-3">
              <input
                type="text"
                value={newSite.name}
                onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                placeholder="Site Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                required
              />
              <input
                type="text"
                value={newSite.address}
                onChange={(e) => setNewSite({ ...newSite, address: e.target.value })}
                placeholder="Address (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 font-medium"
              >
                <i className="fas fa-plus mr-2"></i>
                Add Site
              </button>
            </form>
          </div>

          {/* Add New Zone */}
          {selectedSite && (
            <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
              <h3 className="font-semibold text-gray-700 mb-3">
                Add Zone to: <br/>
                <span className="text-blue-600">{sites.find(s => s.id === selectedSite)?.name}</span>
              </h3>
              <form onSubmit={handleAddZone} className="space-y-3">
                <input
                  type="text"
                  value={newZone.name}
                  onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                  placeholder="Zone Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Add Zone
                </button>
              </form>
            </div>
          )}

          {/* Add New Area */}
          {selectedZone && (
            <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-purple-500">
              <h3 className="font-semibold text-gray-700 mb-3">
                Add Area to: <br/>
                <span className="text-purple-600">{getZoneName(selectedZone)}</span>
              </h3>
              <form onSubmit={handleAddArea} className="space-y-3">
                <input
                  type="text"
                  value={newArea.name}
                  onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
                  placeholder="Area Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  required
                />
                <select
                  value={newArea.area_type_id}
                  onChange={(e) => setNewArea({ ...newArea, area_type_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Select Type</option>
                  {areaTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 whitespace-nowrap">Daily Freq:</label>
                  <input
                    type="number"
                    value={newArea.daily_cleaning_frequency}
                    onChange={(e) => setNewArea({ ...newArea, daily_cleaning_frequency: parseInt(e.target.value) })}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 font-medium"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Add Area
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* SCROLLABLE MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Sites & Areas</h2>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {sites.map(site => (
                <div key={site.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Site Header */}
                  <div 
                    className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleSite(site.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <i className={`fas fa-chevron-${collapsedSites.has(site.id) ? 'right' : 'down'} text-gray-400`}></i>
                        <i className="fas fa-building text-green-600 text-xl"></i>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{site.name}</h3>
                          {site.address && <p className="text-sm text-gray-500">{site.address}</p>}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSite(site.id);
                          setSelectedZone(null);
                        }}
                        className="bg-blue-500 text-white py-1 px-3 rounded-md hover:bg-blue-600 text-sm transition-colors"
                      >
                        <i className="fas fa-plus mr-1"></i>
                        Add Zone
                      </button>
                    </div>
                  </div>

                  {/* Zones List */}
                  {!collapsedSites.has(site.id) && (
                    <div className="p-4 space-y-3">
                      {site.zones && site.zones.length > 0 ? (
                        site.zones.map(zone => (
                          <div key={zone.id} className="border border-gray-200 rounded-md overflow-hidden ml-6">
                            {/* Zone Header */}
                            <div
                              className="bg-blue-50 p-3 cursor-pointer hover:bg-blue-100 transition-colors"
                              onClick={() => toggleZone(zone.id)}
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <i className={`fas fa-chevron-${collapsedZones.has(zone.id) ? 'right' : 'down'} text-gray-400 text-sm`}></i>
                                  <i className="fas fa-map-marker-alt text-blue-600"></i>
                                  <h4 className="font-semibold text-gray-800">{zone.name}</h4>
                                  <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                                    {zone.areas?.length || 0} areas
                                  </span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedZone(zone.id);
                                    setSelectedSite(site.id);
                                  }}
                                  className="bg-purple-500 text-white py-1 px-3 rounded-md hover:bg-purple-600 text-sm transition-colors"
                                >
                                  <i className="fas fa-plus mr-1"></i>
                                  Add Area
                                </button>
                              </div>
                            </div>

                            {/* Areas List */}
                            {!collapsedZones.has(zone.id) && (
                              <div className="p-3 bg-white">
                                {zone.areas && zone.areas.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {zone.areas.map(area => (
                                      <div
                                        key={area.id}
                                        className="border border-gray-200 rounded-md p-3 hover:shadow-md transition-shadow bg-gray-50"
                                      >
                                        <div className="flex justify-between items-start mb-2">
                                          <div className="flex items-center gap-2 overflow-hidden">
                                            <i className="fas fa-door-open text-purple-600 flex-shrink-0"></i>
                                            <h5 className="font-medium text-gray-800 truncate" title={area.name}>
                                              {area.name}
                                            </h5>
                                          </div>
                                          <button
                                            onClick={() => handleShowQRCode(area, zone.name, site.name)}
                                            className="text-gray-500 hover:text-gray-800 bg-white border border-gray-300 rounded p-1.5 transition-colors"
                                            title="View QR Code"
                                          >
                                            <i className="fas fa-qrcode"></i>
                                          </button>
                                        </div>
                                        {area.area_types && (
                                          <p className="text-xs text-gray-500 mb-1">
                                            Type: {area.area_types.name}
                                          </p>
                                        )}
                                        {area.daily_cleaning_frequency > 0 && (
                                          <p className="text-xs text-gray-500">
                                            Frequency: {area.daily_cleaning_frequency}x/day
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-gray-400 text-sm italic text-center py-4">
                                    No areas yet. Click "Add Area" to create one.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 text-sm italic text-center py-4 ml-6">
                          No zones yet. Click "Add Zone" to create one.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={() => setQrModalOpen(false)}>
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
            <div className="no-print">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Area QR Code</h3>
                <p className="text-sm text-gray-500 mb-4">{qrData.areaName}</p>
            </div>
            
            {/* Printable Area - Designed to look like a sticker */}
            <div className="print-area bg-white p-4 border-2 border-dashed border-gray-300 inline-block rounded-lg mb-4 w-full">
                <div className="flex flex-col items-center">
                    <p className="text-sm font-bold mb-2 uppercase tracking-wider text-gray-700">Scan to Clean / Report</p>
                    <div className="bg-white p-2" style={{ height: "auto", margin: "0 auto", maxWidth: 200, width: "100%" }}>
                        <QRCode 
                            size={256}
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            value={qrData.url}
                            viewBox={`0 0 256 256`}
                        />
                    </div>
                    <p className="text-xs mt-3 font-mono text-gray-500 break-words w-full">{qrData.areaName}</p>
                    <p className="text-[10px] mt-1 text-gray-400">PristinePoint</p>
                </div>
            </div>
            
            <div className="flex gap-2 no-print">
                <button 
                onClick={() => window.print()} 
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200 transition-colors font-medium"
                >
                <i className="fas fa-print mr-2"></i> Print
                </button>
                <button 
                onClick={() => setQrModalOpen(false)} 
                className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                Close
                </button>
            </div>
            </div>
        </div>
        )}

    </div>
  );
}
