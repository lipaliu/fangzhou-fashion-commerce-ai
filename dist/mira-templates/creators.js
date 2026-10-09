import { createSourcePlayer } from './source-player.js';
import { canManage } from './candidates.js';
import { readSelections, CREATOR_SELECTION_KEY } from './creator-store.js';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let catalog=[], selections=readSelections(), group='all', page=1, active=null, timer;
const pageSize=18;
const allowed=()=>canManage($('#role').value);
const player=createSourcePlayer({canOpen:allowed,onSelect:open});
const status=c=>selections[c.id]?.status||'pending';
const labels={pending:'待筛选',selected:'已选为候选',deferred:'暂不考虑'};
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(timer);timer=setTimeout(()=>$('#toast').classList.remove('show'),3000);}
function filtered(){const q=$('#creator-search').value.trim().toLowerCase(),s=$('#creator-status').value,m=$('#mechanism').value;return catalog.filter(c=>(group==='all'||c.group===group||(group==='ai'&&c.aiEvidence.startsWith('作者文案')))&&(s==='all'||status(c)===s)&&(m==='all'||c.title===m)&&`${c.creator} ${c.title} ${c.sourceTitle}`.toLowerCase().includes(q));}
function render(){
 const permit=allowed();$('#access-denied').hidden=permit;$('#creator-workspace').hidden=!permit;$('#export-catalog').hidden=!permit;if(!permit)return;
 $('#selection-stat').textContent=catalog.filter(c=>status(c)==='selected').length;
 const rows=filtered(),pages=Math.max(1,Math.ceil(rows.length/pageSize));page=Math.min(page,pages);
 $('#creator-count').textContent=`${rows.length} 个账号 · 第 ${page} / ${pages} 页`;$('#creator-empty').hidden=rows.length>0;
 $('#creator-grid').innerHTML=rows.slice((page-1)*pageSize,page*pageSize).map(c=>`<article class="creator-card"><button type="button" class="creator-cover" data-play="${c.id}" aria-label="播放${esc(c.creator)}的代表作"><img loading="lazy" src="${esc(c.poster)}" alt="${esc(c.creator)}代表作封面"><span class="creator-number">${String(c.rank).padStart(3,'0')}</span><span class="play">▶ 播放原片</span></button><div class="creator-body"><div class="creator-metrics"><span>抖音 · ${esc(c.duration)}</span><span class="creator-state">${labels[status(c)]}</span></div><h2>${esc(c.creator)}</h2><div class="creator-tags"><span>${esc(c.title)}</span><span>${c.group==='transition'?'开场玩法参考':'后段展示参考'}</span></div><p class="creator-caption">${esc(c.sourceTitle)}</p><div class="creator-metrics"><span>作品点赞 ${esc(c.likesText||'未记录')}</span><span>来源 ${esc(c.sourceDate||'未记录')}</span></div><button class="primary" data-review="${c.id}">${status(c)==='selected'?'修改拆解要求':'选为玩法候选 →'}</button></div></article>`).join('');
 $('#creator-grid').querySelectorAll('[data-play]').forEach(b=>b.onclick=()=>player.open(catalog.find(c=>c.id===b.dataset.play)));
 $('#creator-grid').querySelectorAll('[data-review]').forEach(b=>b.onclick=()=>open(b.dataset.review));
 $('#pagination').innerHTML=rows.length?Array.from({length:pages},(_,i)=>`<button data-page="${i+1}" class="${page===i+1?'active':''}" aria-label="第 ${i+1} 页" ${page===i+1?'aria-current="page"':''}>${i+1}</button>`).join(''):'';
 $('#pagination').querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{page=Number(b.dataset.page);render();$('#group-filters').scrollIntoView({block:'start'});});
}
function open(id){if(!allowed())return;active=catalog.find(c=>c.id===id);if(!active)return;$('#detail-title').textContent=`${active.creator} · ${active.title}`;$('#detail-source').href=active.url;$('#detail-caption').textContent=active.sourceTitle;$('#detail-evidence').textContent=`${active.verification}。${active.aiEvidence}。点赞数为 2026-10-09 检索快照。`;$('#creator-instruction').value=selections[id]?.instruction||'';$('#defer-creator').textContent=status(active)==='deferred'?'恢复待筛选':'暂不考虑';$('#creator-dialog').showModal();}
function save(next){if(!allowed()||!active)return;const update={...readSelections(),[active.id]:{status:next,instruction:$('#creator-instruction').value.trim(),updatedAt:new Date().toISOString()}};try{localStorage.setItem(CREATOR_SELECTION_KEY,JSON.stringify(update));selections=update;}catch{toast('保存失败，请检查浏览器存储空间。');return;}$('#creator-dialog').close();render();toast(next==='selected'?'已加入玩法候选库，尚未调用模型。':'筛选状态已保存。');}
$('#save-creator').onclick=()=>save('selected');$('#defer-creator').onclick=()=>save(status(active)==='deferred'?'pending':'deferred');$('#close-creator').onclick=()=>$('#creator-dialog').close();
$('#role').onchange=()=>{player.close();$('#creator-dialog').close();active=null;render();};
for(const id of ['creator-search','creator-status','mechanism'])$('#'+id)[id==='creator-search'?'oninput':'onchange']=()=>{page=1;render();};
document.querySelectorAll('[data-group]').forEach(b=>b.onclick=()=>{group=b.dataset.group;page=1;document.querySelectorAll('[data-group]').forEach(x=>x.classList.toggle('active',x===b));render();});
$('#export-catalog').onclick=()=>{if(!allowed()||!catalog.length)return;const cell=s=>{let value=String(s??'');if(/^[=+\-@]/.test(value))value="'"+value;return '"'+value.replaceAll('"','""')+'"';};const rows=[['序号','账号','参考类别','玩法线索','代表作品','作者主页（已核验）','作品标题','检索时点赞','核验说明','我的筛选','拆解要求'],...catalog.map(c=>[c.rank,c.creator,c.group==='transition'?'转场':'展示',c.title,c.url,c.profileUrl,c.sourceTitle,c.likesText,c.verification,labels[status(c)],selections[c.id]?.instruction])];const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+rows.map(r=>r.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));a.download='mira-100-douyin-creators-20261009.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
window.addEventListener('storage',e=>{if(e.key===CREATOR_SELECTION_KEY){selections=readSelections();render();}});
try{const response=await fetch('./creators.json');if(!response.ok)throw new Error('catalog');catalog=await response.json();$('#total-stat').textContent=catalog.length;$('#transition-stat').textContent=catalog.filter(c=>c.group==='transition').length;$('#presentation-stat').textContent=catalog.filter(c=>c.group==='presentation').length;const titles=[...new Set(catalog.map(c=>c.title))];$('#mechanism').insertAdjacentHTML('beforeend',titles.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join(''));render();}catch{$('#creator-count').textContent='名单加载失败，请刷新重试。';}
