// Helper function to format Date object to HH:MM:SS time string
export const formatTimeToString = (date: Date | string | null): string => {
  if (!date) return '-';
  
  try {
    // If it's already a time string in HH:MM:SS format, return it directly
    if (typeof date === 'string' && /^\d{1,2}:\d{2}:\d{2}$/.test(date)) {
      return date;
    }
    
    // If it's a date string that contains time, extract the time part
    if (typeof date === 'string' && date.includes('T')) {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return '-';
      
      const hours = dateObj.getHours().toString().padStart(2, '0');
      const minutes = dateObj.getMinutes().toString().padStart(2, '0');
      const seconds = dateObj.getSeconds().toString().padStart(2, '0');
      
      return `${hours}:${minutes}:${seconds}`;
    }
    
    // If it's a Date object
    if (date instanceof Date) {
      if (isNaN(date.getTime())) return '-';
      
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      
      return `${hours}:${minutes}:${seconds}`;
    }
    
    // If it's a string that might be a date, try to parse it
    if (typeof date === 'string') {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return '-';
      
      const hours = dateObj.getHours().toString().padStart(2, '0');
      const minutes = dateObj.getMinutes().toString().padStart(2, '0');
      const seconds = dateObj.getSeconds().toString().padStart(2, '0');
      
      return `${hours}:${minutes}:${seconds}`;
    }
    
    return '-';
  } catch (error) {
    console.error('Error formatting time:', error);
    return '-';
  }
};

// Helper function to fix timezone issues by detecting and correcting times that are off by 7 hours
export const formatTimeToStringWithFix = (date: Date | string | null): string => {
  if (!date) return '-';
  
  try {
    // If it's already a time string in HH:MM:SS format, return it directly
    if (typeof date === 'string' && /^\d{1,2}:\d{2}:\d{2}$/.test(date)) {
      return date;
    }
    
    let dateObj: Date;
    
    // Parse the date
    if (typeof date === 'string') {
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }
    
    if (isNaN(dateObj.getTime())) return '-';
    
    // Check if the time is likely affected by timezone issues (7 hours off)
    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const seconds = dateObj.getSeconds();
    
    // If hours are 12 or more, it's likely a timezone issue
    // We'll subtract 7 hours to fix it
    let adjustedHours = hours;
    if (hours >= 12) {
      adjustedHours = hours - 7;
      // Handle negative hours
      if (adjustedHours < 0) {
        adjustedHours += 24;
      }
    }
    
    const formattedHours = adjustedHours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');
    
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  } catch (error) {
    console.error('Error formatting time with fix:', error);
    return '-';
  }
};

// Helper function to check if time is late (after 08:00)
export const isLateTime = (date: Date | string | null): boolean => {
  if (!date) return false;
  
  try {
    let hours: number, minutes: number;
    
    // If it's already a time string in HH:MM:SS format, parse it directly
    if (typeof date === 'string' && /^\d{1,2}:\d{2}:\d{2}$/.test(date)) {
      const [h, m] = date.split(':').map(Number);
      hours = h;
      minutes = m;
    } else {
      // Handle Date object or date string
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return false;
      
      hours = dateObj.getHours();
      minutes = dateObj.getMinutes();
    }
    
    return hours > 8 || (hours === 8 && minutes > 0);
  } catch (error) {
    return false;
  }
};
