const {chromium}=require(process.env.VOCAB_PLAYWRIGHT_MODULE||'@playwright/test');
const assert=require('node:assert/strict');
const base=process.env.VOCAB_BASE_URL||'http://127.0.0.1:8765';
(async()=>{
 const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1280,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 async function quit(){await page.locator('#quit').click();await page.locator('#confirm-quit').click();}
 for(const grade of [7,10,11]){
  await page.goto(`${base}/${grade}/`);assert.equal(await page.locator('#mode').inputValue(),'mix');assert.equal(await page.locator('#direction').inputValue(),'mixed');
  assert.equal(await page.locator('#rounds').inputValue(),'custom');assert.equal(await page.locator('#custom-rounds').inputValue(),'5');assert.equal(await page.locator('#custom-rounds').isVisible(),true);
  assert.equal(await page.evaluate(()=>selectedWords().length===VOCAB.length),true);
  assert.deepEqual(await page.locator('#rounds option').evaluateAll(options=>options.map(o=>o.value)),['3','5','10','custom']);
  await page.getByRole('button',{name:'Solo',exact:true}).click();await page.locator('#rounds').selectOption('custom');await page.locator('#custom-rounds').fill('7');
  assert.match(await page.locator('#game-summary').textContent(),/7 challenges/);await page.locator('#seconds').selectOption('0');await page.getByRole('button',{name:'Start match'}).click();assert.equal(await page.evaluate(()=>game.deck.length),7);await quit();
  // Custom selection and entered count survive changing the player count.
  assert.equal(await page.locator('#rounds').inputValue(),'custom');assert.equal(await page.locator('#custom-rounds').inputValue(),'7');await page.locator('[data-count="3"]').click();assert.equal(await page.locator('#custom-rounds').inputValue(),'7');
  await page.getByRole('button',{name:'Start match'}).click();assert.equal(await page.evaluate(()=>game.deck.length),21);await quit();
  for(const value of ['','0','2.5','1001']){await page.locator('#custom-rounds').fill(value);await page.getByRole('button',{name:'Start match'}).click();assert.equal(await page.locator('#setup-form').count(),1);assert.equal(await page.locator('#custom-rounds').evaluate(el=>el.validity.valid),false);}
  await page.locator('#custom-rounds').fill('1');await page.getByRole('button',{name:'Start match'}).click();assert.equal(await page.evaluate(()=>game.deck.length),3);assert.equal(await page.evaluate(()=>setup.rounds),1);await quit();
  for(const n of ['3','5','10']){await page.locator('#rounds').selectOption(n);await page.getByRole('button',{name:'Start match'}).click();assert.equal(await page.evaluate(()=>game.deck.length),Number(n)*3);await quit();}
  await page.locator('#rounds').selectOption('custom');await page.locator('#custom-rounds').fill('1000');await page.setViewportSize({width:320,height:950});await page.getByRole('button',{name:'Start match'}).click();assert.equal(await page.evaluate(()=>game.deck.length),3000);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await quit();
  await page.setViewportSize({width:1280,height:1000});
 }
 await page.goto(`${base}/11/`);
 const contract=await page.evaluate(()=>({count:VOCAB.length,ids:new Set(VOCAB.map(w=>w.id)).size,heads:new Set(VOCAB.map(w=>w.en.toLowerCase())).size,sourceRows:VOCAB.reduce((n,w)=>n+w.sources.length,0),files:new Set(VOCAB.flatMap(w=>w.sources.map(s=>s.file))).size,complete:VOCAB.every(w=>w.en&&w.de&&w.groups.length&&w.enAliases.length&&w.aliases.length),scrambles:VOCAB.every(w=>['en','de'].every(lang=>puzzleAnswer(w,lang).length>0))}));
 assert.deepEqual(contract,{count:1113,ids:1113,heads:1113,sourceRows:1354,files:65,complete:true,scrambles:true});
 // Every topic keeps repeated headwords, while all-topics selections count each once.
 for(const id of ['t1','t2','t3','t4','t5'])assert.equal(await page.evaluate(id=>{setup.topics=[id];return selectedWords().length===VOCAB.filter(w=>w.groups.includes(id)).length},id),true);
 await page.reload();await page.screenshot({path:'/tmp/grade11-setup.png',fullPage:true});
 await page.getByRole('button',{name:'Solo',exact:true}).click();await page.locator('#seconds').selectOption('0');await page.getByRole('button',{name:'Start match'}).click();await page.locator('#begin-question').click();
 async function answer(){const c=await page.evaluate(()=>({mode:game.current.mode,truth:game.current.truth,index:game.current.choices.findIndex(c=>c.correct),answer:game.current.puzzle||answerVariants(game.current.word,game.current.target)[0],ids:game.current.pairs?.map(w=>w.id)}));
  if(c.mode==='choice')await page.locator(`[data-answer="${c.index}"]`).click();else if(c.mode==='truth')await page.locator(`[data-truth="${c.truth}"]`).click();else if(c.mode==='pairs'){for(const id of c.ids){await page.locator(`[data-pair="${id}"][data-lang="en"]`).click();await page.locator(`[data-pair="${id}"][data-lang="de"]`).click();}}else{await page.locator('#typed-answer').fill(c.answer);await page.locator('#answer-form').press('Enter');}}
 const modes=[],directions=[];
 for(let i=0;i<5;i++){modes.push(await page.evaluate(()=>game.current.mode));directions.push(await page.evaluate(()=>game.current.target));await page.setViewportSize({width:375,height:950});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:`/tmp/grade11-${modes.at(-1)}.png`,fullPage:true});await answer();await page.locator('#next').click();}
 assert.equal(new Set(modes).size,5);assert.equal(new Set(directions).size,2);assert.equal(await page.evaluate(()=>game.teams[0].score),500);assert.equal(await page.locator('.celebration').count(),0);
 await page.screenshot({path:'/tmp/grade11-results.png',fullPage:true});
 await page.locator('#new-game').click();await page.locator('[data-count="2"]').click();await page.locator('#rounds').selectOption('custom');await page.locator('#custom-rounds').fill('7');await page.getByRole('button',{name:'Start match'}).click();let previous;
 for(let i=0;i<14;i++){await page.locator('#begin-question').click();const current=await page.evaluate(()=>({mode:game.current.mode,target:game.current.target}));if(i%2)assert.deepEqual(current,previous);previous=current;await answer();await page.locator('#next').click();}
 assert.deepEqual(await page.evaluate(()=>game.teams.map(t=>t.score)),[700,700]);assert.deepEqual(errors,[]);
 console.log('PASS: all three grades, exact custom counts, presets, validation, long-match mobile layout; all 65 files and 1,354 rows; deduplication, topic selection, all five modes, both directions, scores and team fairness.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
