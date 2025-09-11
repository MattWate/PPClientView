import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';

export default function AreaEditModal({ area, isOpen, onClose, onUpdate, profile }) {
  const [tasks, setTasks] = useState([]);
  const [jobTemplates, setJobTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen || !area) return;
      setLoading(true);
      setError('');
      try {
        // Fetch existing one-off tasks for this specific area
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('id, job_templates(description)') // Assuming one-off tasks are stored as tasks with a job_template
          .eq('area_id', area.id);
        if (tasksError) throw tasksError;
        setTasks(tasksData || []);

        // Fetch available job templates for the area's type, if it has one
        if (area.area_types?.id) {
          const { data: templatesData, error: templatesError } = await supabase
            .from('job_templates')
            .select('id, description')
            .eq('area_type_id', area.area_types.id);
          if (templatesError) throw templatesError;
          setJobTemplates(templatesData || []);
        } else {
          setJobTemplates([]);
        }

      } catch (err) {
        setError('Failed to load area details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isOpen, area]);

  const handleAddTaskFromTemplate = async (templateId) => {
    try {
      setError('');
      // This is a simplified example. You might need more details for a task.
      const { error } = await supabase.from('tasks').insert({
        area_id: area.id,
        zone_id: area.zone_id,
        site_id: area.zones?.site_id, // This assumes zone is nested under site in your fetch
        company_id: profile.company_id,
        job_template_id: templateId,
        status: 'pending',
      });
      if (error) throw error;
      onUpdate(); // Refresh the main list
      onClose();   // Close modal on success
    } catch (err) {
      setError('Failed to add task from template.');
      console.error(err);
    }
  };

  const handleAddSpecificTask = async (e) => {
    e.preventDefault();
    try {
        setError('');
        // 1. Create a new job template for this one-off task
        const { data: newTemplate, error: templateError } = await supabase
            .from('job_templates')
            .insert({ description: newTaskDescription, company_id: profile.company_id, area_type_id: area.area_types?.id })
            .select('id')
            .single();

        if (templateError) throw templateError;

        // 2. Create the task linking to the new template
        const { error: taskError } = await supabase.from('tasks').insert({
            area_id: area.id,
            zone_id: area.zone_id,
            site_id: area.zones?.site_id, // This needs correct site_id
            company_id: profile.company_id,
            job_template_id: newTemplate.id,
            status: 'pending',
        });
        if (taskError) throw taskError;

        setNewTaskDescription('');
        onUpdate();
        onClose();
    } catch (err) {
        setError('Failed to add specific task.');
        console.error(err);
    }
  };

  if (!isOpen || !area) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-2xl mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Area: {area.name}</h2>
            {area.area_types && <p className="text-sm text-gray-500">Type: {area.area_types.name}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>
        
        {loading && <p>Loading details...</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Tasks */}
            <div>
                <h3 className="font-semibold text-lg mb-2">Current Tasks</h3>
                {tasks.length > 0 ? (
                    <ul className="space-y-2">
                        {tasks.map(task => (
                            <li key={task.id} className="p-2 bg-gray-100 rounded-md text-sm">{task.job_templates.description}</li>
                        ))}
                    </ul>
                ) : <p className="text-sm text-gray-500">No specific tasks assigned.</p>}
            </div>

            {/* Actions */}
            <div>
                {/* Add from Template */}
                {area.area_types && (
                    <div className="mb-6">
                        <h3 className="font-semibold text-lg mb-2">Add Task from Template</h3>
                        {jobTemplates.length > 0 ? (
                             <ul className="space-y-2">
                                {jobTemplates.map(template => (
                                    <li key={template.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                                        <span className="text-sm">{template.description}</span>
                                        <button onClick={() => handleAddTaskFromTemplate(template.id)} className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Add</button>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-gray-500">No templates for this area type.</p>}
                    </div>
                )}
                
                {/* Add Specific Task */}
                <div>
                    <h3 className="font-semibold text-lg mb-2">Add a Specific Task</h3>
                    <form onSubmit={handleAddSpecificTask} className="space-y-2">
                        <textarea
                            value={newTaskDescription}
                            onChange={(e) => setNewTaskDescription(e.target.value)}
                            placeholder="Describe the one-off task..."
                            required
                            className="w-full p-2 border border-gray-300 rounded-md"
                        />
                        <button type="submit" className="w-full py-2 px-4 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                            Add Task
                        </button>
                    </form>
                </div>
            </div>
        </div>
        
        <div className="mt-8 pt-4 border-t text-right">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                Close
            </button>
        </div>
      </div>
    </div>
  );
}
