import axios from 'axios';

class CurrencyService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 3600000; // 1 hour
  }

  async getExchangeRate(from, to) {
    const cacheKey = `${from}-${to}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.rate;
    }

    try {
      const response = await axios.get(
        `https://api.exchangerate-api.com/v4/latest/${from}`
      );
      
      const rate = response.data.rates[to];
      
      if (!rate) {
        throw new Error(`Exchange rate not found for ${from} to ${to}`);
      }

      this.cache.set(cacheKey, { rate, timestamp: Date.now() });
      return rate;
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      throw new Error('Failed to fetch exchange rate');
    }
  }

  async convert(amount, from, to) {
    if (from === to) return amount;
    
    const rate = await this.getExchangeRate(from, to);
    return amount * rate;
  }

  async getAllCountries() {
    try {
      const response = await axios.get(
        'https://restcountries.com/v3.1/all?fields=name,currencies'
      );
      
      return response.data.map(country => ({
        name: country.name.common,
        currencies: country.currencies
      })).filter(c => c.currencies);
    } catch (error) {
      console.error('Error fetching countries:', error);
      throw new Error('Failed to fetch countries');
    }
  }
}

export default new CurrencyService();
