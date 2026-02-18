/**
 * generate-plan.js
 * Reads progress.json, picks NEW topics that haven't been covered,
 * generates a lesson plan, writes the issue content, and updates progress.json.
 */
const fs = require('fs');
const path = require('path');

const PROGRESS_FILE = path.join(__dirname, '..', '..', 'progress.json');
const focusOverride = process.argv[2] || '';

// ── Activity scenario banks (keyed by type, each unique) ────────────────────

const PHONICS_SCENARIOS = {
  S: [
    { name: "Snake Sounds", scenario: '"Let\'s be sneaky snakes! Can you make the sssss sound? What else sounds like sssss?"', activity: "Slither around the room like a snake while making the S sound. Find 3 things that start with S (sock, spoon, sofa).", answer: "S says sssss" },
    { name: "S Spy Game", scenario: '"I spy with my little eye, something that starts with sssss!"', activity: "Take turns finding objects around the room that start with the S sound. Draw the letter S in the air with your finger.", answer: "Objects starting with S sound" },
    { name: "Sand Letter S", scenario: '"Let\'s draw a wiggly snake letter! Can you trace S with your finger?"', activity: "Pour salt or flour on a tray. Show the child how to trace the letter S. Let them try 3 times, then find S in a book.", answer: "Tracing the letter S" },
  ],
  A: [
    { name: "Ant March", scenario: '"A-a-a! The ants are marching! Can you march like an ant and say a-a-a?"', activity: "March around while saying the short A sound. Find things that start with A (apple, arm, ant).", answer: "A says a-a-a (short a)" },
    { name: "A is for Apple", scenario: '"Let\'s find the a-a-apple letter! Where is the letter A hiding?"', activity: "Look through a picture book and point to every letter A you see. Count how many you find!", answer: "Spotting letter A" },
  ],
  T: [
    { name: "Ticking Clock", scenario: '"T-t-t! Can you hear the clock going t-t-t? Let\'s be ticking clocks!"', activity: "Tap on the table making the T sound. Find 3 things starting with T (table, teddy, towel). Trace T in sand/salt.", answer: "T says t-t-t" },
    { name: "T Toast Time", scenario: '"T-t-t-toast! What sound does T make? Let\'s find T things in the kitchen!"', activity: "Walk to the kitchen. Find items starting with T (tea, tin, tap). Practice writing T with a crayon.", answer: "T objects and letter formation" },
  ],
  P: [
    { name: "Popping Bubbles", scenario: '"P-p-p-pop! Let\'s pop pretend bubbles! Every pop starts with P!"', activity: "Pretend to pop bubbles saying P-p-p. Find things starting with P (pen, plate, pillow). Clap for each P item found.", answer: "P says p-p-p" },
  ],
  I: [
    { name: "Itchy Insect", scenario: '"I-i-i, imagine an itchy insect! Can you scratch and say i-i-i?"', activity: "Wiggle and scratch like an itchy insect saying the short I sound. Find I words (in, it, if). Trace I on paper.", answer: "I says i-i-i (short i)" },
  ],
  N: [
    { name: "Noisy Engine", scenario: '"Nnnn-nnnn! Your nose makes the N sound! Hum like an engine — nnnn!"', activity: "Hum the N sound with your hand on your nose to feel the vibration. Find N items (nose, nut, napkin).", answer: "N says nnn" },
  ],
  M: [
    { name: "Yummy M Sound", scenario: '"Mmmmm, yummy! When we eat something tasty we say mmmmm. That\'s the M sound!"', activity: "Rub your tummy and say mmmmm. Find M objects (milk, mug, mat). Trace M with finger paint or crayon.", answer: "M says mmm" },
  ],
  D: [
    { name: "Drum Beat", scenario: '"D-d-d like a drum! Let\'s bang our drums and make the D sound!"', activity: "Use pots as drums, tap while saying d-d-d. Find D items (door, doll, duck). Practice writing D.", answer: "D says d-d-d" },
  ],
};

