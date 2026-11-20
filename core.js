(function(root) {
 'use strict';
 function parse(text) {
  const delimiter=text.split(/\r?\n/).find(x=>x.trim())?.includes('\t')?'\t':',';
  const rows=[]; let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++) { const c=text[i];
   if(c==='"') {if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
   else if(!quoted&&(c===delimiter||c==='\n'||c==='\r')) {row.push(cell.trim());cell='';if(c!==delimiter){if(row.some(Boolean))rows.push(row);row=[];if(c==='\r'&&text[i+1]==='\n')i++;}}
   else cell+=c;
  }
  if(quoted)throw Error('引用符が閉じていません');
  row.push(cell.trim());if(row.some(Boolean))rows.push(row);return rows;
 }
 function count(value) {if(!/^\d+$/.test(value??''))throw Error('本数が空欄または非負整数ではありません');const n=Number(value);if(!Number.isSafeInteger(n))throw Error('本数が大きすぎます');return n;}
 function read(text,kind) {
  const rows=parse(text.replace(/^\uFEFF/,''));let headers,body;
  if(kind==='got'){const index=rows.findIndex(r=>r[0]===':DEV_COMMENT');if(index<0)throw Error('GOTの :DEV_COMMENT がありません');headers=['記録日時',...rows[index].slice(1)];body=rows.filter(r=>!r[0].startsWith(':'));}
  else {headers=rows[0]||[];body=rows.slice(1);}
  const required=kind==='got'?['製番','NG判定数']:['製番','屑1','屑理由1','屑2','屑理由2','保留1','保留理由1','保留2','保留理由2'];
  for(const name of required)if(!headers.includes(name))throw Error('必要な列がありません: '+name);
  if(new Set(headers).size!==headers.length)throw Error('列名が重複しています');
  return body.map((values,i)=>{const item={sourceRow:i+1};headers.forEach((h,j)=>item[h]=values[j]??'');try{if(values.length!==headers.length)throw Error('列数が一致しません');if(!item['製番'])throw Error('製番が空です');for(const key of kind==='got'?['NG判定数']:['屑1','屑2','保留1','保留2'])item[key]=count(item[key]);}catch(e){item.error=e.message;}return item;});
 }
 function reasonKey(value){return value.replace(/\s/g,'').replace('：',':');}
 function classify(value,overrides={}) {const key=reasonKey(value);if(overrides[key])return overrides[key];const name=key.replace(/^\d+:/,'');if(['ヘゲ線','陥没','その他CM'].includes(name)||['101','102'].includes(key))return 'include';if(['寸大','寸小','曲り'].includes(name))return 'exclude';return 'unknown';}
 function compare(got,factory,overrides={}) {
  const map=new Map(),errors=[];
  for(const [kind,items] of [['got',got],['factory',factory]])for(const item of items){if(item.error){errors.push({kind,...item});continue;}const id=item['製番'];if(!map.has(id))map.set(id,{id,got:[],factory:[]});map.get(id)[kind].push(item);}
  return {errors,rows:[...map.values()].sort((a,b)=>a.id.localeCompare(b.id)).map(r=>{
   const duplicate=r.got.length>1||r.factory.length>1;let scrap=0,hold=0;const unknown=[];
   if(r.factory.length===1)for(const key of ['屑1','屑2','保留1','保留2']) {const item=r.factory[0],n=item[key],reason=item[key.replace(/([12])$/,'理由$1')],type=classify(reason,overrides);if(n&&type==='unknown')unknown.push((reason||'理由空欄')+': '+n+'本');if(type==='include'){if(key.startsWith('屑'))scrap+=n;else hold+=n;}}
   const g=r.got.length===1?r.got[0]['NG判定数']:null,f=r.factory.length===1?scrap+hold:null;
   const status=duplicate?'重複・要確認':!r.got.length?'GOT未照合':!r.factory.length?'工場未照合':unknown.length?'未分類あり':'比較可';
   return {id:r.id,g:duplicate?null:g,f:duplicate?null:f,scrap,hold,unknown,status,diff:status==='比較可'?g-f:null};
  })};
 }
 const api={parse,read,classify,compare,reasonKey};if(typeof module!=='undefined')module.exports=api;else root.Analyzer=api;
})(globalThis);
