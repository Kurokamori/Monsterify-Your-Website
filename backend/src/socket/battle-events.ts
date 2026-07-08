import { io } from './chat.socket';

/**
 * Notify everyone watching a battle room that the battle state changed.
 * Clients respond by refetching GET /battle/:id/state.
 */
export function emitBattleUpdate(battleId: number, event: string = 'update'): void {
  try {
    if (io) {
      io.to(`battle:${battleId}`).emit('battle:update', { battle_id: battleId, event });
    }
  } catch (err) {
    console.error('[Socket.IO] emitBattleUpdate error:', err);
  }
}

/**
 * Notify a specific user (all their sockets) that they received a PvP challenge.
 */
export function emitBattleChallenge(battleId: number, challengerName: string): void {
  try {
    if (io) {
      io.emit('battle:challenge', { battle_id: battleId, challenger_name: challengerName });
    }
  } catch (err) {
    console.error('[Socket.IO] emitBattleChallenge error:', err);
  }
}
