(() => {
  const STORAGE_KEY = 'contacts:v1'
  let contacts = []
  let editId = null

  const el = id => document.getElementById(id)
  const tbody = () => document.querySelector('#contactsTable tbody')

  function load() {
    try { contacts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch(e){ contacts = [] }
  }

  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts)) }

  function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8) }

  function render(filter=''){
    const table = el('contactsTable')
    const empty = el('empty')
    const rows = contacts.filter(c => {
      if(!filter) return true
      const s = filter.toLowerCase()
      return (c.name + ' ' + c.phone + ' ' + c.email).toLowerCase().includes(s)
    })
    const body = tbody(); body.innerHTML = ''
    if(rows.length === 0){ table.hidden = true; empty.hidden = false; return }
    table.hidden = false; empty.hidden = true
    for(const c of rows){
      const tr = document.createElement('tr')
      tr.innerHTML = `<td>${escapeHTML(c.name)}</td><td>${escapeHTML(c.phone)}</td><td>${escapeHTML(c.email)}</td>
        <td>
          <button class="action-btn" data-edit="${c.id}">Edit</button>
          <button class="action-btn" data-del="${c.id}">Delete</button>
        </td>`
      body.appendChild(tr)
    }
  }

  function escapeHTML(s){ return String(s).replace(/[&<>"']/g, ch=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;" })[ch]) }

  function addContact(name, phone, email){
    contacts.unshift({ id:uid(), name, phone, email, created: Date.now() })
    save(); render(el('search').value)
  }

  function updateContact(id, name, phone, email){
    const idx = contacts.findIndex(c=>c.id===id)
    if(idx>=0){ contacts[idx].name=name; contacts[idx].phone=phone; contacts[idx].email=email; save(); render(el('search').value) }
  }

  function removeContact(id){
    contacts = contacts.filter(c=>c.id!==id); save(); render(el('search').value)
  }

  function bind(){
    const form = el('contactForm')
    form.addEventListener('submit', e=>{
      e.preventDefault()
      const name = el('name').value.trim()
      const phone = el('phone').value.trim()
      const email = el('email').value.trim()
      if(!name||!phone||!email) return alert('Please fill all fields')
      if(editId){ updateContact(editId, name, phone, email); editId=null; el('saveBtn').textContent='Save Contact' }
      else addContact(name, phone, email)
      form.reset()
    })

    el('clearBtn').addEventListener('click', ()=>{ form.reset(); editId=null; el('saveBtn').textContent='Save Contact' })

    el('search').addEventListener('input', e=> render(e.target.value))

    el('contactsTable').addEventListener('click', e=>{
      if(e.target.matches('[data-edit]')){
        const id = e.target.getAttribute('data-edit')
        const c = contacts.find(x=>x.id===id); if(!c) return
        el('name').value = c.name; el('phone').value = c.phone; el('email').value = c.email
        editId = id; el('saveBtn').textContent = 'Update Contact'
        window.scrollTo({top:0,behavior:'smooth'})
      }
      if(e.target.matches('[data-del]')){
        const id = e.target.getAttribute('data-del')
        if(confirm('Delete this contact?')) removeContact(id)
      }
    })

    el('clearAll').addEventListener('click', ()=>{
      if(confirm('Clear all contacts? This cannot be undone.')){ contacts=[]; save(); render() }
    })

    el('export').addEventListener('click', ()=>{
      const data = JSON.stringify(contacts, null, 2)
      const blob = new Blob([data], {type:'application/json'})
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href=url; a.download='contacts.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
    })

    el('import').addEventListener('click', ()=> el('importFile').click())
    el('importFile').addEventListener('change', async (ev)=>{
      const f = ev.target.files && ev.target.files[0]; if(!f) return
      try{
        const text = await f.text(); const imported = JSON.parse(text)
        if(!Array.isArray(imported)) throw new Error('Invalid format')
        // merge, avoid duplicate ids
        const existingIds = new Set(contacts.map(c=>c.id))
        for(const c of imported){ if(!c.id) c.id = uid(); if(!existingIds.has(c.id)) contacts.push(c) }
        save(); render(); alert('Import complete')
      }catch(err){ alert('Failed to import: ' + err.message) }
      ev.target.value = ''
    })
  }

  // init
  load(); document.addEventListener('DOMContentLoaded', ()=>{ bind(); render() })

})()
