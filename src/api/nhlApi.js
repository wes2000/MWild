const API_BASE = '/nhl-api';
const TEAM = 'MIN';
const SEASON = '20252026';

export async function fetchSeasonSchedule() {
  // Try /now endpoint first (most reliable)
  try {
    const now = await fetch(`${API_BASE}/club-schedule-season/${TEAM}/now`);
    if (now.ok) return now.json();
  } catch (e) { /* fall through */ }
  
  // Fallback to explicit season
  const res = await fetch(`${API_BASE}/club-schedule-season/${TEAM}/${SEASON}`);
  if (!res.ok) throw new Error(`Schedule fetch failed: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function fetchPlayByPlay(gameId) {
  const res = await fetch(`${API_BASE}/gamecenter/${gameId}/play-by-play`);
  if (!res.ok) throw new Error(`Failed to fetch PBP for ${gameId}`);
  return res.json();
}

export async function fetchBoxscore(gameId) {
  const res = await fetch(`${API_BASE}/gamecenter/${gameId}/boxscore`);
  if (!res.ok) throw new Error(`Failed to fetch boxscore for ${gameId}`);
  return res.json();
}

export function extractWildGoals(pbpData) {
  const goals = [];
  const plays = pbpData.plays || [];
  const awayTeam = pbpData.awayTeam || {};
  const homeTeam = pbpData.homeTeam || {};
  
  const wildIsHome = homeTeam.abbrev === TEAM;
  const wildTeamId = wildIsHome ? homeTeam.id : awayTeam.id;
  const opponentAbbrev = wildIsHome ? awayTeam.abbrev : homeTeam.abbrev;
  
  const gameDate = pbpData.gameDate || '';
  
  // Get total shots on goal for Wild
  let wildSOG = 0;
  
  for (const play of plays) {
    // Skip shootout plays entirely
    if (play.periodDescriptor?.periodType === 'SO') continue;
    
    // Count Wild shots on goal
    if (play.typeDescKey === 'shot-on-goal' || play.typeDescKey === 'goal') {
      const eventTeamId = play.details?.eventOwnerTeamId;
      if (eventTeamId === wildTeamId) {
        wildSOG++;
      }
    }
    
    if (play.typeDescKey === 'goal') {
      const eventTeamId = play.details?.eventOwnerTeamId;
      if (eventTeamId === wildTeamId) {
        const period = play.periodDescriptor?.number || 0;
        const periodType = play.periodDescriptor?.periodType || 'REG';
        
        // Skip shootout goals — they don't count as real goals
        if (periodType === 'SO') continue;
        const timeInPeriod = play.timeInPeriod || '00:00';
        
        const scoringPlayerId = play.details?.scoringPlayerId;
        const assist1Id = play.details?.assist1PlayerId;
        const assist2Id = play.details?.assist2PlayerId;
        
        // Find player names from the roster/event data
        let scorerName = 'Unknown';
        let assist1Name = null;
        let assist2Name = null;
        
        // Try to get names from the play's players list or from roster
        if (pbpData.rosterSpots) {
          for (const spot of pbpData.rosterSpots) {
            if (spot.playerId === scoringPlayerId) {
              scorerName = `${spot.firstName?.default || ''} ${spot.lastName?.default || ''}`.trim();
            }
            if (spot.playerId === assist1Id) {
              assist1Name = `${spot.firstName?.default || ''} ${spot.lastName?.default || ''}`.trim();
            }
            if (spot.playerId === assist2Id) {
              assist2Name = `${spot.firstName?.default || ''} ${spot.lastName?.default || ''}`.trim();
            }
          }
        }
        
        let periodLabel;
        if (periodType === 'OT' || period > 3) {
          periodLabel = period === 4 ? 'OT' : `${period - 3}OT`;
        } else {
          periodLabel = `${period}`;
        }
        
        goals.push({
          player: scorerName,
          playerId: scoringPlayerId,
          period: periodLabel,
          periodNum: period,
          time: timeInPeriod,
          timeSeconds: timeToSeconds(timeInPeriod),
          gameDate,
          opponent: opponentAbbrev,
          isHome: wildIsHome,
          assist1: assist1Name,
          assist2: assist2Name,
          shotType: play.details?.shotType || '',
          strength: play.situationCode || '',
          emptyNet: play.details?.goalieInNetId === undefined,
        });
      }
    }
  }
  
  return { goals, totalSOG: wildSOG, opponent: opponentAbbrev, isHome: wildIsHome, gameDate };
}

function timeToSeconds(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  return 0;
}

export async function fetchAllWildGoals(onProgress) {
  const schedule = await fetchSeasonSchedule();
  const games = schedule.games || [];
  
  // Filter to completed regular season games only (gameType 2 = regular, 3 = playoffs)
  const completedGames = games.filter(g => 
    (g.gameState === 'OFF' || g.gameState === 'FINAL') &&
    (g.gameType === 2 || g.gameType === 3)
  );
  
  const allGoals = [];
  const gameData = [];
  let processed = 0;
  
  for (const game of completedGames) {
    try {
      const pbp = await fetchPlayByPlay(game.id);
      const result = extractWildGoals(pbp);
      
      for (const goal of result.goals) {
        goal.totalSOG = result.totalSOG;
        allGoals.push(goal);
      }
      
      gameData.push({
        gameId: game.id,
        date: result.gameDate,
        opponent: result.opponent,
        isHome: result.isHome,
        wildScore: result.isHome ? game.homeTeam?.score : game.awayTeam?.score,
        oppScore: result.isHome ? game.awayTeam?.score : game.homeTeam?.score,
        goalsScored: result.goals.length,
        totalSOG: result.totalSOG,
      });
      
      processed++;
      if (onProgress) {
        onProgress(processed, completedGames.length);
      }
      
      // Small delay to be polite to the API
      await new Promise(r => setTimeout(r, 150));
    } catch (err) {
      console.warn(`Failed to fetch game ${game.id}:`, err);
      processed++;
      if (onProgress) {
        onProgress(processed, completedGames.length);
      }
    }
  }
  
  return { allGoals, gameData, totalGames: completedGames.length };
}
