import { GameState, calculateHuScore } from '../engine/MahjongLogic'

interface GameEndModalProps {
  gameState: GameState;
  currentUser: string;
  onReturnToLobby: () => void;
}

export default function GameEndModal({ gameState, currentUser, onReturnToLobby }: GameEndModalProps) {
  if (gameState.status !== 'finished') return null;

  const winner = gameState.players.find(p => p.status === 'hu');
  const discarderId = gameState.lastAction?.type === 'discard' ? gameState.lastAction.playerId : null;
  const isSelfDrawn = !discarderId || discarderId === winner?.id;

  const losers = gameState.players
    .filter(p => p.id !== winner?.id)
    .map(p => p.id);

  // Simple calculation for display based on logic
  const scoreChanges = winner 
    ? calculateHuScore(
        winner.id, 
        isSelfDrawn ? losers : [discarderId || losers[0]], 
        gameState.mode, 
        gameState.baseMultiplier, 
        isSelfDrawn
      )
    : {};

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl transform animate-fade-in text-center">
        <h2 className="text-4xl font-bold mb-2 text-primary">
          {winner ? '对局结束' : '流局 (平局)'}
        </h2>
        
        {winner && (
          <div className="my-6">
            <div className="text-6xl mb-4">{winner.avatar}</div>
            <div className="text-2xl font-bold mb-1">{winner.name} 胡啦！</div>
            <div className="text-gray-500 text-sm">{isSelfDrawn ? '自摸' : '点炮'}</div>
            
            <div className="mt-8 space-y-3">
               {gameState.players.map(p => {
                 const change = scoreChanges[p.id] || 0;
                 if (change === 0 && p.id !== winner.id) return null; // Didn't participate in points (e.g. un-involved player in point-pao)
                 
                 return (
                   <div key={p.id} className={`flex justify-between items-center p-3 rounded-lg ${change > 0 ? 'bg-green-50' : change < 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-2">
                        <span>{p.avatar}</span>
                        <span className="font-semibold">{p.name} {p.id === currentUser ? '(你)' : ''}</span>
                      </div>
                      <div className={`font-bold ${change > 0 ? 'text-green-600' : 'text-red-500'}`}>
                         {change > 0 ? '+' : ''}{change} 豆
                      </div>
                   </div>
                 )
               })}
            </div>
          </div>
        )}

        <button 
           onClick={onReturnToLobby}
           className="mt-8 btn-primary w-full py-4 text-xl rounded-xl"
        >
          返回大厅
        </button>
      </div>
    </div>
  )
}
