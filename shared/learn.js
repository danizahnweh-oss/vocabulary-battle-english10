/* Learning checkpoints are local to this browser and grade. */
let learnedWords=new Set(),learningSession=null;
function loadLearning(){try{const ids=JSON.parse(localStorage.getItem(`vocab-learned-${GRADE}`)||'[]');if(Array.isArray(ids))learnedWords=new Set(ids.filter(id=>VOCAB.some(w=>w.id===id)));}catch{learnedWords=new Set();}}
function saveLearning(){try{localStorage.setItem(`vocab-learned-${GRADE}`,JSON.stringify([...learnedWords]));}catch{}}
function learningCount(words){return words.filter(w=>learnedWords.has(w.id)).length;}
function renderLearningSetup(){
 stopTimer();game=null;cardSession=null;learningSession=null;$('#word-list').disabled=false;
 main.innerHTML=`<div class="game-top"><div><strong>English ${GRADE} · Learning unit</strong><p>Study vocabulary at your own pace.</p></div><button class="quiet" id="learning-back">Open game setup</button></div><h1 class="learn-heading">Learn vocabulary.</h1><p class="learn-setup-intro">Discover 5 words at a time, recognise the meanings, then recall each word twice. No timer or competition.</p><form id="learning-form" class="learn-setup"><fieldset><legend>Choose your topics</legend>${MISSIONS.map(m=>`<label class="topic"><input type="checkbox" name="learn-topic" value="${m.id}" ${setup.topics.includes(m.id)?'checked':''}><span class="topic-copy"><strong>${escapeHTML(m.title)}</strong><span>${escapeHTML(m.sub)}</span></span><span class="word-count">${VOCAB.filter(w=>wordInGroups(w,m.groups)).length} words</span></label>`).join('')}</fieldset><div class="field"><label for="learn-direction">Practise translations</label><select id="learn-direction"><option value="mixed">Both directions</option><option value="de-en">German → English</option><option value="en-de">English → German</option></select></div><p class="hint" id="learning-selection"></p><p class="error" id="learning-error" role="alert"></p><button type="submit" class="primary" id="learn-begin">Start learning</button></form>`;
 $('#learn-direction').value=setup.direction;
 const update=()=>{setup.topics=[...main.querySelectorAll('[name=learn-topic]:checked')].map(e=>e.value);setup.direction=$('#learn-direction').value;const words=selectedWords();$('#learning-selection').textContent=`${words.length} words selected · ${learningCount(words)} learned on this device`};
 $('#learning-form').onchange=()=>{update();$('#learning-error').textContent='';};
 $('#learning-form').onsubmit=e=>{e.preventDefault();update();if(!selectedWords().length){$('#learning-error').textContent='Choose at least one topic to learn.';main.querySelector('[name=learn-topic]').focus();return;}startLearning();};
 $('#learning-back').onclick=()=>{renderSetup();focusHeading();};update();focusHeading();
}
function startLearning(words=selectedWords(),review=false){
 stopTimer();if(!words.length){renderLearningSetup();$('#learning-error').textContent='Choose at least one topic to learn.';return;}
 game=null;cardSession=null;learningSession={pool:[...words],review,reviewed:new Set(),block:[],index:0,phase:'discover'};
 $('#word-list').disabled=true;nextLearningBlock();
}
function nextLearningBlock(){
 const s=learningSession;
 s.block=s.pool.filter(w=>s.review?!s.reviewed.has(w.id):!learnedWords.has(w.id)).slice(0,5);
 s.index=0;s.phase='discover';
 if(!s.block.length){renderLearningComplete();return;}
 renderLearningWord();
}
function learningFrame(stage){
 const s=learningSession,done=s.review?s.reviewed.size:learningCount(s.pool);
 return `<div class="game-top"><div><strong>Learning unit · English ${GRADE}</strong><p>${done} / ${s.pool.length} words ${s.review?'reviewed':'learned'} · Saved on this device</p></div><button class="quiet" id="learn-exit">Save & leave</button></div><nav class="learn-stages" aria-label="Learning steps">${['Discover','Recognise','Recall'].map((label,i)=>`<span ${stage===i?'aria-current="step"':''}>${i+1}. ${label}</span>`).join('')}</nav><section class="arena learn-arena" id="learn-arena"></section>`;
}
function bindLearningExit(){
 $('#learn-exit').onclick=()=>{cancelAutoAdvance();window.speechSynthesis?.cancel();learningSession=null;cardSession=null;renderLearningSetup();focusHeading();};
}
function renderLearningWord(){
 const s=learningSession,w=s.block[s.index];s.phase='discover';
 main.innerHTML=learningFrame(0);bindLearningExit();
 $('#learn-arena').innerHTML=`<p class="hint">Word ${s.index+1} of ${s.block.length} · Read both meanings before practising.</p><h1 class="learn-heading">Meet your words.</h1><div class="learn-word"><div><span class="hint">English</span><h2 lang="en">${escapeHTML(w.en)}</h2></div><div><span class="hint">German</span><p lang="de">${escapeHTML(w.de)}</p></div></div>${w.note?`<p class="learn-note" lang="en">${escapeHTML(w.note)}</p>`:''}<div class="actions">${'speechSynthesis' in window&&'SpeechSynthesisUtterance' in window?'<button class="secondary" id="learn-listen">Listen in English</button>':''}<button class="quiet" id="learn-previous" ${s.index===0?'disabled':''}>Previous word</button><button class="primary" id="learn-next">${s.index+1===s.block.length?'Practise these words':'Next word'}</button></div><p class="hint">No timer. Read the words aloud or make your own sentence.</p>`;
 $('#learn-previous').onclick=()=>{window.speechSynthesis?.cancel();s.index--;renderLearningWord();};
 $('#learn-next').onclick=()=>{window.speechSynthesis?.cancel();if(++s.index<s.block.length)renderLearningWord();else{s.index=0;s.phase='recognise';renderLearningQuiz();}};
 if($('#learn-listen'))$('#learn-listen').onclick=()=>{window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(w.puzzleEn||w.en.replace(/\([^)]*\)/g,'').trim());utterance.lang='en-GB';utterance.rate=.85;window.speechSynthesis.speak(utterance);announce('Playing the English pronunciation.');};
 focusHeading();
}
function renderLearningQuiz(){
 cancelAutoAdvance();
 const s=learningSession,w=s.block[s.index];s.phase='recognise';
 // Recognition in the chosen direction; mixed learning alternates per word.
 const target=setup.direction==='de-en'?'en':setup.direction==='en-de'?'de':s.index%2?'en':'de',prompt=target==='en'?'de':'en';
 const choices=makeChoices(w,target);
 main.innerHTML=learningFrame(1);bindLearningExit();
 $('#learn-arena').innerHTML=`<p class="hint">Word ${s.index+1} of ${s.block.length} · Choose its ${target==='en'?'English':'German'} meaning.</p><h1 class="question-title ${w[prompt].length>65?'long':''}" lang="${prompt}">${escapeHTML(w[prompt])}</h1><div class="answers">${choices.map((c,i)=>`<button class="answer" data-learn-choice="${i}"><span class="key" aria-hidden="true">${i+1}</span><span lang="${target}">${escapeHTML(c.label)}</span></button>`).join('')}</div><div id="learn-feedback" role="status"></div>`;
 main.querySelectorAll('[data-learn-choice]').forEach(b=>b.onclick=()=>{
  if(s.phase!=='recognise')return;const correct=choices[Number(b.dataset.learnChoice)].correct;s.phase='feedback';
  main.querySelectorAll('[data-learn-choice]').forEach(button=>{button.disabled=true;if(choices[Number(button.dataset.learnChoice)].correct)button.classList.add('correct');else if(button===b)button.classList.add('wrong');});
  if(!correct)rememberMistakes([w]);
  $('#learn-feedback').innerHTML=`<div class="feedback ${correct?'':'fail'}"><div class="feedback-copy"><h2>${correct?'Correct!':'Take another look.'}</h2><p><span lang="en">${escapeHTML(w.en)}</span> = <span lang="de">${escapeHTML(w.de)}</span></p><p>${correct?'Continuing automatically. Keep building your recall.':'Read both meanings, then try this word again.'}</p></div><button class="primary" id="learn-continue">${correct?s.index+1===s.block.length?'Recall these words':'Next word':'Try this word again'}</button></div>`;
  const advance=()=>{if(learningSession!==s||s.phase!=='feedback')return;cancelAutoAdvance();s.phase='advancing';if(!correct){renderLearningQuiz();return;}if(++s.index<s.block.length)renderLearningQuiz();else{startFlashcards(s.block,false,{twice:true,onComplete:completeLearningBlock,onExit:()=>{learningSession=null;renderLearningSetup();focusHeading();return true;}});}};
  $('#learn-continue').onclick=advance;if(correct)scheduleAutoAdvance(advance);$('#learn-continue').focus({preventScroll:true});
 });focusHeading();
}
function completeLearningBlock(){
 const s=learningSession;s.block.forEach(w=>{learnedWords.add(w.id);s.reviewed.add(w.id);});saveLearning();s.phase='complete';cardSession=null;
 main.innerHTML=learningFrame(2);bindLearningExit();
 const remaining=s.pool.filter(w=>s.review?!s.reviewed.has(w.id):!learnedWords.has(w.id)).length;
 $('#learn-arena').innerHTML=`<h1 class="learn-heading">${s.block.length} words learned.</h1><p>You recognised the meanings and recalled every word twice. Your completed words are saved on this device.</p><div class="learn-recap">${s.block.map(w=>`<div class="review-row"><span lang="en">${escapeHTML(w.en)}</span><span lang="de">${escapeHTML(w.de)}</span></div>`).join('')}</div><div class="actions"><button class="primary" id="learn-block-next">${remaining?`Learn the next ${Math.min(5,remaining)} words`:'Finish learning unit'}</button><button class="secondary" id="learn-play">Play with these words</button></div>`;
 $('#learn-block-next').onclick=nextLearningBlock;
 $('#learn-play').onclick=()=>playLearnedWords(s.block);
 focusHeading();
}
function playLearnedWords(words){learningSession=null;cardSession=null;startGame(words);}
function renderLearningComplete(){
 const s=learningSession;s.phase='finished';main.innerHTML=learningFrame(2);bindLearningExit();
 $('#learn-arena').innerHTML=`<h1 class="learn-heading">Learning unit complete.</h1><p>You have learned all ${s.pool.length} selected words. Ready to put them into play?</p><div class="actions"><button class="primary" id="learn-return">Back to learning topics</button><button class="secondary" id="learn-play">Play with these words</button><button class="secondary" id="learn-review">Review these words again</button></div>`;
 $('#learn-play').onclick=()=>playLearnedWords(s.pool);
 $('#learn-return').onclick=renderLearningSetup;
 $('#learn-review').onclick=()=>startLearning(s.pool,true);
 focusHeading();
}
