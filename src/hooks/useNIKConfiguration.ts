import { useState, useEffect } from 'react';

export interface DepartmentNIKConfiguration {
  id: string;
  department_id: string;
  department_name: string;
  prefix: string;
  current_sequence: number;
  sequence_length: number;
  format_pattern: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  department?: {
    id: string;
    nama: string;
  };
  createdByUser?: {
    id: string;
    username: string;
    email: string;
  };
  updatedByUser?: {
    id: string;
    username: string;
    email: string;
  };
}

export interface DepartmentNIKConfigurationForm {
  department_id: string;
  department_name: string;
  prefix: string;
  current_sequence?: number;
  sequence_length?: number;
  format_pattern?: string;
  is_active?: boolean;
}

// Mock data untuk development
const mockDepartmentConfigurations: DepartmentNIKConfiguration[] = [
  {
    id: '1',
    department_id: 'dept-1',
    department_name: 'IT',
    prefix: 'IT',
    current_sequence: 1,
    sequence_length: 3,
    format_pattern: 'PREFIX + SEQUENCE',
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    department_id: 'dept-2',
    department_name: 'HR',
    prefix: 'HR',
    current_sequence: 15,
    sequence_length: 3,
    format_pattern: 'PREFIX + SEQUENCE',
    is_active: true,
    created_at: '2024-01-10T08:30:00Z',
    updated_at: '2024-01-10T08:30:00Z',
  },
  {
    id: '3',
    department_id: 'dept-3',
    department_name: 'Finance',
    prefix: 'FN',
    current_sequence: 8,
    sequence_length: 3,
    format_pattern: 'PREFIX + SEQUENCE',
    is_active: true,
    created_at: '2024-01-12T14:20:00Z',
    updated_at: '2024-01-12T14:20:00Z',
  },
  {
    id: '4',
    department_id: 'dept-4',
    department_name: 'Marketing',
    prefix: 'MK',
    current_sequence: 22,
    sequence_length: 3,
    format_pattern: 'PREFIX + SEQUENCE',
    is_active: false,
    created_at: '2024-01-08T09:15:00Z',
    updated_at: '2024-01-08T09:15:00Z',
  },
  {
    id: '5',
    department_id: 'dept-5',
    department_name: 'Operations',
    prefix: 'OPS',
    current_sequence: 5,
    sequence_length: 3,
    format_pattern: 'PREFIX + SEQUENCE',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }
];

const API_URL = import.meta.env.VITE_API_URL || '';

