import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || "";

interface PayrollComponent {
  id: number;
  name: string;
  type: 'income' | 'deduction';
  category: 'fixed' | 'variable' | 'bpjs' | 'allowance';
  percentage: number;
  amount: number;
  is_active: boolean;
  description: string;
  created_at: string;
  updated_at: string;
}

interface PayrollStats {
  total: number;
  income_count: number;
  deduction_count: number;
  bpjs_count: number;
  active_count: number;
}

export const usePayrollComponents = () => {
  const [components, setComponents] = useState<PayrollComponent[]>([]);
  const [stats, setStats] = useState<PayrollStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComponents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/payroll-components`);
      if (!response.ok) {
        throw new Error('Failed to fetch payroll components');
      }
      const data = await response.json();
      setComponents(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/payroll-components/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch payroll stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
    }
  };

  const createComponent = async (component: Omit<PayrollComponent, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch(`${API_URL}/api/payroll-components`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(component),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create payroll component');
      }
      
      const newComponent = await response.json();
      setComponents(prev => [...prev, newComponent]);
      return newComponent;
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const updateComponent = async (id: number, component: Partial<PayrollComponent>) => {
    try {
      const response = await fetch(`${API_URL}/api/payroll-components/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(component),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update payroll component');
      }
      
      const updatedComponent = await response.json();
      setComponents(prev => 
        prev.map(c => c.id === id ? updatedComponent : c)
      );
      return updatedComponent;
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const deleteComponent = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/api/payroll-components/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete payroll component');
      }
      
      setComponents(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const toggleActive = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/api/payroll-components/${id}/toggle`, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle payroll component');
      }
      
      const updatedComponent = await response.json();
      setComponents(prev => 
        prev.map(c => c.id === id ? updatedComponent : c)
      );
      return updatedComponent;
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  useEffect(() => {
    fetchComponents();
    fetchStats();
  }, []);

  return {
    components,
    stats,
    loading,
    error,
    fetchComponents,
    fetchStats,
    createComponent,
    updateComponent,
    deleteComponent,
    toggleActive,
  };
}; 