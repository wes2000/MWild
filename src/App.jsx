import { useState, useEffect } from 'react';
import { fetchAllWildGoals } from './api/nhlApi';
import { groupGoalsByPlayer, getGoalTimingDistribution, getGoalsByMonth, getGoalsByPeriod, exportToCSV } from './utils/dataProcessing';
import TeamOverview from './components/TeamOverview';
import PlayerGrid from './components/PlayerGrid';
import GoalLog from './components/GoalLog';

export default function App() {
  const [goals, setGoals] = useState([]);
  const [gameData, setGameData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const result = await fetchAllWildGoals((done, total) => {
        setProgress({ done, total });
      });
      setGoals(result.allGoals);
      setGameData(result.gameData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <Header goals={[]} gameData={[]} />
        <div className="loading-screen">
          <div className="loading-spinner" />
          <div className="loading-text">Loading Wild Goal Data</div>
          <div className="loading-progress">
            {progress.total > 0
              ? `Processing game ${progress.done} of ${progress.total}...`
              : 'Fetching season schedule...'}
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header goals={[]} gameData={[]} />
        <div className="loading-screen">
          <div className="loading-text" style={{ color: 'var(--wild-red)' }}>Error Loading Data</div>
          <div className="loading-progress">{error}</div>
          <button className="filter-btn" onClick={loadData} style={{ marginTop: '1rem' }}>
            Retry
          </button>
        </div>
      </>
    );
  }

  const players = groupGoalsByPlayer(goals);
  const timingData = getGoalTimingDistribution(selectedPlayer ? goals.filter(g => g.player === selectedPlayer) : goals);
  const monthlyData = getGoalsByMonth(goals);
  const periodData = getGoalsByPeriod(goals);
  const filteredGoals = selectedPlayer ? goals.filter(g => g.player === selectedPlayer) : goals;

  return (
    <>
      <Header goals={goals} gameData={gameData} />
      <main className="main">
        <div className="tabs">
          <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            Team Overview
          </button>
          <button className={`tab ${activeTab === 'players' ? 'active' : ''}`} onClick={() => setActiveTab('players')}>
            Player Cards
          </button>
          <button className={`tab ${activeTab === 'log' ? 'active' : ''}`} onClick={() => setActiveTab('log')}>
            Full Goal Log
          </button>
        </div>

        {selectedPlayer && (
          <div className="filter-bar">
            <span style={{ color: 'var(--text-secondary)', alignSelf: 'center', fontSize: '0.85rem' }}>
              Filtered to:
            </span>
            <button className="filter-btn active">{selectedPlayer}</button>
            <button className="filter-btn" onClick={() => setSelectedPlayer(null)}>
              ✕ Clear Filter
            </button>
          </div>
        )}

        {activeTab === 'overview' && (
          <TeamOverview
            goals={filteredGoals}
            players={players}
            timingData={timingData}
            monthlyData={monthlyData}
            periodData={periodData}
            onSelectPlayer={setSelectedPlayer}
            selectedPlayer={selectedPlayer}
          />
        )}

        {activeTab === 'players' && (
          <PlayerGrid
            players={players}
            allGoals={goals}
            onSelectPlayer={(name) => {
              setSelectedPlayer(name === selectedPlayer ? null : name);
            }}
            selectedPlayer={selectedPlayer}
          />
        )}

        {activeTab === 'log' && (
          <GoalLog goals={filteredGoals} onExport={() => exportToCSV(goals)} />
        )}
      </main>
    </>
  );
}

function Header({ goals, gameData }) {
  const totalGoals = goals.length;
  const uniqueScorers = new Set(goals.map(g => g.player)).size;
  const gamesPlayed = gameData.length;
  const wins = gameData.filter(g => g.wildScore > g.oppScore).length;

  return (
    <header className="header">
      <div className="header-inner">
        <h1>Minnesota <span>Wild</span> Goal Tracker</h1>
        <div className="header-stats">
          <div className="header-stat">
            <div className="header-stat-value">{totalGoals}</div>
            <div className="header-stat-label">Goals</div>
          </div>
          <div className="header-stat">
            <div className="header-stat-value">{uniqueScorers}</div>
            <div className="header-stat-label">Scorers</div>
          </div>
          <div className="header-stat">
            <div className="header-stat-value">{wins}-{gamesPlayed - wins}</div>
            <div className="header-stat-label">Record</div>
          </div>
          <div className="header-stat">
            <div className="header-stat-value">{gamesPlayed > 0 ? (totalGoals / gamesPlayed).toFixed(1) : '0'}</div>
            <div className="header-stat-label">Goals/Game</div>
          </div>
        </div>
      </div>
    </header>
  );
}
