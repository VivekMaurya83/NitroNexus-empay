import api from './api';

export const holidayService = {
  getHolidays: async (year, month = null) => {
    const params = new URLSearchParams({ year });
    if (month) params.append('month', month);
    const data = await api.get(`/holidays/?${params.toString()}`);
    return data; // Array of HolidayOut objects
  },

  createHoliday: async (holidayData) => {
    const data = await api.post('/holidays/', holidayData);
    return data;
  },

  deleteHoliday: async (holidayId) => {
    const data = await api.delete(`/holidays/${holidayId}`);
    return data;
  },

  seedIndianHolidays: async (year) => {
    const data = await api.post(`/holidays/seed-indian/${year}`);
    return data;
  }
};
