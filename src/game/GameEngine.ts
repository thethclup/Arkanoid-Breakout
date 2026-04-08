import { Brick, BrickType, PowerUpType, Ball, Paddle, Capsule, Particle, Laser, GameState } from './types';
import { generateLevel, getLevelName } from './levels';
import { audio } from './audio';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 15;
const BALL_RADIUS = 6;
const BASE_BALL_SPEED = 5;
const MAX_BALL_SPEED = 12;

const POWER_UP_COLORS = {
  [PowerUpType.MULTI_BALL]: '#00ffff',
  [PowerUpType.LASER]: '#ff0000',
  [PowerUpType.EXPAND]: '#00ff00',
  [PowerUpType.SHRINK]: '#ff00ff',
  [PowerUpType.CATCH]: '#ffff00',
  [PowerUpType.SLOW]: '#0000ff',
  [PowerUpType.SPEED]: '#ff8800',
  [PowerUpType.BOMB]: '#ff0000',
  [PowerUpType.SHIELD]: '#0088ff',
  [PowerUpType.EXTRA_LIFE]: '#ffffff'
};

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  
  state: GameState = {
    status: 'start', score: 0, lives: 3, level: 1, bricksDestroyed: 0,
    activePowerUps: [], shieldActive: false, shieldTimer: 0
  };

  paddle: Paddle;
  balls: Ball[] = [];
  bricks: Brick[] = [];
  capsules: Capsule[] = [];
  particles: Particle[] = [];
  lasers: Laser[] = [];

  keys: { [key: string]: boolean } = {};
  mouseX: number = CANVAS_WIDTH / 2;
  lastTime: number = 0;
  levelTransitionTimer: number = 0;
  onStateChange?: (state: GameState) => void;
  playerName: string = 'Anonymous';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.paddle = { x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2, y: CANVAS_HEIGHT - 40, w: PADDLE_WIDTH, h: PADDLE_HEIGHT, vx: 0, targetX: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2, widthMultiplier: 1 };
    this.initInput();
  }

  initInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Space') {
        if (this.state.status === 'playing') { this.releaseCaughtBalls(); this.fireLaser(); }
        else if (this.state.status === 'gameOver' || this.state.status === 'victory') this.resetGame();
      }
      if (e.code === 'KeyP') {
        if (this.state.status === 'playing') this.state.status = 'paused';
        else if (this.state.status === 'paused') this.state.status = 'playing';
        this.notifyState();
      }
    });
    window.addEventListener('keyup', (e) => this.keys[e.code] = false);
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      this.mouseX = (e.clientX - rect.left) * scaleX;
    });
    this.canvas.addEventListener('mousedown', (e) => {
      if (this.state.status === 'playing') { this.releaseCaughtBalls(); this.fireLaser(); }
      else if (this.state.status === 'start') this.startLevel();
      else if (this.state.status === 'gameOver' || this.state.status === 'victory') this.resetGame();
    });
  }

  notifyState() { if (this.onStateChange) this.onStateChange({ ...this.state }); }

  resetGame() {
    this.state = { status: 'levelTransition', score: 0, lives: 3, level: 1, bricksDestroyed: 0, activePowerUps: [], shieldActive: false, shieldTimer: 0 };
    this.levelTransitionTimer = 2000;
    this.loadLevel(this.state.level);
    this.notifyState();
  }

  loadLevel(level: number) {
    this.bricks = generateLevel(level, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.resetPaddleAndBall();
    this.capsules = []; this.particles = []; this.lasers = [];
    this.state.activePowerUps = []; this.state.shieldActive = false;
    
    if (level % 5 === 0) {
      const bossBricks = this.bricks.filter(b => b.y < 200 && b.type !== BrickType.INDESTRUCTIBLE);
      this.state.bossMaxHp = bossBricks.reduce((sum, b) => sum + b.hp, 0);
      this.state.bossHp = this.state.bossMaxHp;
    } else {
      this.state.bossMaxHp = undefined; this.state.bossHp = undefined;
    }
  }

  resetPaddleAndBall() {
    this.paddle.widthMultiplier = 1;
    this.paddle.w = PADDLE_WIDTH;
    this.paddle.x = CANVAS_WIDTH / 2 - this.paddle.w / 2;
    this.paddle.targetX = this.paddle.x;
    
    const speed = Math.min(BASE_BALL_SPEED + Math.floor(this.state.bricksDestroyed / 10) * 0.5, MAX_BALL_SPEED);
    this.balls = [{ x: this.paddle.x + this.paddle.w / 2, y: this.paddle.y - BALL_RADIUS - 1, vx: speed * 0.7, vy: -speed * 0.7, radius: BALL_RADIUS, speed: speed, caught: true, caughtOffset: this.paddle.w / 2 }];
  }

  startLevel() { this.state.status = 'playing'; this.balls.forEach(b => b.caught = false); this.notifyState(); }

  releaseCaughtBalls() {
    this.balls.forEach(b => {
      if (b.caught) {
        b.caught = false;
        const hitPoint = b.caughtOffset / this.paddle.w;
        const angle = Math.PI * (0.8 - hitPoint * 0.6);
        b.vx = Math.cos(angle) * b.speed; b.vy = -Math.sin(angle) * b.speed;
      }
    });
  }

  fireLaser() {
    if (this.state.activePowerUps.find(p => p.type === PowerUpType.LASER)) {
      audio.laser();
      this.lasers.push({ x: this.paddle.x + 5, y: this.paddle.y, w: 4, h: 15, vy: -10 });
      this.lasers.push({ x: this.paddle.x + this.paddle.w - 9, y: this.paddle.y, w: 4, h: 15, vy: -10 });
    }
  }

  spawnCapsule(x: number, y: number) {
    if (Math.random() > 0.2) return;
    const types = Object.values(PowerUpType);
    const type = types[Math.floor(Math.random() * types.length)];
    this.capsules.push({ x, y, w: 24, h: 12, type, vy: 2, color: POWER_UP_COLORS[type], rotation: 0 });
  }

  spawnParticles(x: number, y: number, color: string, count: number = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0, maxLife: Math.random() * 30 + 20, color, size: Math.random() * 3 + 1 });
    }
  }

  applyPowerUp(type: PowerUpType) {
    audio.powerUp();
    this.state.score += 5;
    const isPositive = ![PowerUpType.SHRINK, PowerUpType.SLOW].includes(type);
    this.state.activePowerUps = this.state.activePowerUps.filter(p => {
      const pIsPos = ![PowerUpType.SHRINK, PowerUpType.SLOW].includes(p.type);
      return pIsPos !== isPositive;
    });

    let duration = 0;
    switch (type) {
      case PowerUpType.MULTI_BALL:
        duration = 15000;
        const newBalls: Ball[] = [];
        this.balls.forEach(b => { newBalls.push({ ...b, vx: -b.vx, vy: b.vy }); newBalls.push({ ...b, vx: b.vx, vy: -b.vy }); });
        this.balls.push(...newBalls);
        break;
      case PowerUpType.LASER: duration = 12000; break;
      case PowerUpType.EXPAND: duration = 18000; this.paddle.widthMultiplier = 1.6; break;
      case PowerUpType.SHRINK: duration = 12000; this.paddle.widthMultiplier = 0.6; audio.powerDown(); break;
      case PowerUpType.CATCH: duration = 10000; break;
      case PowerUpType.SLOW: duration = 15000; this.balls.forEach(b => { b.speed *= 0.65; this.updateBallVelocity(b); }); audio.powerDown(); break;
      case PowerUpType.SPEED: duration = 10000; this.balls.forEach(b => { b.speed *= 1.4; this.updateBallVelocity(b); }); break;
      case PowerUpType.BOMB: this.balls.forEach(b => (b as any).bombActive = true); break;
      case PowerUpType.SHIELD: duration = 15000; this.state.shieldActive = true; this.state.shieldTimer = duration; break;
      case PowerUpType.EXTRA_LIFE: this.state.lives++; break;
    }
    if (duration > 0) this.state.activePowerUps.push({ type, timer: duration });
    this.notifyState();
  }

  updateBallVelocity(b: Ball) {
    const currentSpeed = Math.hypot(b.vx, b.vy);
    if (currentSpeed > 0) { b.vx = (b.vx / currentSpeed) * b.speed; b.vy = (b.vy / currentSpeed) * b.speed; }
  }

  hitBrick(b: Brick, ballX: number, ballY: number, isBomb: boolean = false) {
    if (b.type === BrickType.INDESTRUCTIBLE) { audio.hitIndestructible(); return; }
    b.hp--; if (isBomb) b.hp = 0;

    if (b.hp <= 0) {
      audio.destroyBrick();
      this.spawnParticles(b.x + b.w/2, b.y + b.h/2, b.color);
      
      let pts = 10;
      if (b.type === BrickType.REINFORCED) pts = 25;
      else if (b.type === BrickType.EXPLOSIVE) pts = 40;
      else if (b.type === BrickType.MOVING) pts = 30;
      else if (b.type === BrickType.GHOST) pts = 50;
      if (b.multiplier) pts *= b.multiplier;
      this.state.score += pts;

      if (b.type === BrickType.WARP) { this.state.score += 1000; this.levelComplete(); return; }

      this.bricks = this.bricks.filter(br => br.id !== b.id);
      this.state.bricksDestroyed++;
      
      if (this.state.bricksDestroyed % 10 === 0) {
        this.balls.forEach(ball => { ball.speed = Math.min(ball.speed + 0.5, MAX_BALL_SPEED); this.updateBallVelocity(ball); });
      }

      this.spawnCapsule(b.x + b.w/2, b.y + b.h/2);

      if (b.type === BrickType.EXPLOSIVE || isBomb) {
        audio.explosion();
        const radius = isBomb ? b.w * 3 : b.w * 1.5;
        this.bricks.forEach(other => {
          if (other.type !== BrickType.INDESTRUCTIBLE) {
            const dx = (other.x + other.w/2) - (b.x + b.w/2);
            const dy = (other.y + other.h/2) - (b.y + b.h/2);
            if (Math.hypot(dx, dy) < radius) this.hitBrick(other, other.x, other.y);
          }
        });
      }

      if (this.state.bossHp !== undefined && b.y < 200) this.state.bossHp -= 1;
    } else {
      audio.hitBrick();
      this.state.score += (b.type === BrickType.REINFORCED ? 25 : 10);
      if (b.type === BrickType.REINFORCED) b.color = '#aa0088';
    }
    this.notifyState();
    this.checkLevelClear();
  }

  checkLevelClear() {
    const remaining = this.bricks.filter(b => b.type !== BrickType.INDESTRUCTIBLE && b.type !== BrickType.WARP);
    if (remaining.length === 0) this.levelComplete();
  }

  levelComplete() {
    audio.levelClear();
    this.state.score += 500;
    this.state.level++;
    this.state.status = 'levelTransition';
    this.levelTransitionTimer = 2000;
    this.notifyState();
  }

  update(dt: number) {
    if (this.state.status === 'levelTransition') {
      this.levelTransitionTimer -= dt;
      if (this.levelTransitionTimer <= 0) { this.loadLevel(this.state.level); this.state.status = 'start'; this.notifyState(); }
      return;
    }
    if (this.state.status !== 'playing') return;

    this.state.activePowerUps.forEach(p => p.timer -= dt);
    this.state.activePowerUps = this.state.activePowerUps.filter(p => p.timer > 0);
    if (!this.state.activePowerUps.find(p => p.type === PowerUpType.EXPAND || p.type === PowerUpType.SHRINK)) this.paddle.widthMultiplier = 1;
    
    if (this.state.shieldActive) {
      this.state.shieldTimer -= dt;
      if (this.state.shieldTimer <= 0) this.state.shieldActive = false;
    }

    this.paddle.w = PADDLE_WIDTH * this.paddle.widthMultiplier;
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) this.paddle.targetX -= 8;
    else if (this.keys['ArrowRight'] || this.keys['KeyD']) this.paddle.targetX += 8;
    else this.paddle.targetX = this.mouseX - this.paddle.w / 2;

    this.paddle.targetX = Math.max(0, Math.min(CANVAS_WIDTH - this.paddle.w, this.paddle.targetX));
    this.paddle.x += (this.paddle.targetX - this.paddle.x) * 0.3;

    for (let i = this.balls.length - 1; i >= 0; i--) {
      const b = this.balls[i];
      if (b.caught) { b.x = this.paddle.x + b.caughtOffset; b.y = this.paddle.y - b.radius - 1; continue; }

      b.x += b.vx; b.y += b.vy;

      if (b.x - b.radius < 0) { b.x = b.radius; b.vx *= -1; }
      if (b.x + b.radius > CANVAS_WIDTH) { b.x = CANVAS_WIDTH - b.radius; b.vx *= -1; }
      if (b.y - b.radius < 0) { b.y = b.radius; b.vy *= -1; }

      if (this.state.shieldActive && b.y + b.radius > this.paddle.y - 10 && b.y - b.radius < this.paddle.y - 5) {
        b.y = this.paddle.y - 10 - b.radius; b.vy *= -1;
      }

      if (b.vy > 0 && b.y + b.radius >= this.paddle.y && b.y - b.radius <= this.paddle.y + this.paddle.h && b.x >= this.paddle.x && b.x <= this.paddle.x + this.paddle.w) {
        audio.hitPaddle();
        b.y = this.paddle.y - b.radius;
        if (this.state.activePowerUps.find(p => p.type === PowerUpType.CATCH)) {
          b.caught = true; b.caughtOffset = b.x - this.paddle.x;
        } else {
          const hitPoint = (b.x - this.paddle.x) / this.paddle.w;
          const angle = Math.PI * (0.8 - hitPoint * 0.6);
          b.vx = Math.cos(angle) * b.speed; b.vy = -Math.sin(angle) * b.speed;
        }
      }

      let hit = false;
      for (const brick of this.bricks) {
        const testX = Math.max(brick.x, Math.min(b.x, brick.x + brick.w));
        const testY = Math.max(brick.y, Math.min(b.y, brick.y + brick.h));
        const distX = b.x - testX; const distY = b.y - testY;
        const distance = Math.hypot(distX, distY);

        if (distance < b.radius) {
          const overlapX = b.radius - Math.abs(distX);
          const overlapY = b.radius - Math.abs(distY);
          if (overlapX < overlapY) { b.vx *= -1; b.x += b.vx > 0 ? overlapX : -overlapX; }
          else { b.vy *= -1; b.y += b.vy > 0 ? overlapY : -overlapY; }

          const isBomb = (b as any).bombActive;
          if (isBomb) (b as any).bombActive = false;
          
          this.hitBrick(brick, b.x, b.y, isBomb);
          hit = true; break;
        }
      }

      if (b.y - b.radius > CANVAS_HEIGHT) this.balls.splice(i, 1);
    }

    if (this.balls.length === 0) {
      audio.lifeLost();
      this.state.lives--;
      if (this.state.lives <= 0) {
        this.state.status = 'gameOver';
        const highScores = JSON.parse(localStorage.getItem('arkanoid_highscores') || '[]');
        highScores.push({ name: this.playerName, score: this.state.score });
        highScores.sort((a: any, b: any) => b.score - a.score);
        localStorage.setItem('arkanoid_highscores', JSON.stringify(highScores.slice(0, 5)));
      } else {
        this.resetPaddleAndBall(); this.state.status = 'start';
      }
      this.notifyState();
    }

    for (let i = this.capsules.length - 1; i >= 0; i--) {
      const c = this.capsules[i];
      c.y += c.vy; c.rotation += 0.05;
      if (c.y + c.h >= this.paddle.y && c.y <= this.paddle.y + this.paddle.h && c.x + c.w >= this.paddle.x && c.x <= this.paddle.x + this.paddle.w) {
        this.applyPowerUp(c.type); this.capsules.splice(i, 1);
      } else if (c.y > CANVAS_HEIGHT) this.capsules.splice(i, 1);
    }

    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const l = this.lasers[i];
      l.y += l.vy;
      let hit = false;
      for (const brick of this.bricks) {
        if (l.x < brick.x + brick.w && l.x + l.w > brick.x && l.y < brick.y + brick.h && l.y + l.h > brick.y) {
          this.hitBrick(brick, l.x, l.y); hit = true; break;
        }
      }
      if (hit || l.y < 0) this.lasers.splice(i, 1);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx; p.y += p.vy; p.life++;
      if (p.life >= p.maxLife) this.particles.splice(i, 1);
    }

    this.bricks.forEach(b => {
      if (b.type === BrickType.MOVING && b.vx) {
        b.x += b.vx;
        if (b.startX !== undefined) { if (Math.abs(b.x - b.startX) > 100) b.vx *= -1; }
      }
      if (b.type === BrickType.GHOST) {
        let minDist = Infinity;
        this.balls.forEach(ball => {
          const dist = Math.hypot(ball.x - (b.x + b.w/2), ball.y - (b.y + b.h/2));
          if (dist < minDist) minDist = dist;
        });
        if (minDist < 100) { b.isGhostVisible = true; b.ghostTimer = 1000; }
        else if (b.ghostTimer && b.ghostTimer > 0) {
          b.ghostTimer -= dt;
          if (b.ghostTimer <= 0) b.isGhostVisible = false;
        }
      }
    });
  }

  draw() {
    this.ctx.fillStyle = '#0a0a1a';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (this.state.shieldActive) {
      this.ctx.fillStyle = `rgba(0, 136, 255, ${0.3 + Math.sin(Date.now() / 100) * 0.1})`;
      this.ctx.fillRect(0, this.paddle.y - 10, CANVAS_WIDTH, 5);
    }

    this.bricks.forEach(b => {
      if (b.type === BrickType.GHOST && !b.isGhostVisible) return;
      this.ctx.fillStyle = b.color;
      this.ctx.fillRect(b.x, b.y, b.w, b.h);
      this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
      this.ctx.fillRect(b.x, b.y, b.w, 4);
      this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
      this.ctx.fillRect(b.x, b.y + b.h - 4, b.w, 4);

      if (b.type === BrickType.REINFORCED && b.hp === 1) {
        this.ctx.strokeStyle = '#000'; this.ctx.beginPath();
        this.ctx.moveTo(b.x + 5, b.y + 5); this.ctx.lineTo(b.x + 15, b.y + 15);
        this.ctx.moveTo(b.x + b.w - 5, b.y + 5); this.ctx.lineTo(b.x + b.w - 15, b.y + 15);
        this.ctx.stroke();
      }

      if (b.multiplier) {
        this.ctx.fillStyle = '#000'; this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'center'; this.ctx.fillText(`${b.multiplier}x`, b.x + b.w/2, b.y + 14);
      }
    });

    this.capsules.forEach(c => {
      this.ctx.save();
      this.ctx.translate(c.x + c.w/2, c.y + c.h/2);
      this.ctx.rotate(c.rotation);
      this.ctx.fillStyle = c.color;
      this.ctx.beginPath(); this.ctx.roundRect(-c.w/2, -c.h/2, c.w, c.h, c.h/2); this.ctx.fill();
      this.ctx.fillStyle = '#000'; this.ctx.font = '10px monospace';
      this.ctx.textAlign = 'center'; this.ctx.textBaseline = 'middle';
      this.ctx.fillText(c.type, 0, 0);
      this.ctx.restore();
    });

    this.ctx.fillStyle = '#ff0000';
    this.lasers.forEach(l => this.ctx.fillRect(l.x, l.y, l.w, l.h));

    this.particles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = 1 - (p.life / p.maxLife);
      this.ctx.beginPath(); this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); this.ctx.fill();
      this.ctx.globalAlpha = 1;
    });

    this.ctx.fillStyle = '#4488ff';
    this.ctx.beginPath(); this.ctx.roundRect(this.paddle.x, this.paddle.y, this.paddle.w, this.paddle.h, 5); this.ctx.fill();
    this.ctx.fillStyle = 'rgba(255,255,255,0.4)';
    this.ctx.beginPath(); this.ctx.roundRect(this.paddle.x, this.paddle.y, this.paddle.w, 4, 5); this.ctx.fill();

    this.balls.forEach(b => {
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath(); this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); this.ctx.fill();
      this.ctx.shadowBlur = 10; this.ctx.shadowColor = '#00ffff'; this.ctx.fill(); this.ctx.shadowBlur = 0;
      if ((b as any).bombActive) {
        this.ctx.fillStyle = '#ff0000';
        this.ctx.beginPath(); this.ctx.arc(b.x, b.y, b.radius/2, 0, Math.PI * 2); this.ctx.fill();
      }
    });

    if (this.state.status === 'start') {
      this.ctx.fillStyle = 'rgba(0,0,0,0.5)'; this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      this.ctx.fillStyle = '#fff'; this.ctx.font = '24px monospace'; this.ctx.textAlign = 'center';
      this.ctx.fillText('CLICK OR PRESS SPACE TO LAUNCH', CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    } else if (this.state.status === 'paused') {
      this.ctx.fillStyle = 'rgba(0,0,0,0.5)'; this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      this.ctx.fillStyle = '#fff'; this.ctx.font = '36px monospace'; this.ctx.textAlign = 'center';
      this.ctx.fillText('PAUSED', CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    } else if (this.state.status === 'levelTransition') {
      this.ctx.fillStyle = '#0a0a1a'; this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      this.ctx.fillStyle = '#fff'; this.ctx.font = '48px monospace'; this.ctx.textAlign = 'center';
      this.ctx.fillText(`LEVEL ${this.state.level}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
      this.ctx.fillStyle = '#00ffcc'; this.ctx.font = '24px monospace';
      this.ctx.fillText(getLevelName(this.state.level), CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    } else if (this.state.status === 'gameOver') {
      this.ctx.fillStyle = 'rgba(0,0,0,0.8)'; this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      this.ctx.fillStyle = '#ff0000'; this.ctx.font = '48px monospace'; this.ctx.textAlign = 'center';
      this.ctx.fillText('GAME OVER', CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
      this.ctx.fillStyle = '#fff'; this.ctx.font = '24px monospace';
      this.ctx.fillText(`SCORE: ${this.state.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
      this.ctx.fillText('CLICK OR PRESS SPACE TO RESTART', CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    }
  }

  loop = (timestamp: number) => {
    const dt = timestamp - this.lastTime;
    this.lastTime = timestamp;
    if (dt < 100) { this.update(dt); this.draw(); }
    requestAnimationFrame(this.loop);
  }

  start() {
    this.lastTime = performance.now();
    this.resetGame();
    requestAnimationFrame(this.loop);
  }
}
