
import type { Weather, DayOfWeek } from '../types';

// This function simulates a weather API call for Logan, QLD
export const getMockWeather = (location: { city: string; state: string }): Promise<Weather> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const today = new Date();
      const weekDays: DayOfWeek[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      
      const forecast = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(today.getDate() + i);
        const day = weekDays[date.getDay()];
        
        // Let's create a heatwave scenario
        const maxTemp = 30 + i; 
        const minTemp = 18 + i;
        
        return {
          day: day as DayOfWeek,
          maxTempC: maxTemp,
          minTempC: minTemp,
          chanceOfRain: i > 4 ? 60 : 10, // Rain towards the end of the week
          condition: i > 4 ? 'Showers' : 'Sunny',
        };
      });

      const mockWeather: Weather = {
        location: {
          name: location.city,
          region: location.state,
        },
        current: {
          tempC: 28,
          humidity: 65,
          precipMM: 0,
          condition: 'Sunny',
          windKPH: 15,
        },
        forecast: forecast,
      };
      resolve(mockWeather);
    }, 1000); // Simulate network delay
  });
};
