/* Recall practice is kept per grade; only vocabulary IDs are stored. */
let cardSession=null;
let pendingMistakes=new Set();
function loadMistakes(){try{const saved=JSON.parse(localStorage.getItem(`vocab-mistakes-${GRADE}`)||'[]');if(Array.isArray(saved))pendingMistakes=new Set(saved.filter(id=>typeof id==='string'&&VOCAB.some(w=>w.id===id)));}catch{pendingMistakes=new Set();}}
function saveMistakes(){try{localStorage.setItem(`vocab-mistakes-${GRADE}`,JSON.stringify([...pendingMistakes]));}catch{}}
function rememberMistakes(words){words.forEach(w=>pendingMistakes.add(w.id));saveMistakes();}
function flashcardHint(){const count=pendingMistakes.size;return count?`${count} ${count===1?'word':'words'} still to master. Errors come first.`:'Flip, recall and master your selected vocabulary.';}
function startFlashcards(words,mandatory=false){
 stopTimer();if(!words.length){$('#setup-error').textContent='Choose at least one mission.';return;}
 const unique=[...new Map(words.map(w=>[w.id,w])).values()];
 const errors=shuffle(unique.filter(w=>pendingMistakes.has(w.id))),fresh=shuffle(unique.filter(w=>!pendingMistakes.has(w.id)));
 const firstTarget=setup.direction==='en-de'?'de':'en';
 const first=[...errors,...fresh].map((word,i)=>({word,target:setup.direction==='mixed'?(i%2?'de':'en'):firstTarget}));
 const second=first.filter(c=>mandatory||pendingMistakes.has(c.word.id)).map(c=>({word:c.word,target:setup.direction==='mixed'?(c.target==='en'?'de':'en'):c.target}));
 cardSession={queue:[...first,...second],total:first.length+second.length,completed:0,mandatory,revealed:false,phase:'recall'};
 if(game)game.phase='cards';$('#word-list').disabled=true;renderFlashcard();
}
function renderFlashcard(){
 const session=cardSession;
 if(!session.queue.length){
  $('#word-list').disabled=false;
  if(session.mandatory){game.practiceComplete=true;cardSession=null;renderResults();return;}
  main.innerHTML=`<div class="results-heading"><div class="trophy" aria-hidden="true">🏅</div><span class="tag">Flashcards complete</span><h1>Words mastered!</h1><p>You completed ${session.total} correct recalls.</p></div><div class="actions result-actions"><button class="primary" id="cards-done">Back to setup</button></div>`;
  $('#cards-done').onclick=()=>{cardSession=null;renderSetup();focusHeading();};focusHeading();return;
 }
 const c=session.queue[0],prompt=c.target==='en'?'de':'en';session.revealed=false;session.phase='recall';
 main.innerHTML=`<div class="game-top"><div><strong>${session.mandatory?'Mistake mission':'Flashcards'}</strong><p>${session.completed} / ${session.total} recalls completed · ${session.queue.length} remaining</p></div><button class="quiet" id="cards-exit">Save & leave</button></div><section class="arena flashcard-arena"><span class="mode-badge"><span aria-hidden="true">🃏</span> Recall challenge</span><p>${session.mandatory?'Master every missed word with two correct recalls to unlock your results.':pendingMistakes.has(c.word.id)?'This is a tricky word. Recall it twice to clear it from your mistake list.':'Think of the translation, then check your recall.'}</p><div class="flashcard-face"><p class="direction">${c.target==='en'?'German → English':'English → German'}</p><h1 class="question-title ${c.word[prompt].length>65?'long':''}" lang="${prompt}">${escapeHTML(c.word[prompt])}</h1><div id="card-back" hidden><span class="hint">Answer</span><p lang="${c.target}" class="card-translation">${escapeHTML(c.word[c.target])}</p></div></div><button class="secondary" id="card-flip">Flip card</button><form id="card-form"><label for="card-answer">Recall the ${c.target==='en'?'English':'German'} translation</label><div class="typing-row"><input id="card-answer" class="typed-input" lang="${c.target}" autocomplete="off" autocapitalize="none" spellcheck="false" required><button class="primary" type="submit">Check recall</button></div><p class="hint">One correct translation is enough. Hide the answer before checking.</p></form><div id="card-feedback" role="status"></div></section>`;
 $('#card-flip').onclick=()=>{session.revealed=!session.revealed;$('#card-back').hidden=!session.revealed;$('#card-flip').textContent=session.revealed?'Hide answer & recall':'Flip card';$('#card-form button').disabled=session.revealed;$('#card-answer').disabled=session.revealed;if(!session.revealed){$('#card-answer').value='';$('#card-answer').focus();}};
 $('#cards-exit').onclick=()=>{cardSession=null;game=null;$('#word-list').disabled=false;renderSetup();focusHeading();};
 $('#card-form').onsubmit=e=>{
  e.preventDefault();if(session.revealed||session.phase!=='recall')return;
  const value=$('#card-answer').value.trim();if(!value)return;
  const correct=answerVariants(c.word,c.target).includes(normalise(value));session.phase='feedback';
  $('#card-answer').disabled=true;$('#card-form button').disabled=true;$('#card-flip').disabled=true;
  session.queue.shift();if(correct){session.completed++;if(!session.queue.some(x=>x.word.id===c.word.id)){pendingMistakes.delete(c.word.id);saveMistakes();}}
  else{rememberMistakes([c.word]);session.queue.push(c);if(!session.queue.some(x=>x!==c&&x.word.id===c.word.id)){session.queue.push({word:c.word,target:setup.direction==='mixed'?(c.target==='en'?'de':'en'):c.target});session.total++;}}
  $('#card-feedback').innerHTML=`<div class="feedback ${correct?'':'fail'}"><div><h2>${correct?'Correct recall!':'Keep practising this word.'}</h2><p><span lang="en">${escapeHTML(c.word.en)}</span> = <span lang="de">${escapeHTML(c.word.de)}</span></p><p class="hint">${correct?'Your progress is saved.':'This card will return. You need two correct recalls to master it.'}</p></div><button class="primary" id="next-card">${session.queue.length?'Next card':session.mandatory?'Unlock results':'Finish practice'}</button></div>`;
  $('#next-card').onclick=renderFlashcard;$('#next-card').focus({preventScroll:true});
 };
 focusHeading();
}
