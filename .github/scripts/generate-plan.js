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
    { name: "S Song Time", scenario: '"Sing with me: Sammy Snake says sss-sss-sss! Can you sing along?"', activity: "Sing a silly S song together. Clap every time you hear the S sound. Then draw a big S and decorate it with star stickers.", answer: "S sound through music" },
    { name: "Sticky S Collage", scenario: '"Let\'s make a letter S from stickers and scraps! How many S things can we stick?"', activity: "Draw a large S on paper. Glue on small items starting with S (sequins, string, small stickers). Say each S word.", answer: "Letter S craft and vocabulary" },
  ],
  A: [
    { name: "Ant March", scenario: '"A-a-a! The ants are marching! Can you march like an ant and say a-a-a?"', activity: "March around while saying the short A sound. Find things that start with A (apple, arm, ant).", answer: "A says a-a-a (short a)" },
    { name: "A is for Apple", scenario: '"Let\'s find the a-a-apple letter! Where is the letter A hiding?"', activity: "Look through a picture book and point to every letter A you see. Count how many you find!", answer: "Spotting letter A" },
    { name: "Alligator A", scenario: '"A-a-alligator! Open your arms wide like an alligator mouth and snap — a-a-a!"', activity: "Make alligator snapping arms while saying the A sound. Draw an alligator that looks like the letter A. Find 3 A things around the house.", answer: "A sound with movement" },
    { name: "A Treasure Box", scenario: '"Let\'s fill a treasure box with things that start with a-a-a!"', activity: "Find a box or bag. Walk around collecting items starting with A (apple, acorn toy, animal figure). Say the A sound for each.", answer: "A vocabulary collection" },
  ],
  T: [
    { name: "Ticking Clock", scenario: '"T-t-t! Can you hear the clock going t-t-t? Let\'s be ticking clocks!"', activity: "Tap on the table making the T sound. Find 3 things starting with T (table, teddy, towel). Trace T in sand/salt.", answer: "T says t-t-t" },
    { name: "T Toast Time", scenario: '"T-t-t-toast! What sound does T make? Let\'s find T things in the kitchen!"', activity: "Walk to the kitchen. Find items starting with T (tea, tin, tap). Practice writing T with a crayon.", answer: "T objects and letter formation" },
    { name: "Tiger T Stomp", scenario: '"T-t-t-TIGER! Stomp like a tiger and roar the T sound!"', activity: "Stomp around the room like a tiger, saying t-t-t with each step. Use paint to make T-shaped tiger stripes on paper.", answer: "T sound with body movement" },
    { name: "T Tape Letters", scenario: '"Let\'s build a giant T on the floor with tape! Can you walk along it?"', activity: "Use masking tape to make a big T on the floor. Walk along it saying t-t-t. Place toy T items (truck, train, turtle) next to it.", answer: "T letter formation — large scale" },
  ],
  P: [
    { name: "Popping Bubbles", scenario: '"P-p-p-pop! Let\'s pop pretend bubbles! Every pop starts with P!"', activity: "Pretend to pop bubbles saying P-p-p. Find things starting with P (pen, plate, pillow). Clap for each P item found.", answer: "P says p-p-p" },
    { name: "Pirate P Hunt", scenario: '"Arrr! Pirate Pete is looking for things that start with P-p-p!"', activity: "Put on a pretend pirate hat. Search the room for P treasures (pillow, paper, puzzle, pencil). Mark an X on a map for each.", answer: "P vocabulary through play" },
    { name: "P Paint Party", scenario: '"Let\'s finger-paint the letter P! P-p-p-paint!"', activity: "Use finger paint to write the letter P. Then paint pictures of P words (purple, pizza, penguin). Say the P sound as you paint.", answer: "P letter formation and art" },
    { name: "Puppet P Show", scenario: '"P-p-puppet show! Let\'s make a puppet and practice P sounds!"', activity: "Make a simple sock puppet. Have the puppet only say P words. Practice: pen, pig, pan, pot, pea. The puppet eats pretend pizza!", answer: "P sound through puppet play" },
  ],
  I: [
    { name: "Itchy Insect", scenario: '"I-i-i, imagine an itchy insect! Can you scratch and say i-i-i?"', activity: "Wiggle and scratch like an itchy insect saying the short I sound. Find I words (in, it, if). Trace I on paper.", answer: "I says i-i-i (short i)" },
    { name: "I is Inside", scenario: '"I-i-i — what\'s INSIDE the box? Let\'s look inside and say i-i-i!"', activity: "Hide small toys in a box. Open it saying i-i-inside! Find items starting with I (ice, ink). Trace I with a finger in the air.", answer: "I sound exploration" },
    { name: "Inchworm I", scenario: '"I-i-inchworm! Let\'s inch along the floor like a tiny worm saying i-i-i!"', activity: "Crawl on your tummy like an inchworm saying the I sound. Measure things in 'inches' with your finger. Draw the letter I tall and straight.", answer: "I sound with movement" },
  ],
  N: [
    { name: "Noisy Engine", scenario: '"Nnnn-nnnn! Your nose makes the N sound! Hum like an engine — nnnn!"', activity: "Hum the N sound with your hand on your nose to feel the vibration. Find N items (nose, nut, napkin).", answer: "N says nnn" },
    { name: "N Necklace", scenario: '"Let\'s make a N-n-necklace! Thread the beads and say nnnn!"', activity: "String cereal or beads on yarn to make a necklace. Say N words with each bead: nine, nose, nest, net, nap. Trace N on paper.", answer: "N sound with fine motor craft" },
    { name: "Night Sky N", scenario: '"N-n-night! When it\'s dark, the N-n-night sky has stars! Let\'s make one!"', activity: "Draw a night sky on dark paper with star stickers. Write the letter N with a white crayon. Find 3 N things (napkin, noodle, number).", answer: "N vocabulary and letter craft" },
  ],
  M: [
    { name: "Yummy M Sound", scenario: '"Mmmmm, yummy! When we eat something tasty we say mmmmm. That\'s the M sound!"', activity: "Rub your tummy and say mmmmm. Find M objects (milk, mug, mat). Trace M with finger paint or crayon.", answer: "M says mmm" },
    { name: "Monster M Stomp", scenario: '"M-m-monster! Stomp like a friendly monster and say mmmmm!"', activity: "Stomp around the room like a monster saying mmm. Build the letter M with blocks or sticks. Find M items (moon, mouse, map).", answer: "M sound with body movement" },
    { name: "M Mirror Game", scenario: '"M-m-mirror! Look in the mirror and watch your mouth make the mmm sound!"', activity: "Look in a mirror together. Watch lips close for mmm. Make M faces. Draw the letter M and decorate with magazine M pictures.", answer: "M sound awareness" },
  ],
  D: [
    { name: "Drum Beat", scenario: '"D-d-d like a drum! Let\'s bang our drums and make the D sound!"', activity: "Use pots as drums, tap while saying d-d-d. Find D items (door, doll, duck). Practice writing D.", answer: "D says d-d-d" },
    { name: "Dinosaur D Dig", scenario: '"D-d-dinosaur! Let\'s dig for dinosaur bones and say d-d-d!"', activity: "Hide toy dinosaurs in a sand box or rice bin. Dig them out saying d-d-d! Count the dinosaurs. Trace the letter D in the sand.", answer: "D sound through sensory play" },
    { name: "Dancing D", scenario: '"D-d-dance! Every time you hear a D word, do a silly dance!"', activity: "Say words — dance when it starts with D (dog, cat, duck, ball, drum, tree, door). Draw a big D and fill it with dance poses.", answer: "D sound recognition game" },
  ],
  G: [
    { name: "Goofy Gorilla", scenario: '"G-g-gorilla! Beat your chest like a gorilla and say g-g-g!"', activity: "Beat your chest like a gorilla saying g-g-g. Find G items (glass, grape, glove). Trace G with finger paint.", answer: "G says g-g-g" },
    { name: "G Garden Game", scenario: '"Let\'s grow a G-g-garden! What G things can we plant?"', activity: "Pretend to plant a garden. Dig, plant 'grapes' and 'green beans'. Say the G sound for each item. Draw the letter G like a garden.", answer: "G vocabulary through pretend play" },
    { name: "G Glitter Letter", scenario: '"G-g-glitter! Let\'s make a sparkly letter G!"', activity: "Draw a big G on paper. Spread glue on it and sprinkle glitter. While it dries, find 3 G objects (gate, game, gift).", answer: "G letter formation craft" },
  ],
  O: [
    { name: "O-O-Octopus", scenario: '"O-o-octopus! Make a round O with your mouth — oooo!"', activity: "Make your mouth into an O shape. Wiggle your arms like an octopus saying o-o-o. Find round O-shaped objects (orange, oval mirror).", answer: "O says o-o-o (short o)" },
    { name: "O Olympics", scenario: '"O-o-Olympics! The Olympic rings are all Os! Let\'s make Os!"', activity: "Draw 5 circles (Olympic rings). Inside each, draw an O word (orange, owl, otter, onion, ox). Say the O sound for each.", answer: "O sound and letter formation" },
    { name: "Over and Out O", scenario: '"O-o-over! Jump OVER the pillow and shout O-O-O!"', activity: "Set up pillows to jump over. Say o-o-over with each jump! Then trace the letter O — it's a big round circle. Find O in books.", answer: "O sound with gross motor play" },
  ],
  C: [
    { name: "Cat C Crawl", scenario: '"C-c-cat! Crawl like a cat and purr c-c-c!"', activity: "Crawl around like a cat saying c-c-c. Find C items (cup, car, coat, cookie). Trace the letter C — it's like a half circle.", answer: "C says c-c-c (hard c)" },
    { name: "C Cookie Bake", scenario: '"C-c-cookie! Let\'s pretend to bake C-c-cookies!"', activity: "Pretend to mix cookie dough. Make C-shaped cookies from playdough. Say C words while you 'bake': cake, candle, carrot.", answer: "C sound through pretend cooking" },
    { name: "C Clapping Game", scenario: '"Clap-clap-c-c-c! Clap when you hear a word that starts with C!"', activity: "Say mixed words — clap only for C words (cat, dog, car, ball, cup, hat, cow). Then write C with crayon and color it in.", answer: "C sound discrimination" },
  ],
  K: [
    { name: "Kangaroo K Jump", scenario: '"K-k-kangaroo! Jump like a kangaroo and say k-k-k!"', activity: "Jump around like a kangaroo saying k-k-k. Find K items (key, kite, king). Notice K and C can sound the same!", answer: "K says k-k-k" },
    { name: "K Key Hunt", scenario: '"K-k-key! Let\'s find all the keys in the house! K-k-k!"', activity: "Go on a key hunt. Count how many keys you find. Trace the letter K with sticks or straws. Say K words: kite, kick, kitchen.", answer: "K vocabulary hunt" },
    { name: "King K Crown", scenario: '"K-k-king! Let\'s make a crown fit for a King or Queen K!"', activity: "Make a paper crown and write K on it. Wear the crown and rule the K kingdom. Find 3 K things to put in your kingdom.", answer: "K sound craft activity" },
  ],
  E: [
    { name: "Elephant E Stomp", scenario: '"E-e-elephant! Stomp your big elephant feet and say e-e-e!"', activity: "Stomp like an elephant saying the short E sound. Find E items (egg, elbow, envelope). Trace E with 3 horizontal lines.", answer: "E says e-e-e (short e)" },
    { name: "E Egg Hunt", scenario: '"E-e-egg! Let\'s hide eggs around the room and find them!"', activity: "Hide plastic eggs. Find each one and say an E word: egg, elf, eleven, end. Count all the eggs at the end.", answer: "E vocabulary through egg hunt" },
    { name: "E Exercise", scenario: '"E-e-exercise! Let\'s do E-e-exercises! Every move starts with E!"', activity: "Do exercises: extend arms, elevate legs, everyone jump! Say the E sound with each move. Write E in the air with your body.", answer: "E sound with physical activity" },
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
  "number-recognition-7-10": { name: "Number Detectives 7-10", scenario: '"Big numbers now! Can you find the number 8? It looks like a snowman!"', activity: "Write 7, 8, 9, 10 on cards. Play 'show me the number'. Count out matching objects. Arrange in order from smallest to biggest.", answer: "Recognizing 7, 8, 9, 10" },
  "shape-hunt": { name: "Shape Safari", scenario: '"Let\'s go on a Shape Safari! How many different shapes can we find around the house?"', activity: "Walk around with a clipboard. Find and name shapes everywhere — clock (circle), window (square), door (rectangle). Draw each one.", answer: "Shapes found in the environment" },
  "sorting-by-shape": { name: "Shape Sort Box", scenario: '"All the circles go here, all the squares go there! Can you sort them?"', activity: "Cut out paper shapes (circles, squares, triangles). Sort them into groups. Count each group. Which shape do you have the most of?", answer: "Groups sorted by shape" },
  "patterns-AABB": { name: "Double Pattern", scenario: '"Clap clap, stomp stomp, clap clap, stomp stomp! What comes next?"', activity: "Make AABB patterns with actions (clap-clap-stomp-stomp). Then try with colored blocks (red-red-blue-blue). Let child continue the pattern.", answer: "The pattern repeats: A, A, B, B..." },
  "big-small-comparison": { name: "Big and Small Show", scenario: '"Which is BIGGER — the ball or the marble? Let\'s compare!"', activity: "Collect pairs of objects (big cup/small cup, big book/small book). Compare sizes using words: bigger, smaller, taller, shorter.", answer: "Comparing sizes of objects" },
  "tall-short-comparison": { name: "Tall and Short", scenario: '"Stand up tall! Now crouch down small! Who is taller — you or teddy?"', activity: "Measure yourself against furniture and toys. Line up 3 toys from shortest to tallest. Use words: tall, taller, tallest, short.", answer: "Height comparisons" },
  "ordering-by-size": { name: "Size Line-Up", scenario: '"Let\'s put these from teeny-tiny to great-big! Which one goes first?"', activity: "Line up 5 toys or objects from smallest to largest. Then try largest to smallest. Use words: first, second, third, last.", answer: "Ordering objects by size" },
  "subtraction-with-objects": { name: "Take Away Game", scenario: '"You have 5 crackers. You eat 2 — yum! How many are left?"', activity: "Start with 5 objects. Take some away and count what's left. 5-1=4, 5-2=3, 4-1=3. Use snacks for extra motivation!", answer: "Taking away and counting what remains" },
  "number-bonds-to-5": { name: "Number Buddies", scenario: '"5 is made of 2 and 3! They\'re number buddies. Can you find more buddies that make 5?"', activity: "Use 5 blocks in two colors. Split them: 1+4, 2+3, 3+2, 4+1. Show each combo. Draw the number bonds.", answer: "Pairs that make 5" },
  "story-problems": { name: "Story Sums", scenario: '"3 ducks swimming, 1 more joins. How many ducks now? Let\'s act it out!"', activity: "Act out simple addition/subtraction stories with toys. Make up your own stories. Let the child be the storyteller too!", answer: "Solving word problems with manipulatives" },
  "counting-to-15": { name: "Count to 15", scenario: '"Can you count all the way to 15? Let\'s try! Touch each object as we count!"', activity: "Line up 15 small objects (pasta, buttons, coins). Touch each one as you count. Try counting backwards from 10!", answer: "Counting to 15 with one-to-one correspondence" },
  "counting-to-20": { name: "Count to 20", scenario: '"20 is a BIG number! Let\'s count to 20 together — use your fingers twice!"', activity: "Count to 20 with fingers (10 + 10). Count 20 steps walking. Count 20 objects in a line. Sing a counting-to-20 song.", answer: "Counting to 20" },
  "number-writing-1-5": { name: "Number Writing 1-5", scenario: '"Let\'s write the numbers! 1 is just a straight line down. Easy!"', activity: "Trace numbers 1-5 on paper. Say each number as you write. Try writing in sand, with finger paint, or with a crayon.", answer: "Forming numerals 1-5" },
  "number-writing-6-10": { name: "Number Writing 6-10", scenario: '"Number 6 has a curly tail! 8 is like a snowman! Let\'s write them!"', activity: "Trace numbers 6-10. Use descriptions: 6 has a curly tail, 7 has a hat, 8 is a snowman, 9 is 6 upside down, 10 is 1 and 0.", answer: "Forming numerals 6-10" },
  "more-or-less": { name: "More or Less", scenario: '"I have 3 crackers and you have 5. Who has MORE?"', activity: "Make two groups of objects. Ask which has more, which has less. Try with different amounts. Use words: more, less, same.", answer: "Comparing quantities" },
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
  "turning-pages": { name: "Page Turner Pro", scenario: '"Can you turn the page gently? One... two... turn! You\'re a Page Turner Pro!"', activity: "Practice turning pages one at a time. Count the pages as you go. Point to pictures on each page and name what you see.", answer: "Page turning and counting" },
  "point-to-words": { name: "Word Pointer", scenario: '"See these squiggly lines? Those are WORDS! Let\'s point to each word as we read!"', activity: "Read slowly, pointing to each word. Let the child try pointing too. Notice that words go left to right, top to bottom.", answer: "Print tracking — left to right, top to bottom" },
  "find-letters-in-name": { name: "Name Letter Hunt", scenario: '"Your name has special letters! Let\'s go on a hunt for them in this book!"', activity: "Write the child's name. Circle each letter. Open a book and search for those same letters. High-five for each one found!", answer: "Identifying letters from own name in text" },
  "print-awareness": { name: "Words Everywhere", scenario: '"Look — there are words on the cereal box! Words on the door! Words are EVERYWHERE!"', activity: "Walk around the house finding words on everyday items — cereal box, milk carton, shampoo bottle. Point and read them together.", answer: "Environmental print awareness" },
  "predict-what-happens-next": { name: "What Happens Next?", scenario: '"The cat is climbing up the tree! What do you think will happen NEXT?"', activity: "Pause mid-story and ask the child to predict what comes next. Accept all answers! Then read to see. Were they right?", answer: "Making story predictions" },
  "new-vocabulary-words": { name: "Big Word Explorer", scenario: '"Ooh, a big new word! \'Enormous\' — that means really, really BIG!"', activity: "Choose 2-3 interesting words from today's book. Explain each one. Act them out. Use them in silly sentences.", answer: "Learning new vocabulary in context" },
  "picture-dictionary": { name: "My Picture Dictionary", scenario: '"Let\'s make a picture dictionary! What does \'brave\' look like?"', activity: "Pick 3 new words. For each, draw a picture showing what it means. Label each picture. Review your growing dictionary!", answer: "Visual vocabulary building" },
  "retell-with-toys": { name: "Toy Theatre", scenario: '"Let\'s act out the story with your toys! Which toy will be the main character?"', activity: "Choose toys to represent story characters. Act out the story scene by scene. Let the child direct the toy theatre!", answer: "Story comprehension through dramatic play" },
  "make-a-book": { name: "My Own Book", scenario: '"Let\'s make YOUR very own book! What story do you want to tell?"', activity: "Fold paper to make a mini book. Child draws pictures, you help write simple words. Read the finished book together!", answer: "Book creation — author and illustrator" },
  "repetition-in-stories": { name: "Story Patterns", scenario: '"This book says the same thing again and again! Can you say it with me?"', activity: "Read a book with repeated phrases. After a few pages, pause and let the child fill in the repeated words. Cheer when they do!", answer: "Recognizing and joining in with repeated text" },
  "favorite-book-revisit": { name: "Old Friend Book", scenario: '"Let\'s read your FAVORITE book again! What do you love about this story?"', activity: "Re-read a beloved book. This time, let the child 'read' parts they remember. Talk about why they love it.", answer: "Building fluency through re-reading favorites" },
  "feelings-in-stories": { name: "Feelings Detective", scenario: '"How does the character FEEL? Look at their face — are they happy or sad?"', activity: "Look at character faces in illustrations. Name the emotions: happy, sad, scared, surprised, angry. Ask 'have you felt like that?'", answer: "Identifying emotions in characters" },
};

