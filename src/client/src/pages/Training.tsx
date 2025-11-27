import { useState, useEffect } from 'react';
import api from '../lib/api';

export default function Training() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await api.get('/training/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to load projects', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Training Projects</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Projects</h2>
        {projects.length === 0 ? (
          <p className="text-gray-500">No projects found. Add your first project to get started.</p>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project.id} className="border rounded-lg p-4">
                <h3 className="font-semibold">{project.name}</h3>
                <p className="text-sm text-gray-600">{project.client_name}</p>
                <p className="text-sm text-gray-500 mt-2">Status: {project.status}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

