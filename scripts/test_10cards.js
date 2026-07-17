require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { generateQuoteCard } = require('../src/utils/imageGenerator');

const testQuotes = [
  { id: 1,  title: "Daily Motivation",  quote: "The secret of getting ahead is getting started.", subtitle: "Stop waiting for the perfect moment and take action today." },
  { id: 2,  title: "Life Lesson",       quote: "You don't have to be great to start, but you have to start to be great.", subtitle: "Every expert was once a beginner." },
  { id: 3,  title: "Mindset",           quote: "Your only limit is the one you set yourself.", subtitle: "Break the walls you built in your own mind." },
  { id: 4,  title: "Success",           quote: "Success is not final, failure is not fatal. It is the courage to continue that counts.", subtitle: "" },
  { id: 5,  title: "Discipline",        quote: "We are what we repeatedly do. Excellence is not an act, but a habit.", subtitle: "Build habits that build you." },
  { id: 6,  title: "Resilience",        quote: "The harder the battle, the sweeter the victory.", subtitle: "Every struggle is shaping your strength." },
  { id: 7,  title: "Focus",             quote: "Don't watch the clock. Do what it does — keep going.", subtitle: "Time rewards those who stay consistent." },
  { id: 8,  title: "Growth",            quote: "Comfort is the enemy of progress.", subtitle: "Step outside your comfort zone every single day." },
  { id: 9,  title: "Purpose",           quote: "The two most important days in your life are the day you are born and the day you find out why.", subtitle: "" },
  { id: 10, title: "Courage",           quote: "It always seems impossible until it's done.", subtitle: "Dare to begin. The rest will follow." },
];

const outDir = path.join(__dirname, '../test_cards');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

(async () => {
  for (const q of testQuotes) {
    console.log(`Generating card ${q.id}...`);
    const buffer = await generateQuoteCard(q);
    fs.writeFileSync(path.join(outDir, `card_${q.id}.png`), buffer);
  }
  console.log('Done! All 10 cards saved to test_cards/');
})();
