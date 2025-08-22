// Helper function to format Date object to HH:MM:SS time string
export const formatTimeToString = (date: Date | string | null): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return '-';
    
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    const seconds = dateObj.getSeconds().toString().padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return '-';
  }
};

// Helper function to check if time is late (after 08:00)
export const isLateTime = (date: Date | string | null): boolean => {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return false;
    
    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    
    return hours > 8 || (hours === 8 && minutes > 0);
  } catch (error) {
    return false;
  }
};
