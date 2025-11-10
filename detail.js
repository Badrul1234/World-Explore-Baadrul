// renderer/detail.js
import ItineraryManager from './itineraryManager.js';

const mgr = new ItineraryManager();

const RAW_KEY = 'we_detail';

const nameEl = document.getElementById('country-name');
const flagImg = document.getElementById('flag-img');
const detailBody = document.getElementById('detail-body');
const notesEl = document.getElementById('notes');
const btnAdd = document.getElementById('btn-add-itinerary');
const btnOpenMap = document.getElementById('btn-open-map');
const backHome = document.getElementById('back-home');

function safe(val){ return val == null ? '' : val; }

function renderFromRaw(raw){
  if (!raw || !raw.name) {
    alert('No country data found. Returning.');
    window.location.href = 'index.html';
    return;
  }

  nameEl.textContent = safe(raw.name.common || raw.name.official || 'Country');
  const flagSrc = raw.flags?.svg || raw.flags?.png || '';
  flagImg.src = flagSrc;
  flagImg.alt = `${safe(raw.name.common)} flag`;

  const capital = Array.isArray(raw.capital) ? raw.capital.join(', ') : safe(raw.capital);
  const currencies = raw.currencies ? Object.values(raw.currencies).map(c => `${c.name}${c.symbol ? ' ('+c.symbol+')' : ''}`).join(', ') : '';
  const languages = raw.languages ? Object.values(raw.languages).join(', ') : '';
  const subregion = safe(raw.subregion);
  const region = safe(raw.region);
  const population = raw.population ? raw.population.toLocaleString() : '';
  const timezones = Array.isArray(raw.timezones) ? raw.timezones.join(', ') : '';
  const maps = (raw.maps && (raw.maps.googleMaps || raw.maps.openStreetMaps)) ? (raw.maps.googleMaps || raw.maps.openStreetMaps) : '';

  const rows = [
    ['Capital', capital],
    ['Region', region],
    ['Subregion', subregion],
    ['Population', population],
    ['Languages', languages],
    ['Currencies', currencies],
    ['Timezones', timezones],
  ];

  detailBody.innerHTML = rows.map(r => `<tr><td style="width:140px"><strong>${r[0]}</strong></td><td>${r[1] || ''}</td></tr>`).join('');

  if (maps) {
    btnOpenMap.href = maps;
    btnOpenMap.style.display = 'inline-flex';
  } else {
    btnOpenMap.style.display = 'none';
  }

  try {
    const existing = mgr.getAll().find(i => i.name === raw.name.common);
    if (existing && existing.notes) notesEl.value = existing.notes;
  } catch(e){}
}

let raw = null;
try {
  const json = sessionStorage.getItem(RAW_KEY);
  raw = json ? JSON.parse(json) : null;
} catch(e){
  raw = null;
}

renderFromRaw(raw);

btnAdd.addEventListener('click', () => {
  if (!raw) return alert('No country data.');

  const item = {
    id: Date.now(),
    name: raw.name?.common || raw.name?.official || 'Unknown',
    capital: Array.isArray(raw.capital) ? raw.capital.join(', ') : (raw.capital || ''),
    region: raw.region || '',
    population: raw.population ? raw.population.toLocaleString() : '',
    flag: raw.flags?.png || raw.flags?.svg || '',
    maps: raw.maps?.googleMaps || raw.maps?.openStreetMaps || '',
    notes: notesEl.value ? notesEl.value.trim() : '',
    visited: false,
    addedAt: new Date().toISOString()
  };

  const exists = mgr.getAll().find(i => i.name === item.name);
  if (exists) {
    mgr.updateNotes(exists.id, item.notes);
    alert('Updated notes for existing itinerary entry.');
  } else {
    mgr.add(item);
    alert('Added to itinerary.');
  }

  window.location.href = 'index.html';
});

backHome.addEventListener('click', () => {
  try { sessionStorage.removeItem(RAW_KEY); } catch(e){}
});
