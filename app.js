'use strict';
const $=id=>document.getElementById(id), data={got:[],factory:[]},overrides={};
const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
function load(text,kind,label){try{const parsed=Analyzer.read(text,kind);data[kind]=parsed;$(kind+'name').textContent=label+' ('+parsed.length+'行)';$('message').textContent='読み込みました。';if(kind==='factory')reasons();render();}catch(e){$('message').textContent='読込失敗: '+e.message+'。前回のデータを保持しています。';}}
for(const kind of ['got','factory'])$(kind).addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{const bytes=await file.arrayBuffer();let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{text=new TextDecoder('shift_jis',{fatal:true}).decode(bytes);}load(text,kind,file.name);}catch(e){$('message').textContent='ファイルを読めません: '+e.message;}});
$('pasteLoad').onclick=()=>load($('paste').value,'factory','貼り付け');
function reasons(){
 const values=new Set();
 for(const r of data.factory)if(!r.error)for(const k of ['屑1','屑2','保留1','保留2']){
  const value=Analyzer.reasonKey(r[k.replace(/([12])$/,'理由$1')]);
  if(r[k]>0 || (value && !/^0+(?::.*)?$/.test(value)))values.add(value);
 }
 $('reasons').replaceChildren();
 for(const value of [...values].sort()){
  const type=Analyzer.classify(value,overrides),label=el('label'),box=el('input');box.type='checkbox';box.checked=type==='include';
  const caption=el('span',(value||'理由空欄')+(type==='unknown'?'（要確認）':''));
  box.onchange=()=>{overrides[value]=box.checked?'include':'exclude';caption.textContent=value||'理由空欄';render();};
  label.append(box,caption);$('reasons').append(label);
 }
}
let tableSort={key:'f',direction:-1};
function ordered(rows,key,direction){return [...rows].sort((a,b)=>{const x=a[key],y=b[key];if(x==null||y==null)return x==null?(y==null?a.id.localeCompare(b.id):1):-1;return (typeof x==='number'?x-y:String(x).localeCompare(String(y),'ja',{numeric:true}))*direction||a.id.localeCompare(b.id);});}
function render(){const result=Analyzer.compare(data.got,data.factory,overrides),rows=result.rows.filter(r=>r.id.includes($('search').value.trim())&&(!$('issues').checked||r.status!=='比較可')&&(!$('excludeUncertain').checked||(r.g!==null&&r.f!==null)));$('summary').textContent=`全 ${result.rows.length} 製番 / 比較可 ${result.rows.filter(r=>r.status==='比較可').length} / 集計対象 ${rows.length} / 不正行 ${result.errors.length}`;$('summary').textContent += ' / 対象のGOT合計 '+rows.reduce((n,r)=>n+(r.g??0),0)+'本 / 工場合計 '+rows.reduce((n,r)=>n+(r.f??0),0)+'本（未確定値は合計に含めません）';$('errors').textContent=result.errors.map(r=>`${r.kind==='got'?'GOT':'工場'} データ行${r.sourceRow}: ${r.error}`).join('\n')||'なし';$('body').replaceChildren();$('chart').replaceChildren();const max=Math.max(1,...rows.flatMap(r=>[r.g||0,r.f||0]));for(const r of ordered(rows,tableSort.key,tableSort.direction)){const tr=el('tr');for(const value of [r.id,r.g,r.f,r.status.startsWith('重複')?null:r.f===null?null:r.scrap,r.status.startsWith('重複')?null:r.f===null?null:r.hold,r.diff,r.status+(r.unknown.length?' / '+r.unknown.join(', '):'')])tr.append(el('td',value===null?'—':String(value)));$('body').append(tr);}for(const r of ordered(rows,'f',-1)){const group=el('div');group.className='bars';group.append(el('span',r.id));const pair=el('div');for(const [v,color]of [[r.f,'orange'],[r.g,'']]){const track=el('div');track.className='track';const bar=el('span');bar.className='bar '+color;bar.style.width=(v===null?0:v/max*80)+'%';track.append(bar,el('span',v===null?'未確定':v+' 本'));pair.append(track);}group.append(pair);$('chart').append(group);}}
const sortKeys=['id','g','f','scrap','hold','diff','status'];
document.querySelectorAll('thead th').forEach((th,i)=>{
 const title=th.textContent,button=el('button',title+' ↕');button.type='button';button.dataset.title=title;
 button.onclick=()=>{
  tableSort={key:sortKeys[i],direction:tableSort.key===sortKeys[i]?-tableSort.direction:1};
  document.querySelectorAll('thead th').forEach(cell=>cell.removeAttribute('aria-sort'));
  th.setAttribute('aria-sort',tableSort.direction===1?'ascending':'descending');
  document.querySelectorAll('thead button').forEach(b=>b.textContent=b.dataset.title+' ↕');
  button.textContent=title+(tableSort.direction===1?' ▲':' ▼');render();
 };
 th.replaceChildren(button);
 if(i===2){th.setAttribute('aria-sort','descending');button.textContent=title+' ▼';}
});
function updateDensity(){
 const value=$('density').value;
 $('chart').style.setProperty('--track-height',value+'px');
 $('density').setAttribute('aria-valuetext',value+' px');
 $('densityValue').textContent=value+' px';
}
$('density').addEventListener('input',updateDensity);
$('density').addEventListener('change',updateDensity);
updateDensity();
$('search').oninput=render;$('issues').onchange=render;$('excludeUncertain').onchange=render;render();
