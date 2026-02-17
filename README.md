# 🎓 Little Learner Planner

> An AI-powered daily lesson plan generator for toddlers (ages 3–4), covering **reading, phonics, and maths** in fun 20-minute sessions.

## ✨ What It Does

Every day, your little one gets a personalized lesson plan with **6 hands-on activities** using household items — no special materials needed!

### Sample Lesson Plan

**Title:** Fun with Phonics, Maths, and Reading for 3-Year-Olds

| # | Activity | Type |
|---|----------|------|
| 1 | 🔤 Letter Sounds | "Let's learn the sound of the letter 'S'. Imagine a snake hissing!" |
| 2 | 🔢 Counting & Addition | "How many fingers on one hand? If I give you 2 more blocks..." |
| 3 | 📖 Storytime | "Let's read 'The Three Little Pigs'. How many pigs were there?" |
| 4 | 🎮 Phonics Game | "I Spy with my Little Eye — something that starts with 'B'!" |
| 5 | 🔢 Number Hunt | "Find 3 toys and 2 books. How many items did you find?" |
| 6 | 🎵 Rhyming Words | "What rhymes with 'Cat'? Bat! Hat! Mat!" |

Plus a **free downloadable worksheet** link with every plan! 📝

## 🚀 Two Ways to Use

### 1. 🗣️ Copilot Chat Agent

Talk to the agent directly in GitHub Copilot Chat:

```
@little-learner-planner Generate today's lesson plan
```

```
@little-learner-planner My child is struggling with counting. Give me a maths-focused plan.
```

```
@little-learner-planner We covered letters S, A, T last week. What's next?
```

### 2. 📅 Daily GitHub Issue (Automated)

A GitHub Action runs every morning at **6:00 AM UTC** and creates an issue with the day's lesson plan. You can also trigger it manually:

1. Go to **Actions** → **📚 Daily Lesson Plan**
2. Click **Run workflow**
3. Optionally set a day number or focus topic

### Using the Prompt File

You can also use the reusable prompt in any Copilot Chat:

1. Open Copilot Chat
2. Type `/` and select the **lesson-plan** prompt
3. Get a full 20-minute lesson plan instantly

## 📚 Curriculum

The agent follows a structured curriculum designed for 3–4 year olds:

| Subject | Progression |
|---------|-------------|
| **Phonics** | Letter sounds (S→A→T→P→I→N first) → blending → CVC words |
| **Maths** | Counting 1-10 → shapes → patterns → basic addition |
| **Reading** | Book handling → print awareness → comprehension → vocabulary |

See the full curriculum guides in [`curriculum/`](./curriculum/).

## 📝 Free Worksheets

Every lesson plan includes links to free, high-quality worksheets from:
- [K5 Learning](https://www.k5learning.com/free-preschool-kindergarten-worksheets) (100% free)
- [Worksheet Fun](https://www.worksheetfun.com/category/preschool/) (100% free)
- [Education.com](https://www.education.com/worksheets/preschool/) (3 free/month)
- [Teachers Pay Teachers](https://www.teacherspayteachers.com/Browse/Price-Range/Free/PreK) (many free)

Full list: [`resources/worksheet-sources.md`](./resources/worksheet-sources.md)

## 🗂️ Repository Structure

```
little-learner-planner/
├── .github/
│   ├── copilot-instructions.md       # Agent personality & behavior
│   ├── workflows/
│   │   └── daily-lesson.yml          # Automated daily lesson issue
│   └── prompts/
│       └── lesson-plan.prompt.md     # Reusable Copilot prompt
├── AGENTS.md                          # Agent definition & rules
├── README.md                          # This file
├── curriculum/
│   ├── reading.md                     # Reading milestones & books
│   ├── phonics.md                     # Phonics progression
│   └── maths.md                       # Maths concepts
└── resources/
    └── worksheet-sources.md           # Curated free worksheet links
```

## 🛠️ Setup

1. **Create the repo** on GitHub under your org
2. **Push this code** to the repo
3. **Enable GitHub Actions** (Settings → Actions → General → Allow all actions)
4. **Create labels** in Issues: `lesson-plan`, `reading`, `phonics`, `maths`
5. The daily workflow will start creating lesson plan issues automatically!

### Adjust the Schedule

Edit `.github/workflows/daily-lesson.yml` to change the time:

```yaml
# Current: 6:00 AM UTC
- cron: '0 6 * * *'

# Example: 7:00 AM IST (1:30 AM UTC)
- cron: '30 1 * * *'

# Example: 8:00 AM EST (1:00 PM UTC)
- cron: '0 13 * * *'
```

## 💡 Tips for Parents

- **Be consistent** — 20 minutes at the same time each day works best
- **Follow your child's lead** — If they love counting, do more maths activities
- **Celebrate effort** — Every attempt deserves praise, not just correct answers
- **Make it physical** — Use real objects, move around, be silly!
- **Repeat favorites** — Kids learn through repetition; it's okay to redo activities they love

## 📄 License

MIT