// Fallback for letters without specific scenarios
function genericPhonicsScenario(letter) {
  return {
    name: `Letter ${letter} Explorer`,
    scenario: `"Today we're going to learn the sound that ${letter} makes! Ready?"`,
    activity: `Say the ${letter} sound together 5 times. Walk around and find 3 objects starting with ${letter}. Trace the letter ${letter} on paper.`,
    answer: `${letter} sound and letter recognition`,
  };
}

const MATHS_SCENARIOS = {
  "counting-1-to-5": { name: "Count to 5", scenario: '"Let\'s count your fingers on one hand! Ready? 1... 2..."', activity: "Touch each finger as you count to 5 together. Then count 5 toys, 5 steps, 5 claps.", answer: "1, 2, 3, 4, 5" },
  "counting-1-to-10": { name: "Count to 10", scenario: '"How many fingers do you have? Let\'s count ALL of them!"', activity: "Count all 10 fingers. Line up 10 small objects and count them. Sing a counting song.", answer: "1 through 10" },
  "number-recognition-1-3": { name: "Number Detectives 1-3", scenario: '"Can you find the number hiding on this page? Where is number 2?"', activity: "Write numbers 1, 2, 3 on cards. Mix them up. Ask child to pick up the right number. Match to groups of objects.", answer: "Recognizing 1, 2, 3" },
  "number-recognition-4-6": { name: "Number Detectives 4-6", scenario: '"We know 1, 2, 3 — now let\'s meet their friends 4, 5, and 6!"', activity: "Write 4, 5, 6 on cards. Count out matching objects for each number. Play 'show me the number' game.", answer: "Recognizing 4, 5, 6" },
  "shapes-circle-square": { name: "Shape Hunt - Circle & Square", scenario: '"Circles are round like a ball! Squares have 4 sides. Let\'s find them!"', activity: "Walk around the room finding circles (clock, plate) and squares (window, book). Draw each shape.", answer: "Circle = round, Square = 4 equal sides" },
  "shapes-triangle-rectangle": { name: "Shape Hunt - Triangle & Rectangle", scenario: '"Triangles have 3 pointy corners! Rectangles are like long squares!"', activity: "Find triangles (roof shape, sandwich half) and rectangles (door, phone). Make shapes with sticks or straws.", answer: "Triangle = 3 sides, Rectangle = 4 sides (2 long, 2 short)" },
  "sorting-by-color": { name: "Color Sort", scenario: '"Let\'s sort your toys by color! All the red ones here, blue ones there!"', activity: "Gather 10-15 small toys. Sort by color into groups. Count how many in each group. Which color has the most?", answer: "Groups sorted by color" },
  "sorting-by-size": { name: "Big & Small", scenario: '"Which teddy is the biggest? Which is the tiniest? Let\'s line them up!"', activity: "Line up 5 objects from smallest to biggest. Use words: small, medium, big. Compare pairs — which is bigger?", answer: "Objects ordered by size" },
  "patterns-ABAB": { name: "Pattern Party", scenario: '"Red, blue, red, blue — what comes next? Let\'s make patterns!"', activity: "Use colored blocks or fruits to make ABAB patterns. Let the child continue the pattern. Try with clapping (loud, soft, loud, soft).", answer: "The pattern repeats: A, B, A, B..." },
  "more-or-less": { name: "More or Less", scenario: '"I have 3 crackers and you have 5. Who has MORE?"', activity: "Make two groups of objects. Ask which has more, which has less. Try with different amounts. Use words: more, less, same.", answer: "Comparing quantities" },
  "addition-with-objects-to-3": { name: "Adding to 3", scenario: '"You have 1 block. I give you 2 more. How many do you have NOW?"', activity: "Use blocks or snacks. Start with 1, add 1 more (1+1=2). Start with 1, add 2 more (1+2=3). Celebrate each answer!", answer: "1+1=2, 1+2=3, 2+1=3" },
  "addition-with-objects-to-5": { name: "Adding to 5", scenario: '"3 ducks in the pond, 2 more swim over. How many ducks now?"', activity: "Act out addition stories with toys. 2+2=4, 3+2=5, 4+1=5. Use fingers to check answers.", answer: "Adding up to 5" },
  "finger-counting": { name: "Finger Fun", scenario: '"Show me 3 fingers! Now show me 5! Can you show me 2?"', activity: "Practice showing different numbers on fingers. Parent says a number, child shows it. Then child says a number for parent!", answer: "Matching finger count to numbers" },
  "measurement-with-blocks": { name: "Block Measuring", scenario: '"How many blocks tall is your teddy? Let\'s measure!"', activity: "Stack blocks next to objects to measure them. The car is 3 blocks long. The book is 5 blocks tall. Compare measurements.", answer: "Measuring with non-standard units" },
};

