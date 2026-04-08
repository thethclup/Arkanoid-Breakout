import { Brick, BrickType } from './types';

const COLORS = {
  [BrickType.STANDARD]: '#00ffcc',
  [BrickType.REINFORCED]: '#ff00cc',
  [BrickType.INDESTRUCTIBLE]: '#666666',
  [BrickType.EXPLOSIVE]: '#ff3300',
  [BrickType.MOVING]: '#ccff00',
  [BrickType.GHOST]: '#ffffff',
  [BrickType.MULTIPLIER]: '#ffcc00',
  [BrickType.WARP]: '#9900ff'
};

export const LEVEL_NAMES = [
  "THE GRID",
  "DIAMOND CORE",
  "MOVING FORTRESS",
  "GHOST MAZE",
  "MOTHERSHIP"
];

export function getLevelName(levelNum: number): string {
  return LEVEL_NAMES[(levelNum - 1) % LEVEL_NAMES.length] || `SECTOR ${levelNum}`;
}

export function generateLevel(levelNum: number, canvasWidth: number, canvasHeight: number): Brick[] {
  const bricks: Brick[] = [];
  const cols = 14;
  const rows = 10;
  const padding = 4;
  const offsetTop = 80;
  const offsetLeft = 30;
  const w = (canvasWidth - offsetLeft * 2 - padding * (cols - 1)) / cols;
  const h = 20;

  const addBrick = (r: number, c: number, type: BrickType, hp = 1, extra: any = {}) => {
    bricks.push({
      id: `b_${r}_${c}_${Math.random()}`,
      x: offsetLeft + c * (w + padding),
      y: offsetTop + r * (h + padding),
      w, h, type, hp, color: COLORS[type], ...extra
    });
  };

  if (levelNum === 1) {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < cols; c++) {
        addBrick(r, c, BrickType.STANDARD);
      }
    }
    const wr = Math.floor(Math.random() * 5);
    const wc = Math.floor(Math.random() * cols);
    bricks.find(b => b.x === offsetLeft + wc * (w + padding) && b.y === offsetTop + wr * (h + padding))!.type = BrickType.WARP;
    bricks.find(b => b.type === BrickType.WARP)!.color = COLORS[BrickType.WARP];
  } else if (levelNum === 2) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < cols; c++) {
        const dist = Math.abs(r - 4) + Math.abs(c - 6.5);
        if (dist < 5) {
          if (dist === 0) addBrick(r, c, BrickType.INDESTRUCTIBLE, Infinity);
          else if (dist < 2) addBrick(r, c, BrickType.REINFORCED, 2);
          else addBrick(r, c, BrickType.STANDARD);
        }
      }
    }
  } else if (levelNum === 3) {
    for (let c = 4; c < 10; c++) {
      addBrick(2, c, BrickType.INDESTRUCTIBLE, Infinity);
      addBrick(6, c, BrickType.INDESTRUCTIBLE, Infinity);
    }
    for (let r = 3; r < 6; r++) {
      addBrick(r, 4, BrickType.INDESTRUCTIBLE, Infinity);
      addBrick(r, 9, BrickType.INDESTRUCTIBLE, Infinity);
      for (let c = 5; c < 9; c++) {
        addBrick(r, c, BrickType.REINFORCED, 2);
      }
    }
    addBrick(1, 1, BrickType.MOVING, 1, { vx: 2, vy: 0, startX: offsetLeft + 1 * (w + padding) });
    addBrick(7, 12, BrickType.MOVING, 1, { vx: -2, vy: 0, startX: offsetLeft + 12 * (w + padding) });
  } else if (levelNum === 4) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
          if (r !== rows - 1 || c < cols / 2) addBrick(r, c, BrickType.INDESTRUCTIBLE, Infinity);
        } else if (r % 2 === 0 && c % 2 === 0) {
          addBrick(r, c, BrickType.EXPLOSIVE);
        } else if (Math.random() < 0.2) {
          addBrick(r, c, BrickType.GHOST, 1, { isGhostVisible: false, ghostTimer: 0 });
        } else {
          addBrick(r, c, BrickType.STANDARD);
        }
      }
    }
  } else {
    for (let r = 0; r < 8; r++) {
      for (let c = 2; c < 12; c++) {
        if (r === 3 && c >= 5 && c <= 8) {
          addBrick(r, c, BrickType.INDESTRUCTIBLE, Infinity);
        } else if (r === 4 && c >= 6 && c <= 7) {
          addBrick(r, c, BrickType.REINFORCED, 2);
        } else if (Math.random() < 0.1) {
          addBrick(r, c, BrickType.EXPLOSIVE);
        } else if (Math.random() < 0.2) {
          addBrick(r, c, BrickType.MULTIPLIER, 1, { multiplier: 2 });
        } else {
          addBrick(r, c, BrickType.STANDARD);
        }
      }
    }
  }

  return bricks;
}
