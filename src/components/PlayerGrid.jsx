import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, ScatterChart, Scatter, ZAxis } from 'recharts';
import { getPlayerTimeline, parseGameDate } from '../utils/dataProcessing';

const COLORS = {
  green: '#154734',
  greenLight: '#1d6b4d',
  red: '#a6192e',
  gold: '#edaa00',
  cream: '#efecd6',
  muted: '#5a7363',
  p1: '#1d6b4d',
  p2: '#a6192e',
  p3: '#edaa00',
  pOT: '#7c3aed',
};

const tooltipStyle = {
  backgroundColor: '#111a15',
  border: '1px solid #1e3028',
  borderRadius: '6px',
  color: '#e8e6d8',
  fontSize: '0.8rem',
};

export default function PlayerGrid({ players, allGoals, onSelectPlayer, selectedPlayer }) {
  const [expandedPlayer, setExpandedPlayer] = useState(null);

  function toggleExpand(name) {
    setExpandedPlayer(expandedPlayer === name ? null : name);
  }

  return (
    <div className="player-grid">
      {players.map(player => {
        const isExpanded = expandedPlayer === player.name;
        const timeline = getPlayerTimeline(player.goals);
        
        // Build timing chart: when in the game this player scores
        const timingBuckets = [];
        for (let p = 1; p <= 3; p++) {
          for (let b = 0; b < 4; b++) {
            const start = b * 5;
            const end = (b + 1) * 5;
            const count = player.goals.filter(g => {
              const pKey = g.period.includes('OT') ? 'OT' : g.period;
              if (pKey !== String(p)) return false;
              const mins = Math.floor(g.timeSeconds / 60);
              return mins >= start && mins < end;
            }).length;
            timingBuckets.push({ label: `P${p} ${start}-${end}`, period: String(p), count });
          }
        }
        const otGoals = player.goals.filter(g => g.period.includes('OT')).length;
        if (otGoals > 0) {
          timingBuckets.push({ label: 'OT', period: 'OT', count: otGoals });
        }

        return (
          <div
            key={player.name}
            className={`player-card ${isExpanded ? 'expanded' : ''}`}
            onClick={() => toggleExpand(player.name)}
          >
            <div className="player-card-header">
              <div className="player-name">{player.name}</div>
              <div className="player-number">{player.totalGoals}G</div>
            </div>
            
            <div className="player-stats-row">
              <div className="player-stat">
                <div className="player-stat-val">{player.periods['1']}</div>
                <div className="player-stat-label">1st Period</div>
              </div>
              <div className="player-stat">
                <div className="player-stat-val">{player.periods['2']}</div>
                <div className="player-stat-label">2nd Period</div>
              </div>
              <div className="player-stat">
                <div className="player-stat-val">{player.periods['3']}</div>
                <div className="player-stat-label">3rd Period</div>
              </div>
              {player.periods['OT'] > 0 && (
                <div className="player-stat">
                  <div className="player-stat-val">{player.periods['OT']}</div>
                  <div className="player-stat-label">OT</div>
                </div>
              )}
              <div className="player-stat" style={{ marginLeft: 'auto' }}>
                <div className="player-stat-val" style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                  {player.goals.filter(g => g.isHome).length}H / {player.goals.filter(g => !g.isHome).length}A
                </div>
                <div className="player-stat-label">Home / Away</div>
              </div>
            </div>

            {/* Mini timing chart always visible */}
            <div className="player-chart">
              <ResponsiveContainer width="100%" height={isExpanded ? 180 : 80}>
                <BarChart data={timingBuckets} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                  {isExpanded && (
                    <>
                      <XAxis dataKey="label" tick={{ fill: COLORS.muted, fontSize: 9 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={40} />
                      <YAxis tick={{ fill: COLORS.muted, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} width={25} />
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e3028" vertical={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                    </>
                  )}
                  <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                    {timingBuckets.map((entry, i) => {
                      const colorMap = { '1': COLORS.p1, '2': COLORS.p2, '3': COLORS.p3, 'OT': COLORS.pOT };
                      return <Cell key={i} fill={colorMap[entry.period] || COLORS.greenLight} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Expanded: show goal log */}
            {isExpanded && (
              <div style={{ padding: '0 1rem 1rem' }} onClick={e => e.stopPropagation()}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.5rem', fontFamily: 'Barlow Condensed', fontWeight: 600 }}>
                  Goal Log
                </div>
                <div className="goal-table-wrap" style={{ maxHeight: '300px', overflow: 'auto' }}>
                  <table className="goal-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Date</th>
                        <th>Opponent</th>
                        <th>Period</th>
                        <th>Time</th>
                        <th>SOG</th>
                      </tr>
                    </thead>
                    <tbody>
                      {player.goals.map((goal, i) => {
                        const periodClass = goal.period.includes('OT') ? 'period-OT' : `period-${goal.period}`;
                        return (
                          <tr key={i}>
                            <td>{i + 1}</td>
                            <td>{parseGameDate(goal.gameDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                            <td>{goal.isHome ? 'vs' : '@'} {goal.opponent}</td>
                            <td><span className={`period-badge ${periodClass}`}>{goal.period === '1' ? '1st' : goal.period === '2' ? '2nd' : goal.period === '3' ? '3rd' : goal.period}</span></td>
                            <td>{goal.time}</td>
                            <td>{goal.totalSOG}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <button
                  className="filter-btn"
                  style={{ marginTop: '0.75rem' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPlayer(player.name);
                  }}
                >
                  {selectedPlayer === player.name ? 'Clear Filter' : 'Filter Dashboard to Player'}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
