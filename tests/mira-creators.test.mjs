import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {selectedCandidates,readSelections,mergeCandidates,candidateInstruction} from '../dist/mira-templates/creator-store.js';
const base=new URL('../dist/mira-templates/',import.meta.url);
const catalog=JSON.parse(readFileSync(new URL('creators.json',base)));
test('100 distinct creators have source videos and saved real covers',()=>{
 assert.equal(catalog.length,100);assert.equal(new Set(catalog.map(c=>c.creator)).size,100);
 assert.equal(new Set(catalog.map(c=>c.url)).size,100);
 for(const c of catalog){assert.match(c.url,/^https:\/\/www\.douyin\.com\/video\/\d{19}$/);assert.match(c.poster,/^assets\/creators\/\d{19}\.jpg$/);assert(existsSync(new URL(c.poster,base)));assert(readFileSync(new URL(c.poster,base)).length>1000);assert(c.verification.includes('待拆解'));}
});
test('only selected catalog entries become candidates; stored URLs cannot replace trusted sources',()=>{
 const [a,b]=catalog;const selections={[a.id]:{status:'selected',instruction:'保留换装动作',url:'javascript:bad'},[b.id]:{status:'deferred'},fake:{status:'selected'}};
 const rows=selectedCandidates(catalog,selections);assert.equal(rows.length,1);assert.equal(rows[0].url,a.url);assert.equal(rows[0].instruction,'保留换装动作');assert.equal(rows[0].reviewed,false);
 assert.equal(selectedCandidates(catalog,selections,[a]).length,0);
});
test('corrupt or unavailable browser storage does not break candidate loading',()=>{
 assert.deepEqual(readSelections({getItem:()=>'{bad'}),{});assert.deepEqual(readSelections({getItem:()=>{throw Error('unavailable')}}),{});assert.deepEqual(readSelections({getItem:()=> '[]'}),{});
});

test('duplicate existing candidate keeps its ID and newest operator instruction',()=>{
 const c=catalog[0], old={...c,id:'existing',instruction:'old'};
 const choices={[c.id]:{status:'selected',instruction:'new',updatedAt:'2026-10-09T10:00:00Z'}};
 const merged=mergeCandidates(catalog,choices,[old]);
 assert.equal(merged.length,1);assert.equal(merged[0].id,'existing');
 assert.equal(candidateInstruction(merged[0],{instruction:'earlier',updatedAt:'2026-10-08T10:00:00Z'}),'new');
 assert.equal(candidateInstruction(merged[0],{instruction:'later',updatedAt:'2026-10-10T10:00:00Z'}),'later');
});
