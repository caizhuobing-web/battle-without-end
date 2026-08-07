const fs=require('fs');
const path=require('path');
const vm=require('vm');
const read=f=>fs.readFileSync(path.resolve(__dirname,'..',f),'utf8');
module.exports=(req,res)=>{
 try{
  const chunks=[
   read('core-00.js'),read('core-01.js'),read('core-02.js'),read('core-03.js'),
   read('core-04.js'),read('core-05.js'),read('core-06.js'),read('core-07.js'),
   read('core-08.js'),read('core-09.js'),read('core-10.js'),read('core-11.js'),
   read('core-12.js'),read('core-13.js'),read('core-14.js'),read('core-15.js')
  ];
  const code=chunks.join('\n');
  new vm.Script(code,{filename:'alpha-034-all.js'});
  const required=['const SLOT_NAMES=','const WEAPON_TYPES=','const PET_TIER_GROWTH_STEP=','const PET_TIER_INSTINCTS=','const RACES=','const STYLES=','function tryDropIdentity(','function registerPassiveBattleWin(','function renderLogControls(','function battleTick(','function renderCharacter('];
  const missing=required.filter(x=>!code.includes(x));
  res.status(missing.length?500:200).json({ok:missing.length===0,version:'0.34.0',files:chunks.length,bytes:code.length,missing});
 }catch(e){res.status(500).json({ok:false,error:e.message,stack:String(e.stack||'').split('\n').slice(0,4)});}
};
