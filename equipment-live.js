/* Alpha 0.34 equipment live-refresh patch */
(function(){
  if(typeof renderInventory!=='function'||typeof receiveItem!=='function')return;

  const baseRenderInventory=renderInventory;
  renderInventory=function(){
    let html=baseRenderInventory();
    html=html.replace('<div class="grid2"><div class="card"><h3>评分偏好</h3>','<div class="inventory-page"><div class="grid2"><div class="card"><h3>评分偏好</h3>');
    html=html.replace('<p>背包 '+state.inventory.length+'/'+state.inventoryCapacity+'</p>','<p>背包 <span id="inventory-count">'+state.inventory.length+'/'+state.inventoryCapacity+'</span></p>');
    html=html.replace('<div class="card" style="margin-top:10px"><h3>背包</h3>','<div class="card inventory-backpack" id="inventory-backpack" style="margin-top:7px"><h3>背包</h3>');
    return html+'</div>';
  };

  function refreshInventoryBackpackLive(){
    if(!state||state.tab!=='inventory')return;
    const current=document.getElementById('inventory-backpack');
    if(!current)return;

    const scrollY=window.scrollY;
    const open=[...current.querySelectorAll('details')].map((d,i)=>d.open?i:-1).filter(i=>i>=0);
    const tmp=document.createElement('div');
    tmp.innerHTML=renderInventory();
    const next=tmp.querySelector('#inventory-backpack');
    if(!next)return;

    current.replaceWith(next);
    const nextDetails=[...next.querySelectorAll('details')];
    open.forEach(i=>{if(nextDetails[i])nextDetails[i].open=true;});

    const count=document.getElementById('inventory-count');
    if(count)count.textContent=state.inventory.length+'/'+state.inventoryCapacity;
    window.scrollTo(0,scrollY);
  }

  const baseReceiveItem=receiveItem;
  receiveItem=function(it){
    const before=(state.inventory||[]).map(x=>x.id).join('|');
    const result=baseReceiveItem(it);
    const after=(state.inventory||[]).map(x=>x.id).join('|');
    if(before!==after){
      requestAnimationFrame(refreshInventoryBackpackLive);
    }
    return result;
  };

  window.refreshInventoryBackpackLive=refreshInventoryBackpackLive;
})();
