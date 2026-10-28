import { useRef, useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSnakeGame, Direction, Difficulty } from './hooks/useSnakeGame';

function App() {
  const {
    snake,
    food,
    gameState,
    score,
    difficulty,
    highScore,
    justAte,
    gridSize,
    resetGame,
    changeDirection,
    togglePause,
    changeDifficulty,
  } = useSnakeGame();

  const boardRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [cellSize, setCellSize] = useState(20);

  // Responsive cell size
  useEffect(() => {
    const updateSize = () => {
      const maxWidth = Math.min(window.innerWidth - 32, 500);
      const maxHeight = Math.min(window.innerHeight - 280, 500);
      const size = Math.floor(Math.min(maxWidth, maxHeight) / gridSize);
      setCellSize(Math.max(size, 12));
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [gridSize]);

  // Touch controls
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const minSwipe = 30;

      if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) {
        // Tap - toggle pause or start
        if (gameState === 'idle' || gameState === 'gameover') {
          resetGame();
        } else {
          togglePause();
        }
        touchStartRef.current = null;
        return;
      }

      if (gameState === 'idle' || gameState === 'gameover') {
        resetGame();
      }

      let dir: Direction;
      if (Math.abs(dx) > Math.abs(dy)) {
        dir = dx > 0 ? 'RIGHT' : 'LEFT';
      } else {
        dir = dy > 0 ? 'DOWN' : 'UP';
      }
      changeDirection(dir);
      touchStartRef.current = null;
    },
    [gameState, resetGame, togglePause, changeDirection]
  );

  const boardSize = cellSize * gridSize;

  const difficulties: { key: Difficulty; label: string; emoji: string }[] = [
    { key: 'easy', label: 'Easy', emoji: '🐢' },
    { key: 'medium', label: 'Medium', emoji: '🐍' },
    { key: 'hard', label: 'Hard', emoji: '⚡' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-4 select-none overflow-hidden">
      {/* Header */}
      <div className="w-full max-w-lg mb-4">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300 mb-3">
          🐍 Snake Game
        </h1>

        {/* Score Bar */}
        <div className="flex justify-between items-center bg-gray-800/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-gray-700/50">
          <div className="text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Score</div>
            <motion.div
              key={score}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className="text-2xl font-bold text-white"
            >
              {score}
            </motion.div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Best</div>
            <div className="text-2xl font-bold text-yellow-400">
              {highScore}
              {highScore > 0 && <span className="text-xs ml-1">👑</span>}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Length</div>
            <div className="text-2xl font-bold text-green-400">{snake.length}</div>
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div
        ref={boardRef}
        className="relative rounded-2xl overflow-hidden shadow-2xl shadow-green-900/20 border-2 border-gray-700/50"
        style={{ width: boardSize, height: boardSize }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Grid background */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
            `,
            backgroundSize: `${cellSize}px ${cellSize}px`,
            backgroundColor: '#1a1a2e',
          }}
        />

        {/* Food */}
        <motion.div
          key={`${food.x}-${food.y}`}
          initial={{ scale: 0, rotate: 0 }}
          animate={{ scale: 1, rotate: 360 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="absolute rounded-full"
          style={{
            left: food.x * cellSize,
            top: food.y * cellSize,
            width: cellSize,
            height: cellSize,
            padding: 2,
          }}
        >
          <div className="w-full h-full rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-lg shadow-red-500/50 flex items-center justify-center">
            <span style={{ fontSize: cellSize * 0.6 }}>🍎</span>
          </div>
        </motion.div>

        {/* Snake */}
        {snake.map((segment, index) => {
          const isHead = index === 0;
          const isTail = index === snake.length - 1;
          return (
            <motion.div
              key={`${segment.x}-${segment.y}-${index}`}
              initial={isHead ? { scale: 0.8 } : {}}
              animate={{
                scale: isHead && justAte ? 1.2 : 1,
              }}
              transition={{ duration: 0.15 }}
              className="absolute"
              style={{
                left: segment.x * cellSize,
                top: segment.y * cellSize,
                width: cellSize,
                height: cellSize,
                padding: isHead ? 0 : 1,
                zIndex: snake.length - index,
              }}
            >
              <div
                className={`w-full h-full rounded-md ${
                  isHead
                    ? 'bg-gradient-to-br from-green-300 to-green-500 shadow-lg shadow-green-500/40'
                    : isTail
                    ? 'bg-gradient-to-br from-green-600 to-green-700'
                    : 'bg-gradient-to-br from-green-400 to-green-600'
                } ${isHead ? 'rounded-lg' : 'rounded-sm'}`}
                style={{
                  opacity: isHead ? 1 : Math.max(0.5, 1 - index * 0.02),
                }}
              >
                {isHead && (
                  <div className="w-full h-full flex items-center justify-center">
                    <span style={{ fontSize: cellSize * 0.55 }}>
                      {gameState === 'gameover' ? '💀' : '👀'}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Overlays */}
        <AnimatePresence>
          {gameState === 'idle' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-50"
            >
              <motion.div
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                className="text-center px-6"
              >
                <div className="text-6xl mb-4">🐍</div>
                <h2 className="text-2xl font-bold text-white mb-2">Ready to Play?</h2>
                <p className="text-gray-300 text-sm mb-4">
                  Use arrow keys, WASD, or swipe to move
                </p>
                <button
                  onClick={resetGame}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-400 hover:to-emerald-500 transition-all shadow-lg shadow-green-500/30 active:scale-95"
                >
                  Start Game
                </button>
                <p className="text-gray-500 text-xs mt-3">or press any arrow key</p>
              </motion.div>
            </motion.div>
          )}

          {gameState === 'paused' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-center"
              >
                <div className="text-5xl mb-3">⏸️</div>
                <h2 className="text-2xl font-bold text-white mb-4">Paused</h2>
                <button
                  onClick={togglePause}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:from-blue-400 hover:to-blue-500 transition-all shadow-lg shadow-blue-500/30 active:scale-95"
                >
                  Resume
                </button>
                <p className="text-gray-500 text-xs mt-3">Press Space or tap to resume</p>
              </motion.div>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50"
            >
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center px-6"
              >
                <div className="text-5xl mb-3">💀</div>
                <h2 className="text-2xl font-bold text-red-400 mb-1">Game Over!</h2>
                <p className="text-4xl font-bold text-white mb-1">{score}</p>
                <p className="text-gray-400 text-sm mb-1">points</p>
                {score >= highScore && score > 0 && (
                  <motion.p
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                    className="text-yellow-400 font-bold mb-3"
                  >
                    🎉 New High Score! 🎉
                  </motion.p>
                )}
                <button
                  onClick={resetGame}
                  className="mt-3 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-400 hover:to-emerald-500 transition-all shadow-lg shadow-green-500/30 active:scale-95"
                >
                  Play Again
                </button>
                <p className="text-gray-500 text-xs mt-3">Press Space or R to restart</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="w-full max-w-lg mt-4 space-y-3">
        {/* Action Buttons */}
        <div className="flex gap-2 justify-center">
          {gameState === 'playing' && (
            <button
              onClick={togglePause}
              className="px-4 py-2 bg-gray-700/80 text-white rounded-lg hover:bg-gray-600 transition-colors border border-gray-600/50 active:scale-95"
            >
              ⏸️ Pause
            </button>
          )}
          {(gameState === 'playing' || gameState === 'paused') && (
            <button
              onClick={resetGame}
              className="px-4 py-2 bg-gray-700/80 text-white rounded-lg hover:bg-gray-600 transition-colors border border-gray-600/50 active:scale-95"
            >
              🔄 Restart
            </button>
          )}
        </div>

        {/* Difficulty Selector */}
        <div className="flex justify-center gap-2">
          {difficulties.map((d) => (
            <button
              key={d.key}
              onClick={() => changeDifficulty(d.key)}
              disabled={gameState === 'playing' || gameState === 'paused'}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all active:scale-95 ${
                difficulty === d.key
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/20'
                  : 'bg-gray-700/60 text-gray-300 hover:bg-gray-600/80 border border-gray-600/50'
              } ${
                gameState === 'playing' || gameState === 'paused'
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              <span className="mr-1">{d.emoji}</span>
              {d.label}
            </button>
          ))}
        </div>

        {/* Mobile D-Pad */}
        <div className="flex justify-center md:hidden mt-2">
          <div className="grid grid-cols-3 gap-1 w-36">
            <div />
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                if (gameState === 'idle' || gameState === 'gameover') resetGame();
                changeDirection('UP');
              }}
              className="w-12 h-12 bg-gray-700/80 rounded-lg flex items-center justify-center text-xl text-white active:bg-gray-600 border border-gray-600/50"
            >
              ▲
            </button>
            <div />
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                if (gameState === 'idle' || gameState === 'gameover') resetGame();
                changeDirection('LEFT');
              }}
              className="w-12 h-12 bg-gray-700/80 rounded-lg flex items-center justify-center text-xl text-white active:bg-gray-600 border border-gray-600/50"
            >
              ◀
            </button>
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                if (gameState === 'playing') togglePause();
                else resetGame();
              }}
              className="w-12 h-12 bg-gray-700/80 rounded-lg flex items-center justify-center text-xs text-white active:bg-gray-600 border border-gray-600/50"
            >
              {gameState === 'playing' ? '⏸' : '▶'}
            </button>
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                if (gameState === 'idle' || gameState === 'gameover') resetGame();
                changeDirection('RIGHT');
              }}
              className="w-12 h-12 bg-gray-700/80 rounded-lg flex items-center justify-center text-xl text-white active:bg-gray-600 border border-gray-600/50"
            >
              ▶
            </button>
            <div />
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                if (gameState === 'idle' || gameState === 'gameover') resetGame();
                changeDirection('DOWN');
              }}
              className="w-12 h-12 bg-gray-700/80 rounded-lg flex items-center justify-center text-xl text-white active:bg-gray-600 border border-gray-600/50"
            >
              ▼
            </button>
            <div />
          </div>
        </div>

        {/* Instructions */}
        <p className="text-center text-gray-500 text-xs hidden md:block">
          Arrow Keys / WASD to move • Space to pause • R to restart
        </p>
      </div>
    </div>
  );
}

export default App;
