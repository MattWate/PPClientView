// src/pages/Tasks.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export default function TasksPage({ profile }) {
  const [areaTypes, setAreaTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newAreaTypeName, setNewAreaTypeName] = useState('');
  const [selectedAreaType, setSelectedAreaType] = useState(null);
  const [newJobDescription, setNewJobDescription] = useState('');

  useEffect(() => {
    const fetchAreaTypes = async () => {
      if (!profile) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('area_types')
          .select('*, job_templates (*)')
          .eq('company_id', profile.company_id);
        
        if (error) throw error;
        setAreaTypes(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAreaTypes();
  }, [profile]);

  const handleCreateAreaType = async (e) => {
    e.preventDefault();
    try {
      const { data: newType, error } = await supabase
        .from('area_types')
        .insert({ name: newAreaTypeName, company_id: profile.company_id })
        .select('*, job_templates (*)')
        .single();
      
      if (error) throw error;
      setAreaTypes([...areaTypes, newType]);
      setNewAreaTypeName('');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCreateJobTemplate = async (e) => {
    e.preventDefault();
    try {
      const { data: newJob, error } = await supabase
        .from('job_templates')
        .insert({ description: newJobDescription, area_type_id: selectedAreaType.id })
        .select()
        .single();

      if (error) throw error;

      setSelectedAreaType({
        ...selectedAreaType,
        job_templates: [...selectedAreaType.job_templates, newJob]
      });

      setAreaTypes(areaTypes.map(type => 
        type.id === selectedAreaType.id 
          ? { ...type, job_templates: [...type.job_templates, newJob] }
          : type
      ));
      setNewJobDescription('');
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) return <p>Loading job templates...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Area Types</h3>
        <div className="space-y-4">
          {areaTypes.map(type => (
            <div key={type.id} className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50" onClick={() => setSelectedAreaType(type)}>
              <h4 className="font-semibold text-lg text-gray-700">{type.name}</h4>
              <p className="text-sm text-gray-500">{type.job_templates.length} standard jobs</p>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Create New Area Type</h3>
          <form onSubmit={handleCreateAreaType} className="flex items-center space-x-2">
            <input type="text" value={newAreaTypeName} onChange={e => setNewAreaTypeName(e.target.value)} required placeholder="e.g., Standard Office" className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
            <button type="submit" className="py-2 px-4 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Create</button>
          </form>
        </div>
      </div>
      {selectedAreaType && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Jobs for "{selectedAreaType.name}"</h3>
          <ul className="space-y-2 mb-6">
            {selectedAreaType.job_templates.map(job => (
              <li key={job.id} className="p-2 rounded-md bg-gray-100">{job.description}</li>
            ))}
          </ul>
          <form onSubmit={handleCreateJobTemplate} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">New Job Description</label>
              <input type="text" value={newJobDescription} onChange={e => setNewJobDescription(e.target.value)} required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" />
            </div>
            <button type="submit" className="w-full py-2 px-4 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Add Job</button>
          </form>
        </div>
      )}
    </div>
  );
}
