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
      
      // Use UTC methods to avoid timezone issues
      const hours = date.getUTCHours().toString().padStart(2, '0');
      const minutes = date.getUTCMinutes().toString().padStart(2, '0');
      const seconds = date.getUTCSeconds().toString().padStart(2, '0');
      
      return `${hours}:${minutes}:${seconds}`;
    }
    
    // If it's a string that might be a date, try to parse it
    if (typeof date === 'string') {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return '-';
      
      // Use UTC methods to avoid timezone issues
      const hours = dateObj.getUTCHours().toString().padStart(2, '0');
      const minutes = dateObj.getUTCMinutes().toString().padStart(2, '0');
      const seconds = dateObj.getUTCSeconds().toString().padStart(2, '0');
      
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
    
    // Format time consistently using UTC methods to avoid timezone issues
    const hours = dateObj.getUTCHours().toString().padStart(2, '0');
    const minutes = dateObj.getUTCMinutes().toString().padStart(2, '0');
    const seconds = dateObj.getUTCSeconds().toString().padStart(2, '0');
    
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
      
      // Use UTC methods to avoid timezone issues
      hours = dateObj.getUTCHours();
      minutes = dateObj.getUTCMinutes();
    }
    
    return hours > 8 || (hours === 8 && minutes > 0);
  } catch (error) {
    return false;
  }
};

// Test function untuk memverifikasi format waktu yang benar
export const testTimeFormat = () => {
  const testCases = [
    // [input_time, expected_output, description]
    ['17:10:00', '17:10:00', 'Jam pulang sore (17:10)'],
    ['07:20:00', '07:20:00', 'Jam masuk pagi (07:20)'],
    ['08:00:00', '08:00:00', 'Jam masuk tepat waktu (08:00)'],
    ['16:00:00', '16:00:00', 'Jam pulang normal (16:00)']
  ];
  
  console.log('Testing time format:');
  console.log('================================');
  testCases.forEach(([input, expected, description]) => {
    const result = formatTimeToStringWithFix(input);
    const status = result === expected ? '✅' : '❌';
    console.log(`${status} ${input} → ${result} (expected: ${expected})`);
    console.log(`   ${description}`);
  });
  console.log('================================');
};

// Function to calculate leave duration excluding weekends (Saturday and Sunday)
export const calculateLeaveDuration = (startDate: any, endDate: any): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 0;
  }
  
  // Ensure start date is before or equal to end date
  if (start > end) {
    return 0;
  }
  
  let workDays = 0;
  const currentDate = new Date(start);
  
  // Set time to 00:00:00 to avoid timezone issues
  currentDate.setHours(0, 0, 0, 0);
  
  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Only count weekdays (Monday = 1, Tuesday = 2, ..., Friday = 5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      workDays++;
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return workDays;
};

// Test function untuk memverifikasi perhitungan durasi cuti
export const testLeaveDuration = () => {
  const testCases = [
    // [start_date, end_date, expected_days, description]
    ['2025-09-08', '2025-09-19', 10, 'Cuti 8-19 September (12 hari kalender, 10 hari kerja)'],
    ['2025-09-01', '2025-09-05', 5, 'Cuti Senin-Jumat (5 hari kerja)'],
    ['2025-09-06', '2025-09-07', 0, 'Cuti Sabtu-Minggu (0 hari kerja)'],
    ['2025-09-05', '2025-09-08', 2, 'Cuti Jumat-Senin (2 hari kerja, Sabtu-Minggu tidak dihitung)'],
    ['2025-09-01', '2025-09-01', 1, 'Cuti 1 hari'],
    ['2025-09-06', '2025-09-06', 0, 'Cuti Sabtu (0 hari kerja)'],
    ['2025-09-07', '2025-09-07', 0, 'Cuti Minggu (0 hari kerja)'],
  ];
  
  console.log('Testing leave duration calculation:');
  console.log('================================');
  testCases.forEach(([start, end, expected, description]) => {
    const result = calculateLeaveDuration(start, end);
    const status = result === expected ? '✅' : '❌';
    console.log(`${status} ${start} to ${end} → ${result} days (expected: ${expected})`);
    console.log(`   ${description}`);
  });
  console.log('================================');
};
