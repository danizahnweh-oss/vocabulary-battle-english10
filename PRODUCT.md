# Vocabulary Battle

## Register

product

## Users
Englischklassen der Jahrgangsstufen 7, 10 und 11; gemeinsame Nutzung am Beamer, Bedienung durch Lehrkraft oder Teams. Zusätzlich allein am eigenen Gerät spielbar.

## Product Purpose
Vokabeln der bereitgestellten Seiten in einem Teamwettbewerb oder im Solo-Modus mit Zeitlimit und Punkten üben. Vom Nutzer bestätigt: gemeinsames Spielen in der Klasse und wettbewerbsorientierte Gestaltung.

## Brand Personality
Deutlich verspielt, bunt, wettbewerbsorientiert. Auf ausdrücklichen Nutzerwunsch Computerspiel statt Schuloptik: dunkle Arcade-Lobby, Neonakzente, Team-Avatare, XP, Level-Fortschritt und Pokalfeier. English interface throughout, including instructions, results, validation and accessibility labels. German remains only as vocabulary content in the translation tasks and word log.

## Anti-references
Keine Schul- oder Arbeitsblattoptik, keine Werbe-Landingpage, keine Kleinkind-Motive.

## Design Principles
- Solo-Modus mit eigenem Spielernamen, XP und direktem Wechsel zur nächsten Frage.
- Gleiche Anzahl Fragen für jedes Team.
- Schwierige Wörter nach einem Solo- oder Teamspiel erneut spielen.
- Große, gut lesbare Fragen und Antworten.
- Richtiges Wort nach jeder Antwort zeigen.
- Zeitlimit vor Spielbeginn wählbar.
- Keine Anmeldung oder personenbezogenen Daten nötig.

## Accessibility & Inclusion
Tastaturbedienung, große Schaltflächen, verständliche Statusmeldungen, Kontrast und reduzierte Bewegung. Zeitlimit abschaltbar.

## Game Modes
Arcade Mix is the default: Quiz, Type Attack, True or False, Word Scramble and Pair Match. A shuffled five-mode cycle is shared by all teams; the default five-question match includes every mode. Shorter matches use as many modes as fit. Individual modes remain selectable. Translation direction defaults to alternating German → English and English → German, shared by teams each round. Pair Match always shows both languages. Pair Match awards the normal challenge score after all pairs are matched; a wrong pair ends the challenge and unmatched words enter the review pool.

All vocabulary missions for the selected grade are enabled by default.

## Routes and Vocabulary
- `/10/`: 100 words, Across cultures and Scottish history.
- `/7/`: 959 distinct vocabulary entries from the supplied photos and 19 screenshots (pages 182–219), covering Units 1–4, Across cultures 1–3, Focus 1–2, Text smart 1–2 and supplementary word banks. The original 49 entries and IDs are retained. Main entries follow the printed meanings; missing German meanings in the word banks are supplemented and labeled. Different senses of an English headword are explicitly labeled, such as “body (a dead person)” and “for (reason)”.
- Reviewed additions live in `7/data/additions.tsv`; run `node scripts/build-grade7-vocabulary.cjs` from the repo root to regenerate `7/vocabulary-additions.js`. All 12 missions are enabled by default.
- All routes use `shared/app.js` and `shared/style.css`; vocabulary, accepted variants and mission metadata stay in their own grade folder. Word counts are calculated from each dataset.
- New vocabulary belongs to the requested grade. Each grade defaults to all its missions, all five game modes and both directions.

## Flashcards and Mistake Practice
Flashcards use the selected missions, with saved mistakes first. Mistake IDs are saved locally per grade. Every incorrect game answer enters the mistake list. A game with mistakes opens mandatory recall practice before its results: every missed word needs two correct recalls (one in each language when directions are mixed). Incorrect recalls return to the queue. Revealed answers must be hidden before recall can be checked. Leaving saves pending mistakes; the lobby provides “Practise mistakes”. All grades share this feature.

## Grade 11 and Custom Match Length
- `/11/`: 1,113 distinct headwords from all 65 supplied Green Line Transition DOCX files (1,354 source rows). Topics: New York, Colonial legacies, Structural change, Postcolonial developments and Global matters. Repeated headwords combine translations and retain all topic memberships. `11/data/source-vocabulary.json` contains source rows and references; regenerate with `node scripts/build-grade11-vocabulary.cjs`. One blank meaning (bilateral) was supplemented. Two obvious source typos are corrected during generation.
- Grade 11 uses a restrained light theme with teal actions, neutral answers, letter-based team markers, scores, timers and rankings. No decorative celebrations. Grades 7 and 10 retain their arcade theme.
- All grades keep presets of 3, 5 and 10 questions and default to Custom with 5 questions prefilled, accepting any whole number from 1 to 1000. This is the count per player/team, including mixed mode. Long matches show compact round and accuracy indicators.

## Automatic Progression
Correct game answers and flashcard recalls advance automatically after 1.2 seconds of feedback. Solo games show the next question; team games show the next team’s ready screen, preserving preparation time. Wrong answers and timeouts stay visible until Next is chosen. Next remains available for immediate progression. Automatic progression pauses while the quit dialog or a hidden tab is active, and pending callbacks are cancelled when leaving or starting another activity.

## Multiple-Choice Alternatives
Answer options share the question's part of speech (nouns, verbs, adjectives, adverbs and other classes). Choices favour the same vocabulary section, then the same mission, with comparable label lengths. Equivalent translations and overlapping alternative answers are excluded. Polysemous German labels show senses that fit the word class. Rare word classes use a checked backup bank for distractors only; those words never enter the question deck.

After any vocabulary update, regenerate and review all grammar tags with `node scripts/build-word-types.cjs`; the review table is written to `/tmp/vocab-word-types.tsv`. Maintain exceptions in that script for ambiguous headwords and word classes without reliable spelling cues. Run `node tests/choice-grammar.cjs` to check both directions for every entry, including grammar fixtures, ambiguity, four options and topic preference.

## Independent Learning Unit
Grades 7, 10 and 11 offer separate learning and game entries. `?activity=learn` opens topic selection directly, independent of team settings, question counts and game timers. All topics and both directions are selected initially. Students discover five bilingual words at a time, can listen to native browser English pronunciation, recognise each translation with grammar-matched alternatives, then recall every word twice. Incorrect recognition must be retried; incorrect recalls return to practice. Correct recognition and recall use the existing automatic progression. Completed five-word packs (including smaller final packs) are saved locally per grade; unfinished packs are revisited on return. Previously learned vocabulary can be reviewed again. Learning is never required to start a game, and learning screens contain no scores or countdowns.
