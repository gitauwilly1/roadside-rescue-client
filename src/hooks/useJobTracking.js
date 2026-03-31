import { useState, useEffect, useCallback } from 'react';
import { client, garage } from '../services/api';

const useJobTracking = (role, socket, isConnected) => {
  const [jobs, setJobs] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      let response;
      if (role === 'client') {
        response = await client.getJobs({ limit: 50 });
      } else if (role === 'garage') {
        response = await garage.getJobs({ limit: 50 });
      }
      
      if (response) {
        setJobs(response.data.jobs);
        
        const active = response.data.jobs.find(job => 
          ['pending', 'accepted', 'en_route', 'in_progress'].includes(job.status)
        );
        setActiveJob(active);
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
      setError(err.response?.data?.error || 'Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  }, [role]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleJobUpdate = (updatedJob) => {
      console.log('Job update received:', updatedJob);
      setJobs(prev => 
        prev.map(job => job._id === updatedJob._id ? { ...job, ...updatedJob } : job)
      );
      
      if (activeJob && activeJob._id === updatedJob._id) {
        setActiveJob(updatedJob);
      }
      
      loadJobs();
    };

    socket.on('job_status_update', handleJobUpdate);
    
    if (role === 'garage') {
      socket.on('new_job_alert', handleJobUpdate);
    }

    return () => {
      socket.off('job_status_update', handleJobUpdate);
      socket.off('new_job_alert', handleJobUpdate);
    };
  }, [socket, isConnected, role, activeJob, loadJobs]);

  useEffect(() => {
    if (socket && isConnected && activeJob) {
      socket.emit('join_job_room', activeJob._id);
    }
  }, [socket, isConnected, activeJob]);

  return {
    jobs,
    activeJob,
    isLoading,
    error,
    loadJobs,
    setJobs,
    setActiveJob,
  };
};

export default useJobTracking;