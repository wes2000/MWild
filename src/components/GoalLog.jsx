import { useState, useMemo } from 'react';
import { parseGameDate } from '../utils/dataProcessing';

export default function GoalLog({ goals, onExport }) {
  const [sortBy, setSortBy] = useState('date-desc');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [searchText, setSearchText] = useState('');

  const filtered = useMemo(() => {
    let result = [...goals];
    
    if (periodFilter !== 'all') {
      if (periodFilter === 'OT') {
        result = result.filter(g => g.period.includes('OT'));
      } else {
        result = result.filter(g => g.period === periodFilter);
      }
    }
    
    if (searchText) {
      const q = searchText.toLowerCase();
      result = result.filter(g =>
        g.player.toLowerCase().includes(q) ||
        g.opponent.toLowerCase().includes(q)
      );
    }
    
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc': return parseGameDate(b.gameDate) - parseGameDate(a.gameDate);
        case 'date-asc': return parseGameDate(a.gameDate) - parseGameDate(b.gameDate);
        case 'player': return a.player.localeCompare(b.player);
        case 'period': return a.periodNum - b.periodNum || a.timeSeconds - b.timeSeconds;
        default: return 0;
      }
    });
    
    return result;
  }, [goals, sortBy, periodFilter, searchText]);

  return (
    <div>
      {/* Controls */}
      <div className="filter-bar" style={{ alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search player or opponent..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{
            fontFamily: 'Barlow',
            fontSize: '0.85rem',
            padding: '0.5rem 0.75rem',
            background: 'var(--bg-dark)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            color: 'var(--text-primary)',
            outline: 'none',
            minWidth: '200px',
          }}
        />
        
        <select
          value={periodFilter}
          onChange={e => setPeriodFilter(e.target.value)}
          style={{
            fontFamily: 'Barlow Condensed',
            fontSize: '0.85rem',
            padding: '0.5rem 0.75rem',
            background: 'var(--bg-dark)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        >
          <option value="all">All Periods</option>
          <option value="1">1st Period</option>
          <option value="2">2nd Period</option>
          <option value="3">3rd Period</option>
          <option value="OT">Overtime</option>
        </select>
        
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{
            fontFamily: 'Barlow Condensed',
            fontSize: '0.85rem',
            padding: '0.5rem 0.75rem',
            background: 'var(--bg-dark)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        >
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="player">By Player</option>
          <option value="period">By Period/Time</option>
        </select>
        
        <button className="filter-btn" onClick={onExport} style={{ marginLeft: 'auto' }}>
          ↓ Export CSV
        </button>
        
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          {filtered.length} goals
        </span>
      </div>

      {/* Table */}
      <div className="chart-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="goal-table-wrap" style={{ maxHeight: '70vh', overflow: 'auto' }}>
          <table className="goal-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Player</th>
                <th>Period</th>
                <th>Time</th>
                <th>Opponent</th>
                <th>H/A</th>
                <th>SOG</th>
                <th>Assists</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((goal, i) => {
                const periodClass = goal.period.includes('OT') ? 'period-OT' : `period-${goal.period}`;
                const periodLabel = goal.period === '1' ? '1st' : goal.period === '2' ? '2nd' : goal.period === '3' ? '3rd' : goal.period;
                const assists = [goal.assist1, goal.assist2].filter(Boolean).join(', ');
                
                return (
                  <tr key={i}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td>{parseGameDate(goal.gameDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="player-col">{goal.player}</td>
                    <td><span className={`period-badge ${periodClass}`}>{periodLabel}</span></td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>{goal.time}</td>
                    <td>{goal.opponent}</td>
                    <td>{goal.isHome ? 'Home' : 'Away'}</td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>{goal.totalSOG}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{assists || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
