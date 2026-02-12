// Shared Store Time & Weather functionality for all pages

// Get timezone for state (IANA timezone identifier)
function getTimezoneForState(state) {
    const tzMap = {
        'CA': 'America/Los_Angeles', 'NV': 'America/Los_Angeles', 'WA': 'America/Los_Angeles', 'OR': 'America/Los_Angeles',
        'TX': 'America/Chicago', 'IL': 'America/Chicago', 'MO': 'America/Chicago', 'AR': 'America/Chicago', 'LA': 'America/Chicago', 'OK': 'America/Chicago', 'KS': 'America/Chicago', 'NE': 'America/Chicago', 'SD': 'America/Chicago', 'ND': 'America/Chicago', 'MN': 'America/Chicago', 'WI': 'America/Chicago', 'IA': 'America/Chicago', 'TN': 'America/Chicago', 'AL': 'America/Chicago', 'MS': 'America/Chicago',
        'NY': 'America/New_York', 'FL': 'America/New_York', 'NC': 'America/New_York', 'GA': 'America/New_York', 'PA': 'America/New_York', 'OH': 'America/New_York', 'MI': 'America/New_York', 'NJ': 'America/New_York', 'VA': 'America/New_York', 'MA': 'America/New_York', 'MD': 'America/New_York', 'SC': 'America/New_York', 'KY': 'America/New_York', 'WV': 'America/New_York', 'VT': 'America/New_York', 'NH': 'America/New_York', 'ME': 'America/New_York', 'RI': 'America/New_York', 'CT': 'America/New_York', 'DE': 'America/New_York', 'DC': 'America/New_York',
        'CO': 'America/Denver', 'UT': 'America/Denver', 'AZ': 'America/Phoenix', 'NM': 'America/Denver', 'WY': 'America/Denver', 'MT': 'America/Denver', 'ID': 'America/Denver'
    };
    return tzMap[state] || 'America/New_York';
}

// Get timezone abbreviation
function getTimezoneAbbreviation(state) {
    const tzMap = {
        'CA': 'PST', 'NV': 'PST', 'WA': 'PST', 'OR': 'PST',
        'TX': 'CST', 'IL': 'CST', 'MO': 'CST', 'AR': 'CST', 'LA': 'CST', 'OK': 'CST', 'KS': 'CST', 'NE': 'CST', 'SD': 'CST', 'ND': 'CST', 'MN': 'CST', 'WI': 'CST', 'IA': 'CST', 'TN': 'CST', 'AL': 'CST', 'MS': 'CST',
        'NY': 'EST', 'FL': 'EST', 'NC': 'EST', 'GA': 'EST', 'PA': 'EST', 'OH': 'EST', 'MI': 'EST', 'NJ': 'EST', 'VA': 'EST', 'MA': 'EST', 'MD': 'EST', 'SC': 'EST', 'KY': 'EST', 'WV': 'EST', 'VT': 'EST', 'NH': 'EST', 'ME': 'EST', 'RI': 'EST', 'CT': 'EST', 'DE': 'EST', 'DC': 'EST',
        'CO': 'MST', 'UT': 'MST', 'AZ': 'MST', 'NM': 'MST', 'WY': 'MST', 'MT': 'MST', 'ID': 'MST'
    };
    return tzMap[state] || 'EST';
}

// Get mock weather data
function getMockWeather(city, state) {
    // Simple mock weather based on time of day and season
    const hour = new Date().getHours();
    const month = new Date().getMonth();
    
    // Determine season and base temperature
    const isWinter = month >= 11 || month <= 2;
    const isSummer = month >= 5 && month <= 8;
    
    // Base temperature by season and state region
    let baseTemp = 70;
    if (isWinter) {
        // Colder states in winter
        if (['MN', 'WI', 'ND', 'SD', 'MT', 'ME', 'VT', 'NH'].includes(state)) {
            baseTemp = 25;
        } else if (['NY', 'MA', 'CT', 'RI', 'PA', 'MI', 'OH'].includes(state)) {
            baseTemp = 35;
        } else if (['CA', 'FL', 'TX', 'AZ', 'NV'].includes(state)) {
            baseTemp = 65;
        } else {
            baseTemp = 45;
        }
    } else if (isSummer) {
        // Hotter states in summer
        if (['AZ', 'NV', 'TX', 'FL'].includes(state)) {
            baseTemp = 95;
        } else if (['CA', 'NC', 'GA', 'SC'].includes(state)) {
            baseTemp = 85;
        } else {
            baseTemp = 75;
        }
    }
    
    // Adjust for time of day (cooler at night)
    if (hour >= 20 || hour < 6) {
        baseTemp -= 10;
    }
    
    // Mock weather conditions with temperature
    const conditions = [
        { icon: '☀️', condition: `Sunny, ${baseTemp}°F` },
        { icon: '⛅', condition: `Partly Cloudy, ${baseTemp - 2}°F` },
        { icon: '☁️', condition: `Cloudy, ${baseTemp - 4}°F` },
        { icon: '🌤️', condition: `Mostly Sunny, ${baseTemp - 1}°F` },
        { icon: '🌧️', condition: `Light Rain, ${baseTemp - 5}°F` }
    ];
    
    // Simple logic: sunny during day, varied at night
    if (hour >= 6 && hour < 20) {
        // Daytime - mostly sunny
        return Math.random() > 0.3 ? conditions[0] : conditions[1];
    } else {
        // Nighttime - varied
        const rand = Math.random();
        if (rand > 0.7) return conditions[2]; // Cloudy
        if (rand > 0.4) return conditions[1]; // Partly Cloudy
        return conditions[0]; // Sunny
    }
}

// Update store local time and weather
function updateStoreTimeAndWeather(wo) {
    const state = wo?.state || 'NC';
    const city = wo?.city || 'Winston-Salem';
    const timezone = getTimezoneForState(state);
    
    // Get current time in store's timezone with dummy data fallback
    const timeEl = document.getElementById('storeLocalTime');
    const weatherEl = document.getElementById('storeWeather');
    const weatherIconEl = document.getElementById('weatherIcon');
    
    if (!timeEl || !weatherEl || !weatherIconEl) {
        console.warn('Time/weather elements not found in top nav');
        return;
    }
    
    try {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true,
            timeZone: timezone
        });
        
        // Get timezone abbreviation
        const tzAbbr = getTimezoneAbbreviation(state);
        timeEl.textContent = `${timeString} ${tzAbbr}`;
    } catch (e) {
        // Fallback dummy data
        timeEl.textContent = '1:33 AM EST';
    }
    
    // Mock weather data (in production, call weather API)
    const weatherData = getMockWeather(city, state);
    weatherEl.textContent = weatherData.condition;
    weatherIconEl.textContent = weatherData.icon;
}

// Initialize store time and weather on page load
document.addEventListener('DOMContentLoaded', () => {
    // Use default store location (Winston-Salem, NC)
    updateStoreTimeAndWeather({ state: 'NC', city: 'Winston-Salem' });
    
    // Update time every minute
    setInterval(() => {
        updateStoreTimeAndWeather({ state: 'NC', city: 'Winston-Salem' });
    }, 60000); // Update every minute
});
