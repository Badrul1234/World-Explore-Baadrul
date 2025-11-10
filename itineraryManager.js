// renderer/itineraryManager.js
export default class ItineraryManager {
  constructor(){
    this.key = 'we_itineraries_v2';
  }

  getAll(){
    try { return JSON.parse(localStorage.getItem(this.key) || '[]'); }
    catch(e){ return []; }
  }

  save(arr){ localStorage.setItem(this.key, JSON.stringify(arr)); }

  add(item){
    const arr = this.getAll();
    const updated = [...arr, item];
    this.save(updated);
  }

  remove(id){
    const arr = this.getAll().filter(x => x.id !== id);
    this.save(arr);
  }

  toggleVisited(id){
    const arr = this.getAll();
    const updated = arr.map(x => x.id === id ? { ...x, visited: !x.visited } : x);
    this.save(updated);
  }

  updateNotes(id, text){
    const arr = this.getAll();
    const updated = arr.map(x => x.id === id ? { ...x, notes: text } : x);
    this.save(updated);
  }

  find(id){ return this.getAll().find(x => x.id === id); }
}
