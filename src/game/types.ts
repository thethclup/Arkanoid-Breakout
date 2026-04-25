export enum BrickType {
  STANDARD,
  REINFORCED,
  INDESTRUCTIBLE,
  EXPLOSIVE,
  MOVING,
  GHOST,
  MULTIPLIER,
  WARP
}

export enum PowerUpType {
  MULTI_BALL = 'M',
  LASER = 'L',
  EXPAND = 'E',
  SHRINK = 'S',
  CATCH = 'C',
  SLOW = 'D',
  SPEED = 'F',
  BOMB = 'B',
  SHIELD = 'P',
  EXTRA_LIFE = '+'
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Brick extends Rect {
  id: string;
  type: BrickType;
  hp: number;
  color: string;
  vx?: number;
  vy?: number;
  startX?: number;
  startY?: number;
  multiplier?: number;
  isGhostVisible?: boolean;
  ghostTimer?: number;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  speed: number;
  caught: boolean;
  caughtOffset: number;
  trail?: { x: number, y: number }[];
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface Paddle extends Rect {
  vx: number;
  targetX: number;
  widthMultiplier: number;
}

export interface Capsule extends Rect {
  type: PowerUpType;
  vy: number;
  color: string;
  rotation: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Laser extends Rect {
  vy: number;
}

export interface GameState {
  status: 'start' | 'playing' | 'paused' | 'levelTransition' | 'gameOver' | 'victory';
  score: number;
  lives: number;
  level: number;
  bricksDestroyed: number;
  activePowerUps: { type: PowerUpType; timer: number }[];
  shieldActive: boolean;
  shieldTimer: number;
  bossHp?: number;
  bossMaxHp?: number;
}