const GAME_SCENARIOS = [
  { name: "I Spy Sounds", type: "game", scenario: '"I spy with my little eye, something that starts with the sound..."', activity: "Play I Spy using beginning letter sounds (not letter names). Take turns. Give clues if the child is stuck.", answer: "Objects matching the target sound" },
  { name: "Sound Jump", type: "game", scenario: '"I\'m going to say some words. Jump when you hear one that starts with our letter!"', activity: "Say a mix of words. Child jumps when they hear one starting with today's letter. Speed up for more fun!", answer: "Jumping on correct sound" },
  { name: "Rhyme Chain", type: "game", scenario: '"Cat! What rhymes with cat? Bat! What rhymes with bat?"', activity: "Start a rhyme chain. Take turns saying rhyming words. It's OK to use silly made-up words! See how long the chain gets.", answer: "Rhyming words (real and silly)" },
  { name: "Number Freeze Dance", type: "game", scenario: '"Dance, dance, dance... FREEZE! Show me 4 fingers!"', activity: "Play music (or sing). When it stops, call out a number. Child must freeze and show that many fingers.", answer: "Matching numbers to finger count" },
  { name: "Scavenger Hunt", type: "game", scenario: '"Can you find something RED? Now find something that starts with B!"', activity: "Give the child a hunt: find 1 red thing, 2 soft things, 3 things that start with a letter. Count the findings together.", answer: "Items matching the hunt criteria" },
  { name: "Silly Sentences", type: "game", scenario: '"Sam the snake sings songs on Saturdays! Can you make a silly sentence with S?"', activity: "Make alliterative silly sentences with today's letter. The sillier the better! Draw a picture of the silly sentence.", answer: "Alliterative silly sentences" },
  { name: "Letter Bowling", type: "game", scenario: '"Let\'s knock down the letter pins! Roll the ball and say the sound!"', activity: "Set up paper cups with letters on them. Roll a ball to knock them down. Say the letter sound for each cup you hit.", answer: "Letter sounds through bowling" },
  { name: "Shape Bingo", type: "game", scenario: '"BINGO! Can you find a circle on your bingo card?"', activity: "Draw a simple 2x2 bingo card with shapes. Call out shapes — child covers them with a coin. First to cover all wins!", answer: "Shape recognition" },
  { name: "Musical Letters", type: "game", scenario: '"Walk around the letters... when the music stops, stand on one and tell me its sound!"', activity: "Place letter cards on the floor. Walk/dance around them. When you clap, child stops and says the sound of the nearest letter.", answer: "Letter sound recognition" },
  { name: "Color Mixing Magic", type: "game", scenario: '"What happens when we mix blue and yellow? Let\'s find out!"', activity: "Use finger paints or food coloring in water. Mix two colors and guess what you'll get. Try: red+yellow, blue+yellow, red+blue.", answer: "Color mixing: orange, green, purple" },
  { name: "Memory Match", type: "game", scenario: '"Let\'s play the memory game! Can you remember where the matching card is?"', activity: "Place 6 cards face down (3 pairs of letters or shapes). Take turns flipping 2 cards. If they match, keep them! Say the letter sound.", answer: "Visual memory and letter/shape recognition" },
  { name: "Body Letters", type: "game", scenario: '"Can you make the letter T with your body? Stand up tall and stretch your arms out!"', activity: "Make letters using your body. Try I (stand straight), T (arms out), O (arms in a circle), C (curve to the side). Take photos!", answer: "Letter formation with whole body" },
  { name: "Counting Stomp", type: "game", scenario: '"Stomp 3 times! Now stomp 5 times! Can you stomp the right number?"', activity: "Call out a number, child stomps that many times. Then switch — child calls, parent stomps. Try clapping and jumping too.", answer: "Number-to-action correspondence" },
  { name: "Story Dice", type: "game", scenario: '"Let\'s roll our story dice and make up a silly story together!"', activity: "Draw simple pictures on paper squares (dog, house, tree, star, hat, fish). Pick 3 randomly and make up a silly story using all three.", answer: "Creative storytelling with prompts" },
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

// Free online books with direct links (no purchase needed)
const ONLINE_BOOKS = [
  { title: "Stellaluna", url: "https://storylineonline.net/books/stellaluna/", source: "Storyline Online (video read-aloud)" },
  { title: "Enemy Pie", url: "https://storylineonline.net/books/enemy-pie/", source: "Storyline Online (video read-aloud)" },
  { title: "Clark the Shark", url: "https://storylineonline.net/books/clark-the-shark/", source: "Storyline Online (video read-aloud)" },
  { title: "A Bad Case of Stripes", url: "https://storylineonline.net/books/a-bad-case-of-stripes/", source: "Storyline Online (video read-aloud)" },
  { title: "Library Lion", url: "https://storylineonline.net/books/library-lion/", source: "Storyline Online (video read-aloud)" },
  { title: "Carla's Sandwich", url: "https://storylineonline.net/books/carlas-sandwich/", source: "Storyline Online (video read-aloud)" },
  { title: "Brave Irene", url: "https://storylineonline.net/books/brave-irene/", source: "Storyline Online (video read-aloud)" },
  { title: "Chester's Way", url: "https://storylineonline.net/books/chesters-way/", source: "Storyline Online (video read-aloud)" },
  { title: "Animals in Winter", url: "https://www.uniteforliteracy.com/unite/animals/book?BookId=1586", source: "Unite for Literacy (read online)" },
  { title: "My Body", url: "https://www.uniteforliteracy.com/unite/body/book?BookId=36", source: "Unite for Literacy (read online)" },
  { title: "At the Park", url: "https://www.uniteforliteracy.com/unite/community/book?BookId=1646", source: "Unite for Literacy (read online)" },
  { title: "Colors Everywhere", url: "https://www.uniteforliteracy.com/unite/colors/book?BookId=488", source: "Unite for Literacy (read online)" },
  { title: "My Family", url: "https://www.uniteforliteracy.com/unite/families/book?BookId=155", source: "Unite for Literacy (read online)" },
  { title: "What Is Weather?", url: "https://www.uniteforliteracy.com/unite/weather/book?BookId=200", source: "Unite for Literacy (read online)" },
  { title: "1 2 3 Count With Me", url: "https://www.uniteforliteracy.com/unite/numbers/book?BookId=339", source: "Unite for Literacy (read online)" },
  { title: "Shapes Around Us", url: "https://www.uniteforliteracy.com/unite/shapes/book?BookId=1733", source: "Unite for Literacy (read online)" },
  { title: "The Little Red Hen", url: "https://www.storyberries.com/fairy-tales-the-little-red-hen/", source: "Storyberries (read online)" },
  { title: "Goldilocks and the Three Bears", url: "https://www.storyberries.com/fairy-tales-goldilocks-and-the-three-bears/", source: "Storyberries (read online)" },
  { title: "The Three Billy Goats Gruff", url: "https://www.storyberries.com/fairy-tales-the-three-billy-goats-gruff-by-katharine-pyle/", source: "Storyberries (read online)" },
  { title: "The Ugly Duckling", url: "https://www.storyberries.com/fairy-tales-the-ugly-duckling/", source: "Storyberries (read online)" },
];

function pickBook(library_unused, booksRead) {
  const unread = ONLINE_BOOKS.filter(b => !booksRead.includes(b.title));
  if (unread.length === 0) return ONLINE_BOOKS[Math.floor(Math.random() * ONLINE_BOOKS.length)];
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
  const readingAct = READING_SCENARIOS[readingTopic] || { name: "Reading Time", scenario: '"Let\'s read together!"', activity: `Focus: ${readingTopic.replace(/-/g, ' ')}. Read "${book.title}" together.`, answer: "Reading skills" };
  const enrichedReading = { ...readingAct };
  if (!enrichedReading.activity.includes(book.title)) {
    enrichedReading.activity += ` Use the book "${book.title}" for this activity.`;
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
  md += `**Focus:** ${focus} | **Letter of the Day:** ${letter} | **Duration:** 20 minutes\n\n`;
  md += `---\n\n`;
  md += `### Teaching Steps\n`;
  md += `1. **Letter Sounds** — Practice the "${letter}" sound\n`;
  md += `2. **Maths** — ${mathsTopic.replace(/-/g, ' ')}\n`;
  md += `3. **Reading** — ${readingTopic.replace(/-/g, ' ')} with "${book.title}"\n\n`;
  md += `### Activities (6 × ~3 min each = 20 min)\n\n`;

  activities.forEach((act, i) => {
    md += `#### ${i + 1}. ${act.label} ${act.name}\n`;
    md += `**Scenario:** ${act.scenario}\n\n`;
    md += `**Activity:** ${act.activity}\n\n`;
    md += `**Answer:** ${act.answer}\n\n`;
  });

  md += `### 📖 Today's Book\n`;
  md += `**[${book.title}](${book.url})** — ${book.source}\n\n`;
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
  md += `- **Books read:** ${[...progress.reading.books_read, book.title].length}\n`;
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
  // Phonics: advance to next letter every day
  if (progress.phonics.current_index < progress.phonics.progression.length - 1) {
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
  if (!progress.reading.books_read.includes(book.title)) {
    progress.reading.books_read.push(book.title);
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
    book: book.title,
    worksheet: worksheet.url,
  });

  // Save
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));

  console.log(`✅ Day ${day} plan generated — Focus: ${focus}, Letter: ${letter}, Book: ${book.title}`);
}

main();