const READING_SCENARIOS = {
  "book-handling": { name: "Book Explorer", scenario: '"This is the FRONT of the book. Can you show me the front? Now let\'s open it gently!"', activity: "Practice holding the book right way up. Open to the first page. Point out the title, pictures, and words.", answer: "Correct book orientation and handling" },
  "cover-prediction": { name: "Cover Clues", scenario: '"Look at this book cover! What do you think this story is about?"', activity: "Show the book cover. Let the child guess what happens. Point to clues in the picture. Read to find out if they were right!", answer: "Predictions based on cover art" },
  "who-what-where-questions": { name: "Story Questions", scenario: '"WHO was in the story? WHERE did they go? WHAT happened?"', activity: "After reading, ask 3 simple questions: Who? What? Where? Use the pictures as hints. Praise every answer!", answer: "Answering comprehension questions" },
  "picture-walk": { name: "Picture Walk", scenario: '"Before we read, let\'s look at just the pictures! What do you see on this page?"', activity: "Flip through the book looking only at pictures. Ask what the child sees. Build the story from pictures before reading words.", answer: "Narrating from illustrations" },
  "name-recognition": { name: "My Special Name", scenario: '"This is YOUR name! Can you see it? Let\'s find all the letters in your name!"', activity: "Write the child's name in big letters. Point to each letter and say it. Find those letters in books and around the house.", answer: "Recognizing own name in print" },
  "story-retelling": { name: "Tell Me the Story", scenario: '"You be the storyteller now! What happened first in our book?"', activity: "After reading a familiar book, ask the child to retell it. Use prompts: 'And then what?' Use toys to act it out.", answer: "Retelling story events in order" },
  "rhyming-in-stories": { name: "Rhyme Time Story", scenario: '"Cat, hat — they sound the same at the end! Can you hear the rhyme?"', activity: "Read a rhyming book. Pause before the rhyming word and let the child guess. Make up silly rhymes together.", answer: "Identifying rhyming words" },
  "connect-story-to-life": { name: "Story Connections", scenario: '"The bear went to the park! Have YOU been to the park? What did you see?"', activity: "After reading, connect story events to the child's real experiences. Draw a picture of your favorite part.", answer: "Relating stories to personal experience" },
};

const GAME_SCENARIOS = [
  { name: "I Spy Sounds", type: "game", scenario: '"I spy with my little eye, something that starts with the sound..."', activity: "Play I Spy using beginning letter sounds (not letter names). Take turns. Give clues if the child is stuck.", answer: "Objects matching the target sound" },
  { name: "Sound Jump", type: "game", scenario: '"I\'m going to say some words. Jump when you hear one that starts with our letter!"', activity: "Say a mix of words. Child jumps when they hear one starting with today's letter. Speed up for more fun!", answer: "Jumping on correct sound" },
  { name: "Rhyme Chain", type: "game", scenario: '"Cat! What rhymes with cat? Bat! What rhymes with bat?"', activity: "Start a rhyme chain. Take turns saying rhyming words. It's OK to use silly made-up words! See how long the chain gets.", answer: "Rhyming words (real and silly)" },
  { name: "Number Freeze Dance", type: "game", scenario: '"Dance, dance, dance... FREEZE! Show me 4 fingers!"', activity: "Play music (or sing). When it stops, call out a number. Child must freeze and show that many fingers.", answer: "Matching numbers to finger count" },
  { name: "Scavenger Hunt", type: "game", scenario: '"Can you find something RED? Now find something that starts with B!"', activity: "Give the child a hunt: find 1 red thing, 2 soft things, 3 things that start with a letter. Count the findings together.", answer: "Items matching the hunt criteria" },
  { name: "Silly Sentences", type: "game", scenario: '"Sam the snake sings songs on Saturdays! Can you make a silly sentence with S?"', activity: "Make alliterative silly sentences with today's letter. The sillier the better! Draw a picture of the silly sentence.", answer: "Alliterative silly sentences" },
];

