const {chromium}=require(process.env.VOCAB_PLAYWRIGHT_MODULE||'@playwright/test');
const assert=require('node:assert/strict');
const base=process.env.VOCAB_BASE_URL||'http://127.0.0.1:8765';
(async()=>{
 const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:375,height:950}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 async function recall(correct=true){const answer=await page.evaluate(()=>{const c=cardSession.queue[0];return answerVariants(c.word,c.target)[0]});await page.locator('#card-answer').fill(correct?answer:'incorrect recall');await page.locator('#card-form').press('Enter');await page.locator('#next-card').click();}
 async function completePractice(){let n=0;while(await page.locator('#card-form').count()){assert(n++<20,'practice should finish');await recall();}}
 for(const grade of [7,10]){
  await page.goto(`${base}/${grade}/`);await page.evaluate(()=>localStorage.removeItem(`vocab-mistakes-${GRADE}`));await page.reload();
  assert.equal(await page.locator('#selection-count').textContent(),`${grade===7?959:100} words selected`);
  await page.getByRole('button',{name:'Solo',exact:true}).click();await page.locator('#mode').selectOption('choice');await page.locator('#rounds').selectOption('3');await page.locator('#seconds').selectOption('0');await page.getByRole('button',{name:'Start match'}).click();await page.locator('#begin-question').click();
  let missedId;
  for(let i=0;i<3;i++){const info=await page.evaluate(correct=>({index:game.current.choices.findIndex(c=>c.correct===correct),id:game.current.word.id}),i!==0);if(i===0)missedId=info.id;await page.locator(`[data-answer="${info.index}"]`).click();await page.locator('#next').click();}
  assert.match(await page.locator('main').textContent(),/Mistake mission/);assert.equal(await page.locator('.ranking').count(),0);assert.equal(await page.evaluate(()=>cardSession.queue.length),2);
  await page.locator('#card-flip').click();assert.equal(await page.locator('#card-form button').isDisabled(),true);assert.equal(await page.locator('#card-back').isVisible(),true);await page.locator('#card-flip').click();assert.equal(await page.locator('#card-back').isVisible(),false);
  await recall(false);assert.equal(await page.evaluate(()=>pendingMistakes.has(cardSession.queue[0].word.id)),true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:`/tmp/cards-grade${grade}.png`,fullPage:true});
  await page.locator('#cards-exit').click();await page.reload();assert.equal(await page.locator('#mistakes-start').count(),1);assert.equal(await page.evaluate(id=>pendingMistakes.has(id),missedId),true);
  await page.locator('#mistakes-start').click();assert.equal(await page.evaluate(()=>cardSession.total),2);await completePractice();assert.match(await page.locator('h1').textContent(),/Words mastered/);assert.equal(await page.evaluate(()=>pendingMistakes.size),0);await page.locator('#cards-done').click();await page.reload();assert.equal(await page.locator('#mistakes-start').count(),0);
  // Mandatory two recalls unlock the actual match results, with original XP intact.
  await page.evaluate(()=>{setup.count=1;setup.seconds=0;setup.rounds=3;setup.mode='choice';setup.direction='mixed';startGame([VOCAB[0]])});await page.locator('#begin-question').click();
  for(let i=0;i<3;i++){const index=await page.evaluate(correct=>game.current.choices.findIndex(c=>c.correct===correct),i!==0);await page.locator(`[data-answer="${index}"]`).click();await page.locator('#next').click();}
  assert.deepEqual(await page.evaluate(()=>cardSession.queue.map(c=>c.target).sort()),['de','en']);await recall();assert.equal(await page.locator('.ranking').count(),0);await recall();assert.equal(await page.locator('.ranking-row').count(),1);assert.equal(await page.evaluate(()=>game.teams[0].score),200);
  await page.getByRole('button',{name:'Change setup'}).click();await page.locator('#flashcards-start').click();assert.equal(await page.evaluate(()=>cardSession.total),grade===7?959:100);await page.locator('#cards-exit').click();
 }
 assert.deepEqual(errors,[]);console.log('PASS: both grades; mandatory practice, two directions, wrong-recall retries, flip/hide, saved errors, clearing mastered words, results gating, XP preservation, mobile layout and selected-vocabulary flashcards.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
