const vm=require('vm');
module.exports=async(req,res)=>{
 try{
  const host=req.headers.host;
  const files=Array.from({length:16},(_,i)=>`core-${String(i).padStart(2,'0')}.js`);
  const chunks=[];
  for(const f of files){
   const r=await fetch(`https://${host}/${f}`,{cache:'no-store'});
   if(!r.ok)throw new Error(`${f} HTTP ${r.status}`);
   chunks.push(await r.text());
  }
  const code=chunks.join('\n');
  new vm.Script(code,{filename:'alpha-034-all.js'});
  const required=['const SLOT_NAMES=','const WEAPON_TYPES=','const PET_TIER_GROWTH_STEP=','const PET_TIER_INSTINCTS=','const RACES=','const STYLES=','function tryDropIdentity(','function registerPassiveBattleWin(','function renderLogControls(','function battleTick(','function renderCharacter('];
  const missing=required.filter(x=>!code.includes(x));
  res.status(missing.length?500:200).json({ok:missing.length===0,version:'0.34.0',files:chunks.length,bytes:code.length,missing});
 }catch(e){res.status(500).json({ok:false,error:e.message,stack:String(e.stack||'').split('\n').slice(0,4)});}
};