export const useNIKConfiguration = () => {
  const [configurations, setConfigurations] = useState<DepartmentNIKConfiguration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fetch configurations on mount
  useEffect(() => {
    fetchConfigurations();
  }, []);

  // Fetch all department NIK configurations
  const fetchConfigurations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!API_URL) {
        // Fallback ke mock data hanya jika benar-benar development tanpa backend
        setConfigurations([]);
        setLoading(false);
        setError('API URL tidak tersedia. Pastikan backend sudah di-setup.');
        return;
      }

      const res = await fetch(`${API_URL}/api/department-nik-configs`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      setConfigurations(data);
    } catch (err) {
      console.error('Error fetching NIK configurations:', err);
      setConfigurations([]); // Jangan tampilkan data apapun
      setError('Gagal mengambil data dari server. Silakan cek koneksi backend.');
    } finally {
      setLoading(false);
    }
  };

  // Get active configuration for specific department
  const getActiveConfigurationForDepartment = async (departmentName: string) => {
    try {
      if (!API_URL) {
        return mockDepartmentConfigurations.find(config => 
          config.department_name === departmentName && config.is_active
        ) || mockDepartmentConfigurations.find(config => 
          config.department_name === 'General' && config.is_active
        ) || null;
      }

      const res = await fetch(`${API_URL}/api/department-nik-configs/${encodeURIComponent(departmentName)}/active`);
      
      if (!res.ok) {
        if (res.status === 404) {
          return null; // No configuration found
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      return await res.json();
    } catch (err) {
      console.error('Error fetching active configuration:', err);
      // Fallback ke mock data
      return mockDepartmentConfigurations.find(config => 
        config.department_name === departmentName && config.is_active
      ) || mockDepartmentConfigurations.find(config => 
        config.department_name === 'General' && config.is_active
      ) || null;
    }
  };

  // Create new department configuration
  const createConfiguration = async (config: DepartmentNIKConfigurationForm) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!API_URL) {
        // Simulasi create dengan mock data
        const newConfig: DepartmentNIKConfiguration = {
          id: Date.now().toString(),
          department_id: config.department_id,
          department_name: config.department_name,
          prefix: config.prefix || 'EMP',
          current_sequence: config.current_sequence || 1,
          sequence_length: config.sequence_length || 3,
          format_pattern: config.format_pattern || 'PREFIX + SEQUENCE',
          is_active: config.is_active !== undefined ? config.is_active : true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setConfigurations(prev => [newConfig, ...prev]);
        return newConfig;
      }

      const res = await fetch(`${API_URL}/api/department-nik-configs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const newConfig = await res.json();
      setConfigurations(prev => [newConfig, ...prev]);
      return newConfig;
    } catch (err) {
      console.error('Error creating configuration:', err);
      setError('Gagal membuat konfigurasi. Silakan coba lagi.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update existing department configuration
  const updateConfiguration = async (id: string, config: Partial<DepartmentNIKConfigurationForm>) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!API_URL) {
        // Simulasi update dengan mock data
        setConfigurations(prev => prev.map(c => 
          c.id === id 
            ? { ...c, ...config, updated_at: new Date().toISOString() }
            : c
        ));
        return;
      }

      const res = await fetch(`${API_URL}/api/department-nik-configs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const updatedConfig = await res.json();
      setConfigurations(prev => prev.map(c => 
        c.id === id ? updatedConfig : c
      ));
      return updatedConfig;
    } catch (err) {
      console.error('Error updating configuration:', err);
      setError('Gagal mengupdate konfigurasi. Silakan coba lagi.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete department configuration
  const deleteConfiguration = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!API_URL) {
        // Simulasi delete dengan mock data
        setConfigurations(prev => prev.filter(c => c.id !== id));
        return;
      }

      const res = await fetch(`${API_URL}/api/department-nik-configs/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      setConfigurations(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting configuration:', err);
      setError('Gagal menghapus konfigurasi. Silakan coba lagi.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Generate next NIK for specific department
  const generateNextNIKForDepartment = async (departmentName: string) => {
    try {
      if (!API_URL) {
        // Simulasi generate dengan mock data
        const activeConfig = mockDepartmentConfigurations.find(config => 
          config.department_name === departmentName && config.is_active
        );
        
        if (!activeConfig) {
          throw new Error('Tidak ada konfigurasi aktif untuk departemen ini');
        }
        
        const nextSequence = activeConfig.current_sequence + 1;
        const nik = activeConfig.prefix + 
                    nextSequence.toString().padStart(activeConfig.sequence_length, '0');
        
        // Update sequence di mock data
        setConfigurations(prev => prev.map(c => 
          c.id === activeConfig.id 
            ? { ...c, current_sequence: nextSequence }
            : c
        ));
        
        return nik;
      }

      console.log('Calling generate NIK endpoint for department:', departmentName);
      const res = await fetch(`${API_URL}/api/department-nik-configs/${encodeURIComponent(departmentName)}/generate-next`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Generate NIK endpoint error:', errorText);
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log('Response from generate NIK endpoint:', data);
      
      // Update sequence di state
      setConfigurations(prev => prev.map(c => 
        c.department_name === departmentName 
          ? { ...c, current_sequence: data.config.current_sequence }
          : c
      ));
      
      if (!data.next_nik) {
        console.error('No next_nik in response:', data);
        throw new Error('Response tidak mengandung next_nik');
      }
      
      console.log('Generated NIK:', data.next_nik);
      return data.next_nik;
    } catch (err) {
      console.error('Error generating NIK:', err);
      throw err;
    }
  };

  // Test NIK format for specific department
  const testNIKFormatForDepartment = async (nik: string, departmentName: string) => {
    try {
      if (!API_URL) {
        // Test dengan mock data
        const activeConfig = mockDepartmentConfigurations.find(c => 
          c.department_name === departmentName && c.is_active
        ) || mockDepartmentConfigurations.find(c => 
          c.department_name === 'General' && c.is_active
        );
        
        if (!activeConfig) {
          return { is_valid: false, message: 'Konfigurasi tidak ditemukan' };
        }
        
        const expectedPattern = new RegExp(`^${activeConfig.prefix}[0-9]{${activeConfig.sequence_length}}$`);
        const isValid = expectedPattern.test(nik);
        
        return {
          is_valid: isValid,
          expected_format: activeConfig.prefix + 'XXX',
          actual_input: nik,
          config: activeConfig
        };
      }

      const res = await fetch(`${API_URL}/api/department-nik-configs/validate-format`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          nik_input: nik, 
          department_name: departmentName 
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Error testing NIK format:', err);
      throw new Error(err instanceof Error ? err.message : 'Gagal test format NIK');
    }
  };

  // Get all available departments
  const getAvailableDepartments = () => {
    const departments = configurations.map(config => config.department_name);
    return [...new Set(departments)]; // Remove duplicates
  };

  return {
    configurations,
    loading,
    error,
    fetchConfigurations,
    getActiveConfigurationForDepartment,
    createConfiguration,
    updateConfiguration,
    deleteConfiguration,
    generateNextNIKForDepartment,
    testNIKFormatForDepartment,
    getAvailableDepartments,
  };
}; 