import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';

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

export default function TeamOverview({ goals, players, timingData, monthlyData, periodData, onSelectPlayer, selectedPlayer }) {
  const topScorers = players.slice(0, 15).map(p => ({
    name: p.name.split(' ').pop(),
    fullName: p.name,
    goals: p.totalGoals,
  }));

  return (
    <div>
      {/* Scoring Leaders */}
      <div className="section">
        <div className="section-title">
          Scoring <span className="accent">Leaders</span>
        </div>
        <div className="chart-card">
          <ResponsiveContainer width="100%" height={Math.max(300, topScorers.length * 32)}>
            <BarChart data={topScorers} layout="vertical" margin={{ left: 80, right: 20, top: 5, bottom: 5 }}>
              <XAxis type="number" tick={{ fill: COLORS.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fill: COLORS.cream, fontSize: 13, fontFamily: 'Barlow Condensed' }}
                axisLine={false}
                tickLine={false}
                width={75}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(val, name, props) => [val, `${props.payload.fullName} Goals`]} />
              <Bar
                dataKey="goals"
                fill={COLORS.greenLight}
                radius={[0, 4, 4, 0]}
                cursor="pointer"
                onClick={(data) => onSelectPlayer(data.fullName === selectedPlayer ? null : data.fullName)}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Goals by Period */}
        <div className="section">
          <div className="section-title">
            Goals by <span className="accent">Period</span>
          </div>
          <div className="chart-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={periodData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="period"
                  label={({ period, count }) => `${period}: ${count}`}
                >
                  {periodData.map((entry, i) => {
                    const colors = [COLORS.p1, COLORS.p2, COLORS.p3, COLORS.pOT];
                    return <Cell key={entry.period} fill={colors[i % colors.length]} />;
                  })}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Goals by Month */}
        <div className="section">
          <div className="section-title">
            Goals by <span className="accent">Month</span>
          </div>
          <div className="chart-card">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                <XAxis dataKey="label" tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill={COLORS.gold} radius={[4, 4, 0, 0]} name="Goals" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Goal Timing Distribution */}
      <div className="section">
        <div className="section-title">
          When Goals Are <span className="accent">Scored</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'Barlow', fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: '0.5rem' }}>
            (5-minute buckets within each period)
          </span>
        </div>
        <div className="chart-card">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={timingData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3028" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: COLORS.muted, fontSize: 10 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={50} />
              <YAxis tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" name="Goals" radius={[3, 3, 0, 0]}>
                {timingData.map((entry, i) => {
                  const colorMap = { '1': COLORS.p1, '2': COLORS.p2, '3': COLORS.p3, 'OT': COLORS.pOT };
                  return <Cell key={i} fill={colorMap[entry.period] || COLORS.greenLight} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