const WORKSHEET_LINKS = {
  phonics: [
    { title: "Letter Tracing Worksheets (K5 Learning)", url: "https://www.k5learning.com/free-preschool-kindergarten-worksheets/letters-alphabet" },
    { title: "Phonics & Sounds Worksheets (K5 Learning)", url: "https://www.k5learning.com/free-preschool-kindergarten-worksheets/phonics" },
    { title: "Alphabet Worksheets (Education.com)", url: "https://www.education.com/worksheets/preschool/" },
  ],
  maths: [
    { title: "Numbers & Counting Worksheets (K5 Learning)", url: "https://www.k5learning.com/free-preschool-kindergarten-worksheets/numbers-counting" },
    { title: "Shapes Worksheets (K5 Learning)", url: "https://www.k5learning.com/free-preschool-kindergarten-worksheets/shapes" },
    { title: "Simple Math Worksheets (K5 Learning)", url: "https://www.k5learning.com/free-preschool-kindergarten-worksheets/simple-math" },
  ],
  reading: [
    { title: "Vocabulary Worksheets (K5 Learning)", url: "https://www.k5learning.com/free-preschool-kindergarten-worksheets/vocabulary" },
    { title: "Reading Comprehension (K5 Learning)", url: "https://www.k5learning.com/free-preschool-kindergarten-worksheets/reading-comprehension" },
    { title: "Preschool Worksheets (Education.com)", url: "https://www.education.com/worksheets/preschool/" },
  ],
};

// ── Brain Quest–style Q&A bank (ages 3–4) ───────────────────────────────────

