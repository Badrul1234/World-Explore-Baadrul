// renderer/app.js
import CountryService from './countryService.js';
import ItineraryManager from './itineraryManager.js';

const service = new CountryService();
const mgr = new ItineraryManager();

// DOM elements
const qInput = document.getElementById('q');
const searchBtn = document.getElementById('search');
const results = document.getElementById('results');
const status = document.getElementById('status');
const historySelect = document.getElementById('history');
const itList = document.getElementById('it-list');
const btnClearCache = document.getElementById('btnClearCache');
const manualAdd = document.getElementById('manual-add');
const manualName = document.getElementById('manual-name');

// Modals
const detailModal = document.getElementById('detail-modal');
const detailContent = document.getElementById('detail-content');
const editModal = document.getElementById('edit-modal');
const editTextarea = document.getElementById('edit-notes-text');
const editSaveBtn = document.getElementById('edit-save');
const editCancelBtn = document.getElementById('edit-cancel');
const deleteModal = document.getElementById('delete-modal');
const deleteConfirmBtn = document.getElementById('delete-confirm');
const deleteCancelBtn = document.getElementById('delete-cancel');

let currentEditId = null;
let currentDeleteId = null;

// Helpers
function setStatus(msg){ status.textContent = msg; }

// Render country card
function renderCountryCard(c){
  const div = document.createElement('div');
  div.className = 'country-card';
  div.innerHTML = `
    <img class="flag-small" src="${c.flag}" alt="flag">
    <div class="country-meta">
      <h3>${c.name} <small class="muted">(${c.cca2 || ''})</small></h3>
      <p class="small muted">Capital: ${c.capital} • Region: ${c.region} • Pop: ${c.population}</p>
      <p class="small">${c.languages}</p>
      <div style="margin-top:8px">
        <button class="btn small" data-action="add">Add to itinerary</button>
        <button class="btn secondary small" data-action="details">Details</button>
      </div>
    </div>
  `;
  div.querySelector('[data-action="add"]').addEventListener('click', () => {
    mgr.add({
      id: Date.now(),
      name: c.name,
      capital: c.capital,
      region: c.region,
      population: c.population,
      flag: c.flag,
      maps: c.maps,
      notes: '',
      visited: false,
      addedAt: new Date().toISOString()
    });
    renderItinerary();
  });
  div.querySelector('[data-action="details"]').addEventListener('click', () => {
    showDetailsModal(c.fullRaw);
  });
  return div;
}

// Render search results
function showResults(list){
  results.innerHTML = '';
  if(!list.length){
    results.innerHTML='<div class="card small muted">No matches</div>';
    return;
  }
  const grid = document.createElement('div');
  grid.className = 'results-grid';
  list.forEach(c => grid.appendChild(renderCountryCard(c)));
  results.appendChild(grid);
}

// Search
async function doSearch(q){
  setStatus('Searching...');
  try {
    const list = await service.search(q);
    showResults(list);
    setStatus(`Found ${list.length} result(s)`);
    populateHistory();
  } catch(err){
    setStatus('Error: '+err.message);
    results.innerHTML = `<div class="card small muted">Error: ${err.message}</div>`;
  }
}

// Itinerary render
function renderItinerary(){
  const arr = mgr.getAll();
  itList.innerHTML = arr.map(it => `
    <div class="card" style="margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <strong>${it.name}</strong> <div class="small muted">${it.region}</div>
          <div class="small" style="margin-top:6px">${it.notes || '<span class="muted">no notes</span>'}</div>
        </div>
        <div>
          <button class="btn small" data-id="${it.id}" data-act="toggle">${it.visited?'Unvisit':'Visited'}</button>
          <button class="btn secondary small" data-id="${it.id}" data-act="edit">Edit</button>
          <button class="btn small" data-id="${it.id}" data-act="del">Delete</button>
        </div>
      </div>
    </div>
  `).join('');

  itList.querySelectorAll('button[data-act]').forEach(b=>{
    const id = Number(b.dataset.id);
    const act = b.dataset.act;
    if(act==='toggle'){
      b.addEventListener('click', ()=>{
        mgr.toggleVisited(id); renderItinerary();
      });
    } else if(act==='del'){
      b.addEventListener('click', ()=>{
        currentDeleteId=id;
        deleteModal.style.display='flex';
      });
    } else if(act==='edit'){
      b.addEventListener('click', ()=>{
        currentEditId=id;
        editTextarea.value = mgr.find(id)?.notes || '';
        editModal.style.display='flex';
        editTextarea.focus();
      });
    }
  });
}

// Details modal
document.getElementById('close-detail').addEventListener('click', ()=>detailModal.style.display='none');
function showDetailsModal(raw){
  detailContent.innerHTML = `
    <h2>${raw.name.common}</h2>
    <img src="${raw.flags.svg||raw.flags.png}" style="max-width:200px"/>
    <table style="margin-top:10px; border-collapse:collapse;">
      <tr><td><strong>Capital</strong></td><td>${raw.capital?.join(', ')||''}</td></tr>
      <tr><td><strong>Currencies</strong></td><td>${Object.values(raw.currencies||{}).map(c=>c.name+' ('+c.symbol+')').join(', ')}</td></tr>
      <tr><td><strong>Subregion</strong></td><td>${raw.subregion||''}</td></tr>
      <tr><td><strong>Timezones</strong></td><td>${raw.timezones?.join(', ')||''}</td></tr>
    </table>
  `;
  detailModal.style.display='flex';
}

// Search history
function populateHistory(){
  const hist = service.getSearchHistory();
  historySelect.innerHTML = '<option value="">recent searches</option>'+hist.map(h=>`<option>${h}</option>`).join('');
}

// Event listeners
historySelect.addEventListener('change', ()=>{ 
  if(historySelect.value){
    qInput.value = historySelect.value;
    doSearch(historySelect.value);
  }
});
searchBtn.addEventListener('click', ()=>{ const q=qInput.value.trim(); if(!q) return; doSearch(q); });
qInput.addEventListener('keyup', e=>{ if(e.key==='Enter') searchBtn.click(); });

btnClearCache.addEventListener('click', ()=>{
  service.clearCache();
  localStorage.removeItem('we_history_v1'); // clear search history too
  setStatus('Cache and search history cleared');
  populateHistory();
});

manualAdd.addEventListener('click', ()=>{
  const name = manualName.value.trim();
  if(!name) return alert('Enter country name');
  mgr.add({id:Date.now(),name,notes:'',visited:false,addedAt:new Date().toISOString(),region:'manual',capital:'',population:''});
  manualName.value='';
  renderItinerary();
});

// Edit modal
editSaveBtn.addEventListener('click', ()=>{
  if(currentEditId!==null){
    mgr.updateNotes(currentEditId, editTextarea.value);
    renderItinerary();
    editModal.style.display='none';
  }
});
editCancelBtn.addEventListener('click', ()=>editModal.style.display='none');

// Delete modal
deleteConfirmBtn.addEventListener('click', ()=>{
  if(currentDeleteId!==null){
    mgr.remove(currentDeleteId);
    renderItinerary();
    deleteModal.style.display='none';
  }
});
deleteCancelBtn.addEventListener('click', ()=>deleteModal.style.display='none');

// Handle export
if(window.electronAPI){
  window.electronAPI.onRequestExport(()=>{
    const jsonStr=JSON.stringify(mgr.getAll(),null,2);
    window.electronAPI.sendExportReply(jsonStr);
  });
}

// Initial render
populateHistory();
renderItinerary();
setStatus('Ready');
