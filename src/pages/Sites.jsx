// src/pages/Sites.jsx - Updated with sticky sidebar and collapsible sections

import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export default function Sites({ profile }) {
  const [sites, setSites] = useState([]);
  const [areaTypes, setAreaTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collapsedSites, setCollapsedSites] = useState(new Set());
  const [collapsedZones, setCollapsedZones] = useState(new Set());

  // Toggle functions
  const toggleSite = (siteId) => {
    setCollapsedSites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(siteId)) {
        newSet.delete(siteId);
      } else {
        newSet.add(siteId);
      }
      return newSet;
    });
  };

  const toggleZone = (zoneId) => {
    setCollapsedZones(prev => {
      const newSet = new Set(prev);
      if (newSet.has(zoneId)) {
        newSet.delete(zoneId);
      } else {
        newSet.add(zoneId);
      }
      return newSet;
    });
  };

  // Expand/Collapse All
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

  // Your existing fetch functions...
  const fetchData = async () => {
    // ... existing code
  };

  useEffect(() => {
    fetchData();
  }, [profile?.company_id]);

  return (
    <div className="flex gap-6 h-[calc(100vh-100px)]">
      {/* STICKY SIDEBAR */}
      <div className="w-80 flex-shrink-0">
        <div className="sticky top-6 space-y-4">
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
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="font-semibold text-gray-700 mb-3">
                Add Zone to: {sites.find(s => s.id === selectedSite)?.name}
              </h3>
              <form onSubmit={handleAddZone} className="space-y-3">
                <input
                  type="text"
                  value={newZone.name}
                  onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                  placeholder="Zone Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
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
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="font-semibold text-gray-700 mb-3">
                Add Area to: {getZoneName(selectedZone)}
              </h3>
              <form onSubmit={handleAddArea} className="space-y-3">
                <input
                  type="text"
                  value={newArea.name}
                  onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
                  placeholder="Area Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  required
                />
                <select
                  value={newArea.area_type_id}
                  onChange={(e) => setNewArea({ ...newArea, area_type_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select Type</option>
                  {areaTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={newArea.daily_cleaning_frequency}
                  onChange={(e) => setNewArea({ ...newArea, daily_cleaning_frequency: parseInt(e.target.value) })}
                  placeholder="Daily Cleaning Frequency"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
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
                  {/* Site Header - Collapsible */}
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
                        className="bg-blue-500 text-white py-1 px-3 rounded-md hover:bg-blue-600 text-sm"
                      >
                        <i className="fas fa-plus mr-1"></i>
                        Add Zone
                      </button>
                    </div>
                  </div>

                  {/* Zones - Collapsible Content */}
                  {!collapsedSites.has(site.id) && (
                    <div className="p-4 space-y-3">
                      {site.zones && site.zones.length > 0 ? (
                        site.zones.map(zone => (
                          <div key={zone.id} className="border border-gray-200 rounded-md overflow-hidden ml-6">
                            {/* Zone Header - Collapsible */}
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
                                  className="bg-purple-500 text-white py-1 px-3 rounded-md hover:bg-purple-600 text-sm"
                                >
                                  <i className="fas fa-plus mr-1"></i>
                                  Add Area
                                </button>
                              </div>
                            </div>

                            {/* Areas - Collapsible Content */}
                            {!collapsedZones.has(zone.id) && (
                              <div className="p-3 bg-white">
                                {zone.areas && zone.areas.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {zone.areas.map(area => (
                                      <div
                                        key={area.id}
                                        className="border border-gray-200 rounded-md p-3 hover:shadow-md transition-shadow"
                                      >
                                        <div className="flex justify-between items-start mb-2">
                                          <div className="flex items-center gap-2">
                                            <i className="fas fa-door-open text-purple-600"></i>
                                            <h5 className="font-medium text-gray-800">{area.name}</h5>
                                          </div>
                                          <button
                                            onClick={() => handleShowQRCode(area, zone.name, site.name)}
                                            className="text-gray-400 hover:text-gray-600"
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
    </div>
  );
}
