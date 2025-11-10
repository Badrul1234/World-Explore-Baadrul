
export default class CountryService {
  constructor(){
    this.endpointTemplate = 'https://restcountries.com/v3.1/name/{name}';
    this.cacheKey = 'we_cache_v1';
    this.maxHistory = 6;
  }

  _readCache(){
    try { return JSON.parse(localStorage.getItem(this.cacheKey) || '{}'); }
    catch(e){ return {}; }
  }

  _writeCache(obj){
    localStorage.setItem(this.cacheKey, JSON.stringify(obj));
  }

  clearCache(){ localStorage.removeItem(this.cacheKey); }

  async search(name){
    const key = name.toLowerCase();
    const cache = this._readCache();
    if (cache[key]) {
      return cache[key].map(this._mapCountry);
    }

    const url = this.endpointTemplate.replace('{name}', encodeURIComponent(name));
    const res = await fetch(url);
    if (!res.ok) throw new Error('No country found');
    const json = await res.json();

    cache[key] = json;
    this._writeCache(cache);
    this._pushHistory(name);

    return json.map(this._mapCountry);
  }

  _mapCountry(raw){
    const languages = raw.languages ? Object.values(raw.languages).join(', ') : '';
    return {
      name: raw.name.common,
      cca2: raw.cca2 || '',
      capital: raw.capital ? raw.capital.join(', ') : '',
      region: raw.region || '',
      population: raw.population ? raw.population.toLocaleString() : '',
      languages,
      flag: raw.flags?.png || raw.flags?.svg || '',
      maps: raw.maps?.googleMaps || raw.maps?.openStreetMaps || '',
      fullRaw: raw
    };
  }

  _pushHistory(name){
    const key = 'we_history_v1';
    try {
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      if (arr[0] === name) return;
      arr.unshift(name);
      while (arr.length > this.maxHistory) arr.pop();
      localStorage.setItem(key, JSON.stringify(arr));
    } catch(e){}
  }

  getSearchHistory(){ return JSON.parse(localStorage.getItem('we_history_v1') || '[]'); }
}