const BRAIN_QUEST_POOL = [
  // Colors & Shapes
  { q: "What color is the sun?", a: "Yellow", category: "colors" },
  { q: "What shape is a ball?", a: "Circle", category: "shapes" },
  { q: "What color is grass?", a: "Green", category: "colors" },
  { q: "How many sides does a triangle have?", a: "3", category: "shapes" },
  { q: "What shape is a door?", a: "Rectangle", category: "shapes" },
  { q: "What color is the sky on a sunny day?", a: "Blue", category: "colors" },
  { q: "What shape are your eyes?", a: "Oval / Circle", category: "shapes" },
  { q: "What color do you get when you mix red and yellow?", a: "Orange", category: "colors" },
  { q: "How many corners does a square have?", a: "4", category: "shapes" },
  { q: "What color is a fire truck?", a: "Red", category: "colors" },

  // Animals
  { q: "Which animal barks — a cat or a dog?", a: "Dog", category: "animals" },
  { q: "Which animal says 'moo'?", a: "Cow", category: "animals" },
  { q: "What does a cat say?", a: "Meow", category: "animals" },
  { q: "Which animal has a long trunk?", a: "Elephant", category: "animals" },
  { q: "Which animal hops — a frog or a fish?", a: "Frog", category: "animals" },
  { q: "What animal gives us milk?", a: "Cow", category: "animals" },
  { q: "Which animal has stripes — a zebra or a cow?", a: "Zebra", category: "animals" },
  { q: "Where do fish live?", a: "In water", category: "animals" },
  { q: "Which animal is the tallest?", a: "Giraffe", category: "animals" },
  { q: "What does a duck say?", a: "Quack", category: "animals" },

  // Counting & Numbers
  { q: "How many fingers do you have on one hand?", a: "5", category: "numbers" },
  { q: "What comes after 3?", a: "4", category: "numbers" },
  { q: "How many ears do you have?", a: "2", category: "numbers" },
  { q: "If you have 2 apples and I give you 1 more, how many?", a: "3", category: "numbers" },
  { q: "What number comes before 5?", a: "4", category: "numbers" },
  { q: "How many legs does a dog have?", a: "4", category: "numbers" },
  { q: "Count the wheels on a car. How many?", a: "4", category: "numbers" },
  { q: "What comes after 7?", a: "8", category: "numbers" },
  { q: "How many eyes do you have?", a: "2", category: "numbers" },
  { q: "If you eat 1 cookie from 3, how many are left?", a: "2", category: "numbers" },

  // Everyday Knowledge
  { q: "What do you wear on your feet?", a: "Shoes / Socks", category: "knowledge" },
  { q: "What do you use to brush your teeth?", a: "Toothbrush", category: "knowledge" },
  { q: "Is the moon out during the day or night?", a: "Night", category: "knowledge" },
  { q: "What do we use an umbrella for?", a: "Rain / To stay dry", category: "knowledge" },
  { q: "Which is hot — ice cream or soup?", a: "Soup", category: "knowledge" },
  { q: "What season do leaves fall from trees?", a: "Autumn / Fall", category: "knowledge" },
  { q: "What do you drink from — a cup or a hat?", a: "Cup", category: "knowledge" },
  { q: "What do you wear when it's cold outside?", a: "Coat / Jacket", category: "knowledge" },
  { q: "Which meal do you eat in the morning?", a: "Breakfast", category: "knowledge" },
  { q: "What do bees make?", a: "Honey", category: "knowledge" },

  // Letters & Sounds
  { q: "What letter does 'apple' start with?", a: "A", category: "letters" },
  { q: "What letter does 'cat' start with?", a: "C", category: "letters" },
  { q: "What letter does 'dog' start with?", a: "D", category: "letters" },
  { q: "What letter does your name start with?", a: "(Child's first letter)", category: "letters" },
  { q: "What sound does the letter S make?", a: "Sssss", category: "letters" },
  { q: "What rhymes with 'cat' — bat or dog?", a: "Bat", category: "letters" },
  { q: "What letter does 'sun' start with?", a: "S", category: "letters" },
  { q: "What rhymes with 'moon' — spoon or star?", a: "Spoon", category: "letters" },
  { q: "Does 'ball' start with B or D?", a: "B", category: "letters" },
  { q: "What letter does 'fish' start with?", a: "F", category: "letters" },

  // Opposites & Comparisons
  { q: "What is the opposite of big?", a: "Small", category: "opposites" },
  { q: "What is the opposite of hot?", a: "Cold", category: "opposites" },
  { q: "Which is bigger — an ant or an elephant?", a: "Elephant", category: "opposites" },
  { q: "What is the opposite of happy?", a: "Sad", category: "opposites" },
  { q: "What is the opposite of up?", a: "Down", category: "opposites" },
  { q: "Which is faster — a car or a snail?", a: "Car", category: "opposites" },
  { q: "What is the opposite of day?", a: "Night", category: "opposites" },
  { q: "Which is heavier — a feather or a rock?", a: "Rock", category: "opposites" },
  { q: "What is the opposite of open?", a: "Closed / Shut", category: "opposites" },
  { q: "What is the opposite of loud?", a: "Quiet", category: "opposites" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function pickUnused(pool, used) {
  const unused = pool.filter(item => !used.includes(item));
  if (unused.length === 0) return pool[Math.floor(Math.random() * pool.length)];
  return unused[Math.floor(Math.random() * unused.length)];
}

function pickBook(library, booksRead) {
  const unread = library.filter(b => !booksRead.includes(b));
  if (unread.length === 0) return library[Math.floor(Math.random() * library.length)];
  return unread[Math.floor(Math.random() * unread.length)];
}

function scenarioHash(scenario) {
  let hash = 0;
  for (let i = 0; i < scenario.length; i++) {
    hash = ((hash << 5) - hash) + scenario.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

function pickUniqueScenario(candidates, usedHashes) {
  const unused = candidates.filter(s => !usedHashes.includes(scenarioHash(s.scenario)));
  if (unused.length > 0) return unused[Math.floor(Math.random() * unused.length)];
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// ── Main ────────────────────────────────────────────────────────────────────

function main() {
  const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));

  // Increment day
  progress.current_day += 1;
  const day = progress.current_day;

  // Determine focus (rotate: 1=phonics, 2=maths, 3=reading)
  let focus;
  if (focusOverride && ['phonics', 'maths', 'reading'].includes(focusOverride)) {
    focus = focusOverride;
  } else {
    const rotation = ['phonics', 'maths', 'reading'];
    focus = rotation[(day - 1) % 3];
  }

  // Pick today's letter from progression
  const letterIndex = progress.phonics.current_index;
  const letter = progress.phonics.progression[letterIndex];

  // Pick maths topic (unused first)
  const mathsTopic = pickUnused(progress.maths.topics_pool, progress.maths.topics_covered);

  // Pick reading topic (unused first)
  const readingTopic = pickUnused(progress.reading.topics_pool, progress.reading.topics_covered);

  // Pick a book
  const book = pickBook(progress.books_library, progress.reading.books_read);

  // Build recent hashes for dedup
  const recentHashes = progress.activities_used.all_scenarios_hashes.slice(-30);

  // ── Build 6 Activities ────────────────────────────────────────────────

  const activities = [];

  // 1. Phonics activity
  const phonicsBank = PHONICS_SCENARIOS[letter] || [genericPhonicsScenario(letter)];
  const phonicsAct = pickUniqueScenario(phonicsBank, recentHashes);
  activities.push({ ...phonicsAct, type: 'phonics', label: '🔤 Phonics' });

  // 2. Maths activity
  const mathsAct = MATHS_SCENARIOS[mathsTopic] || { name: "Maths Practice", scenario: '"Let\'s do some fun counting!"', activity: `Practice: ${mathsTopic.replace(/-/g, ' ')}`, answer: "Maths skills" };
  activities.push({ ...mathsAct, type: 'maths', label: '🔢 Maths' });

  // 3. Reading activity
  const readingAct = READING_SCENARIOS[readingTopic] || { name: "Reading Time", scenario: '"Let\'s read together!"', activity: `Focus: ${readingTopic.replace(/-/g, ' ')}. Read "${book}" together.`, answer: "Reading skills" };
  const enrichedReading = { ...readingAct };
  if (!enrichedReading.activity.includes(book)) {
    enrichedReading.activity += ` Use the book "${book}" for this activity.`;
  }
  activities.push({ ...enrichedReading, type: 'reading', label: '📖 Reading' });

  // 4. Game activity
  const gameAct = pickUniqueScenario(GAME_SCENARIOS, recentHashes);
  activities.push({ ...gameAct, type: 'game', label: '🎮 Game' });

  // 5 & 6: Extra activities based on focus
  if (focus === 'phonics') {
    const extra = pickUniqueScenario(phonicsBank, [...recentHashes, scenarioHash(phonicsAct.scenario)]);
    activities.push({ ...extra, type: 'phonics', label: '🔤 Phonics' });
    const game2 = pickUniqueScenario(GAME_SCENARIOS.filter(g => g !== gameAct), recentHashes);
    activities.push({ ...game2, type: 'game', label: '🎵 Rhyme/Game' });
  } else if (focus === 'maths') {
    const extraMathsTopic = pickUnused(progress.maths.topics_pool, [...progress.maths.topics_covered, mathsTopic]);
    const extraMaths = MATHS_SCENARIOS[extraMathsTopic] || { name: "More Maths", scenario: '"Let\'s practice more numbers!"', activity: `Practice: ${extraMathsTopic.replace(/-/g, ' ')}`, answer: "Maths skills" };
    activities.push({ ...extraMaths, type: 'maths', label: '🔢 Maths' });
    progress.maths.topics_covered.push(extraMathsTopic);
    const game2 = pickUniqueScenario(GAME_SCENARIOS.filter(g => g !== gameAct), recentHashes);
    activities.push({ ...game2, type: 'game', label: '🔢 Number Game' });
  } else {
    const extraReadTopic = pickUnused(progress.reading.topics_pool, [...progress.reading.topics_covered, readingTopic]);
    const extraRead = READING_SCENARIOS[extraReadTopic] || { name: "More Reading", scenario: '"Let\'s keep reading!"', activity: `Focus: ${extraReadTopic.replace(/-/g, ' ')}`, answer: "Reading skills" };
    activities.push({ ...extraRead, type: 'reading', label: '📖 Reading' });
    progress.reading.topics_covered.push(extraReadTopic);
    const game2 = pickUniqueScenario(GAME_SCENARIOS.filter(g => g !== gameAct), recentHashes);
    activities.push({ ...game2, type: 'game', label: '🎵 Rhyme/Game' });
  }

  // ── Pick worksheet ────────────────────────────────────────────────────

  const worksheetPool = WORKSHEET_LINKS[focus];
  const usedUrls = progress.worksheets_assigned;
  let worksheet = worksheetPool.find(w => !usedUrls.includes(w.url)) || worksheetPool[0];

  // ── Pick 5 Brain Quest Questions ──────────────────────────────────────

  const usedBqIndexes = progress.brain_quest_used || [];
  const brainQuestions = [];
  const availableBq = BRAIN_QUEST_POOL.map((q, i) => ({ ...q, idx: i }))
    .filter(q => !usedBqIndexes.includes(q.idx));
  
  // Pick 5 from different categories if possible
  const categories = [...new Set(availableBq.map(q => q.category))];
  const pickedCategories = new Set();
  
  while (brainQuestions.length < 5 && availableBq.length > 0) {
    // Prefer unpicked categories first
    let candidates = availableBq.filter(q => !pickedCategories.has(q.category));
    if (candidates.length === 0) candidates = availableBq;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    brainQuestions.push(pick);
    pickedCategories.add(pick.category);
    availableBq.splice(availableBq.indexOf(pick), 1);
  }

  // If we ran out of unused questions, reset and pick random
  if (brainQuestions.length < 5) {
    const remaining = 5 - brainQuestions.length;
    for (let i = 0; i < remaining; i++) {
      brainQuestions.push(BRAIN_QUEST_POOL[Math.floor(Math.random() * BRAIN_QUEST_POOL.length)]);
    }
  }

  // ── Build Markdown ────────────────────────────────────────────────────

  let md = `## 📚 Day ${day} — Little Learner Lesson Plan\n\n`;
  md += `**Focus:** ${focus} | **Letter of the Day:** ${letter} | **Book:** ${book} | **Duration:** 20 minutes\n\n`;
  md += `---\n\n`;
  md += `### Teaching Steps\n`;
  md += `1. **Letter Sounds** — Practice the "${letter}" sound\n`;
  md += `2. **Maths** — ${mathsTopic.replace(/-/g, ' ')}\n`;
  md += `3. **Reading** — ${readingTopic.replace(/-/g, ' ')} with "${book}"\n\n`;
  md += `### Activities (6 × ~3 min each = 20 min)\n\n`;

  activities.forEach((act, i) => {
    md += `#### ${i + 1}. ${act.label} ${act.name}\n`;
    md += `**Scenario:** ${act.scenario}\n\n`;
    md += `**Activity:** ${act.activity}\n\n`;
    md += `**Answer:** ${act.answer}\n\n`;
  });

  md += `### 📝 Today's Worksheet\n`;
  md += `**[${worksheet.title}](${worksheet.url})**\n\n`;
  md += `---\n\n`;
  md += `### 🧠 Brain Quest — Daily 5 Questions\n\n`;
  md += `*Read each question to your child. Celebrate every answer — even silly ones!*\n\n`;
  brainQuestions.forEach((bq, i) => {
    md += `**Q${i + 1}.** ${bq.q}\n`;
    md += `<details><summary>Show Answer</summary>${bq.a}</details>\n\n`;
  });
  md += `---\n\n`;
  md += `### 📊 Progress So Far\n`;
  md += `- **Letters covered:** ${[...progress.phonics.letters_covered, letter].join(', ') || 'Starting today!'}\n`;
  md += `- **Maths topics:** ${progress.maths.topics_covered.length + 1} of ${progress.maths.topics_pool.length}\n`;
  md += `- **Reading skills:** ${progress.reading.topics_covered.length + 1} of ${progress.reading.topics_pool.length}\n`;
  md += `- **Books read:** ${[...progress.reading.books_read, book].length}\n`;
  md += `- **Brain Quest questions answered:** ${(progress.brain_quest_used || []).length + brainQuestions.length} of ${BRAIN_QUEST_POOL.length}\n`;
  md += `\n---\n*Generated by Little Learner Planner 🎓*\n`;

  const title = `📚 Day ${day} Lesson Plan — Focus: ${focus} | Letter: ${letter}`;
  const labels = `lesson-plan,${focus}`;

  // Write outputs for the workflow
  fs.writeFileSync('/tmp/lesson-plan.md', md);
  fs.writeFileSync('/tmp/lesson-title.txt', title);
  fs.writeFileSync('/tmp/lesson-labels.txt', labels);
  fs.writeFileSync('/tmp/lesson-day.txt', day.toString());

  // ── Update progress.json ──────────────────────────────────────────────

  // Phonics: mark letter covered, advance index every 3 days
  if (!progress.phonics.letters_covered.includes(letter)) {
    progress.phonics.letters_covered.push(letter);
  }
  if (day % 3 === 0 && progress.phonics.current_index < progress.phonics.progression.length - 1) {
    progress.phonics.current_index += 1;
  }

  // Maths: mark topic covered
  if (!progress.maths.topics_covered.includes(mathsTopic)) {
    progress.maths.topics_covered.push(mathsTopic);
  }

  // Reading: mark topic and book
  if (!progress.reading.topics_covered.includes(readingTopic)) {
    progress.reading.topics_covered.push(readingTopic);
  }
  if (!progress.reading.books_read.includes(book)) {
    progress.reading.books_read.push(book);
  }

  // Worksheets assigned
  if (!progress.worksheets_assigned.includes(worksheet.url)) {
    progress.worksheets_assigned.push(worksheet.url);
  }

  // Track scenario hashes for dedup
  activities.forEach(a => {
    const hash = scenarioHash(a.scenario);
    progress.activities_used.all_scenarios_hashes.push(hash);
  });
  // Keep sliding window of last 5 days' scenarios
  progress.activities_used.scenarios_used_last_5_days = progress.activities_used.all_scenarios_hashes.slice(-30);

  // Brain Quest: track used question indexes
  if (!progress.brain_quest_used) progress.brain_quest_used = [];
  brainQuestions.forEach(bq => {
    if (bq.idx !== undefined && !progress.brain_quest_used.includes(bq.idx)) {
      progress.brain_quest_used.push(bq.idx);
    }
  });
  // Reset when all questions used
  if (progress.brain_quest_used.length >= BRAIN_QUEST_POOL.length) {
    progress.brain_quest_used = [];
  }

  // History entry
  progress.history.push({
    day,
    date: new Date().toISOString().split('T')[0],
    focus,
    letter,
    maths_topic: mathsTopic,
    reading_topic: readingTopic,
    book,
    worksheet: worksheet.url,
  });

  // Save
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));

  console.log(`✅ Day ${day} plan generated — Focus: ${focus}, Letter: ${letter}, Book: ${book}`);
}

main();
