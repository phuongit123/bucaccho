import { useState, useEffect, useCallback, useRef } from 'react';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type Position = { x: number; y: number };
export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameState = 'idle' | 'playing' | 'paused' | 'gameover';

const GRID_SIZE = 20;
const SPEEDS: Record<Difficulty, number> = {
  easy: 150,
  medium: 100,
  hard: 60,
};

const INITIAL_SNAKE: Position[] = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];

function getRandomFood(snake: Position[]): Position {
  let food: Position;
  do {
    food = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some((seg) => seg.x === food.x && seg.y === food.y));
  return food;
}

function getHighScore(difficulty: Difficulty): number {
  const stored = localStorage.getItem(`snake-highscore-${difficulty}`);
  return stored ? parseInt(stored, 10) : 0;
}

function setHighScore(difficulty: Difficulty, score: number): void {
  localStorage.setItem(`snake-highscore-${difficulty}`, score.toString());
}

export function useSnakeGame() {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Position>(() => getRandomFood(INITIAL_SNAKE));
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [highScore, setHighScoreState] = useState(() => getHighScore('medium'));
  const [justAte, setJustAte] = useState(false);

  const directionRef = useRef<Direction>('RIGHT');
  const gameStateRef = useRef<GameState>('idle');
  const snakeRef = useRef<Position[]>(INITIAL_SNAKE);
  const foodRef = useRef<Position>(food);
  const scoreRef = useRef(0);
  const lastDirectionRef = useRef<Direction>('RIGHT');

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    snakeRef.current = snake;
  }, [snake]);

  useEffect(() => {
    foodRef.current = food;
  }, [food]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const resetGame = useCallback(() => {
    const initialSnake = [...INITIAL_SNAKE];
    setSnake(initialSnake);
    setFood(getRandomFood(initialSnake));
    setDirection('RIGHT');
    setScore(0);
    setGameState('playing');
    setJustAte(false);
    directionRef.current = 'RIGHT';
    lastDirectionRef.current = 'RIGHT';
    snakeRef.current = initialSnake;
    scoreRef.current = 0;
  }, []);

  const changeDirection = useCallback((newDir: Direction) => {
    const opposites: Record<Direction, Direction> = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT',
    };
    if (opposites[newDir] !== lastDirectionRef.current) {
      setDirection(newDir);
      directionRef.current = newDir;
    }
  }, []);

  const togglePause = useCallback(() => {
    if (gameStateRef.current === 'playing') {
      setGameState('paused');
    } else if (gameStateRef.current === 'paused') {
      setGameState('playing');
    }
  }, []);

  const changeDifficulty = useCallback((newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    setHighScoreState(getHighScore(newDifficulty));
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      const currentSnake = snakeRef.current;
      const currentDirection = directionRef.current;
      const currentFood = foodRef.current;

      const head = { ...currentSnake[0] };

      switch (currentDirection) {
        case 'UP':
          head.y -= 1;
          break;
        case 'DOWN':
          head.y += 1;
          break;
        case 'LEFT':
          head.x -= 1;
          break;
        case 'RIGHT':
          head.x += 1;
          break;
      }

      // Check wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameState('gameover');
        const currentScore = scoreRef.current;
        const currentHigh = getHighScore(difficulty);
        if (currentScore > currentHigh) {
          setHighScore(difficulty, currentScore);
          setHighScoreState(currentScore);
        }
        return;
      }

      // Check self collision
      if (currentSnake.some((seg) => seg.x === head.x && seg.y === head.y)) {
        setGameState('gameover');
        const currentScore = scoreRef.current;
        const currentHigh = getHighScore(difficulty);
        if (currentScore > currentHigh) {
          setHighScore(difficulty, currentScore);
          setHighScoreState(currentScore);
        }
        return;
      }

      lastDirectionRef.current = currentDirection;

      const newSnake = [head, ...currentSnake];

      // Check food collision
      if (head.x === currentFood.x && head.y === currentFood.y) {
        const newScore = scoreRef.current + 1;
        setScore(newScore);
        scoreRef.current = newScore;
        const newFood = getRandomFood(newSnake);
        setFood(newFood);
        foodRef.current = newFood;
        setJustAte(true);
        setTimeout(() => setJustAte(false), 300);
      } else {
        newSnake.pop();
      }

      setSnake(newSnake);
      snakeRef.current = newSnake;
    }, SPEEDS[difficulty]);

    return () => clearInterval(interval);
  }, [gameState, difficulty]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStateRef.current === 'idle') {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', ' '].includes(e.key)) {
          e.preventDefault();
          resetGame();
          return;
        }
      }

      if (e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        if (gameStateRef.current === 'gameover') {
          resetGame();
        } else {
          togglePause();
        }
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        resetGame();
        return;
      }

      if (gameStateRef.current !== 'playing') return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          changeDirection('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          changeDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          changeDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          changeDirection('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeDirection, togglePause, resetGame]);

  return {
    snake,
    food,
    direction,
    gameState,
    score,
    difficulty,
    highScore,
    justAte,
    gridSize: GRID_SIZE,
    resetGame,
    changeDirection,
    togglePause,
    changeDifficulty,
  };
}
