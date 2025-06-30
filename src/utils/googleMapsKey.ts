
export const getGoogleMapsApiKey = async (): Promise<string> => {
  try {
    const response = await fetch('https://gklfrynehiqrwbddvaaa.supabase.co/functions/v1/get-google-maps-key', {
      headers: {
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrbGZyeW5laGlxcndiZGR2YWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMDcyMjUsImV4cCI6MjA2MzY4MzIyNX0.uXqbDiPCU99bmemtBIrxXqm3jm53gHnhv3gvCJXrBaU`,
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrbGZyeW5laGlxcndiZGR2YWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMDcyMjUsImV4cCI6MjA2MzY4MzIyNX0.uXqbDiPCU99bmemtBIrxXqm3jm53gHnhv3gvCJXrBaU'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.apiKey || '';
    }
  } catch (error) {
    console.error('Error getting Google Maps API key:', error);
  }
  
  return '';
};
