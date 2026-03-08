// Parse "YYYY-MM-DD" without timezone shift
function parseGameDate(dateStr) {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function groupGoalsByPlayer(goals) {
  const players = {};
  for (const goal of goals) {
    if (!players[goal.player]) {
      players[goal.player] = {
        name: goal.player,
        playerId: goal.playerId,
        goals: [],
        totalGoals: 0,
        periods: { '1': 0, '2': 0, '3': 0, 'OT': 0 },
      };
    }
    players[goal.player].goals.push(goal);
    players[goal.player].totalGoals++;
    const pKey = goal.period.includes('OT') ? 'OT' : goal.period;
    if (players[goal.player].periods[pKey] !== undefined) {
      players[goal.player].periods[pKey]++;
    }
  }
  
  return Object.values(players).sort((a, b) => b.totalGoals - a.totalGoals);
}

export function getGoalTimingDistribution(goals) {
  // Divide each period into 4 5-minute buckets
  const buckets = [];
  const periods = ['1', '2', '3'];
  
  for (const p of periods) {
    for (let i = 0; i < 4; i++) {
      const start = i * 5;
      const end = (i + 1) * 5;
      const label = `P${p} ${start}-${end}`;
      const count = goals.filter(g => {
        const pKey = g.period.includes('OT') ? 'OT' : g.period;
        if (pKey !== p) return false;
        const mins = Math.floor(g.timeSeconds / 60);
        return mins >= start && mins < end;
      }).length;
      buckets.push({ label, period: p, bucket: `${start}-${end}`, count });
    }
  }
  
  // OT bucket
  const otCount = goals.filter(g => g.period.includes('OT')).length;
  if (otCount > 0) {
    buckets.push({ label: 'OT', period: 'OT', bucket: '0-5', count: otCount });
  }
  
  return buckets;
}

export function getGoalsByMonth(goals) {
  const months = {};
  for (const goal of goals) {
    const date = parseGameDate(goal.gameDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (!months[key]) {
      months[key] = { month: key, label, count: 0 };
    }
    months[key].count++;
  }
  return Object.values(months).sort((a, b) => a.month.localeCompare(b.month));
}

export function getGoalsByPeriod(goals) {
  const periods = { '1st': 0, '2nd': 0, '3rd': 0, 'OT': 0 };
  for (const goal of goals) {
    if (goal.period.includes('OT')) {
      periods['OT']++;
    } else if (goal.period === '1') {
      periods['1st']++;
    } else if (goal.period === '2') {
      periods['2nd']++;
    } else if (goal.period === '3') {
      periods['3rd']++;
    }
  }
  return Object.entries(periods).map(([period, count]) => ({ period, count }));
}

export function getPlayerTimeline(playerGoals) {
  return playerGoals.map((goal, idx) => ({
    goalNum: idx + 1,
    date: parseGameDate(goal.gameDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    opponent: goal.opponent,
    period: goal.period,
    time: goal.time,
    isHome: goal.isHome,
    totalSOG: goal.totalSOG,
  }));
}

export { parseGameDate };

export function exportToCSV(goals) {
  const headers = ['Player', 'Period', 'Time', 'Date', 'Opponent', 'Home/Away', 'Total SOG', 'Assist 1', 'Assist 2'];
  const rows = goals.map(g => [
    g.player,
    g.period,
    g.time,
    g.gameDate,
    g.opponent,
    g.isHome ? 'Home' : 'Away',
    g.totalSOG,
    g.assist1 || '',
    g.assist2 || ''
  ]);
  
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'wild_goals_2025-26.csv';
  a.click();
  URL.revokeObjectURL(url);
}
