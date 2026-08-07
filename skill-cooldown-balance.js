/* Alpha 0.34 skill cooldown rebalance: compact 1-4 turn cadence, hard design cap 5. */
(()=>{
 'use strict';
 if(typeof SKILLS==='undefined')return;
 const CD={
  warrior_slash:1,
  ranger_volley:1,
  mage_fireball:1,
  guard_wall:2,
  warlock_drain:2,
  hunter_pierce:2,
  hunter_execute:3,
  paladin_strike:1,
  paladin_heal:3,
  assassin_shadow:2,
  assassin_corrosion:2,
  element_burst:1,
  element_storm:3,
  saint_slash:2,
  saint_counter:3,
  chrono_fracture:2,
  chrono_rewind:3,
  star_fall:2,
  star_hunt:4,
  night_feast:3,
  night_mirror:4
 };
 Object.entries(CD).forEach(([id,cd])=>{
  if(SKILLS[id]?.type==='active')SKILLS[id].cooldown=Math.max(0,Math.min(5,cd));
 });
 // Drop cooldowns already queued under the previous balance table.
 if(typeof state!=='undefined'&&state?.started)state.skillReadyAt={};
 window.SKILL_COOLDOWN_BALANCE=Object.freeze({...CD});
})();
