# Minnesota Wild Goal Tracker

A live dashboard tracking every Minnesota Wild goal in the 2025-26 NHL season. Built with React + Vite, pulling data directly from the NHL API.

## Features

- **Live Data**: Fetches play-by-play data from the NHL API for every completed Wild game
- **Goal Details**: Player, period, exact time, shots on goal, assists, opponent
- **Team Overview**: Scoring leaders bar chart, goals by period, goals by month, timing distribution heatmap
- **Player Cards**: Click any player to see their individual goal timing patterns and full goal log
- **Full Goal Log**: Searchable, sortable, filterable table of every goal
- **CSV Export**: Download the full dataset as a spreadsheet
- **Responsive**: Works on desktop and mobile

## Data Source

All data is fetched live from `api-web.nhle.com` (the public NHL API). The app pulls:
1. The Wild's full season schedule
2. Play-by-play data for each completed game
3. Extracts all Minnesota Wild goals with timing, scorer, assists, and shot data

## Setup

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/wild-goals-dashboard.git
cd wild-goals-dashboard

# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

## Deploy to Vercel

### Option 1: Vercel CLI
```bash
npm i -g vercel
vercel
```

### Option 2: GitHub Integration
1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Vercel auto-detects Vite and deploys

**Build Settings** (auto-detected):
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

## Tech Stack

- **React 18** — UI framework
- **Vite 5** — Build tool
- **Recharts** — Charts and visualizations
- **NHL API** — Live data source (no API key needed)

## Project Structure

```
src/
├── api/
│   └── nhlApi.js          # NHL API client & data extraction
├── components/
│   ├── TeamOverview.jsx   # Charts: leaders, period, monthly, timing
│   ├── PlayerGrid.jsx     # Expandable player cards with mini-charts
│   └── GoalLog.jsx        # Full searchable/sortable goal table
├── utils/
│   └── dataProcessing.js  # Data grouping, aggregation, CSV export
├── App.jsx                # Main app with tabs & header
├── main.jsx               # Entry point
└── index.css              # Wild-themed dark styling
```
