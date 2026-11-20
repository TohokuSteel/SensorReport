const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
class Element {
 constructor(){this.children=[];this.textContent='';this.value='';this.dataset={};this.events={};this.attributes={};this.style={setProperty:(k,v)=>this.style[k]=v};}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this.children=nodes;}
 addEventListener(name,handler){this.events[name]=handler;}
 setAttribute(k,v){this.attributes[k]=v;}
 removeAttribute(k){delete this.attributes[k];}
}
test('行間イベントと表のソートを操作し、グラフ順序は維持する',()=>{
 const nodes={};const heads=Array.from({length:7},()=>new Element());
 const document={getElementById:id=>nodes[id]??=(new Element()),createElement:()=>new Element(),querySelectorAll:s=>s==='thead th'?heads:heads.flatMap(h=>h.children)};
 document.getElementById('density').value='12';
 const rows=[{id:'A',g:1,f:2,scrap:2,hold:0,status:'比較可',unknown:[],diff:-1},{id:'B',g:3,f:8,scrap:8,hold:0,status:'比較可',unknown:[],diff:-5}];
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../app.js'),'utf8'),{document,Analyzer:{compare:()=>({rows,errors:[]})}});
 assert.equal(nodes.chart.style['--track-height'],'12px');
 nodes.density.value='24';nodes.density.events.input();
 assert.equal(nodes.chart.style['--track-height'],'24px');assert.equal(nodes.densityValue.textContent,'24 px');
 assert.equal(nodes.chart.children[0].children[0].textContent,'B');
 heads[0].children[0].onclick();
 assert.equal(nodes.body.children[0].children[0].textContent,'A');
 assert.equal(nodes.chart.children[0].children[0].textContent,'B');
 heads[0].children[0].onclick();
 assert.equal(nodes.body.children[0].children[0].textContent,'B');
 nodes.density.value='10';nodes.density.events.change();
 assert.equal(nodes.chart.style['--track-height'],'10px');
 rows.push({id:'C',g:null,f:9,scrap:9,hold:0,status:'GOT未照合',unknown:[],diff:null});
 nodes.excludeUncertain.onchange();
 assert.equal(nodes.chart.children.length,3);
 nodes.excludeUncertain.checked=true;nodes.excludeUncertain.onchange();
 assert.equal(nodes.chart.children.length,2);
 assert.equal(nodes.body.children.length,2);
 assert.match(nodes.summary.textContent,/工場合計 10本/);
 nodes.excludeUncertain.checked=false;nodes.excludeUncertain.onchange();
 assert.equal(nodes.chart.children.length,3);
});
