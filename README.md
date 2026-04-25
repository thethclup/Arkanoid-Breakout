# NEON BREAKER

**Neon Breaker** is a modern, high-octane take on the classic arcade brick-breaker genre. Immerse yourself in a vibrant synthwave aesthetic, complete with dynamic lighting, particle effects, and a thumping retro soundtrack. 

Defend the grid, smash through intricate block formations, collect powerful upgrades, and etch your name into the blockchain!

## 🌟 Features

* **Dynamic Gameplay:** Battle your way through progressively challenging levels, each with unique layouts and obstacles.
* **Special Bricks:** Encounter a variety of brick types that will test your reflexes and strategy:
  * **Reinforced:** Requires multiple hits to destroy.
  * **Indestructible:** Solid walls that block your path.
  * **Explosive:** Detonates on impact, destroying adjacent bricks.
  * **Moving:** Patrols the grid, requiring precise timing.
  * **Ghost:** Phases in and out of invisibility.
  * **Multiplier:** Grants bonus points.
  * **Warp:** Instantly transports you to the next level.
* **Power-Ups (and Power-Downs!):** Catch falling capsules to modify the game state:
  * **Multi-Ball:** Unleash a swarm of balls.
  * **Laser:** Arm your paddle with twin blasters.
  * **Expand/Shrink:** Alter your paddle's size.
  * **Catch:** Catch and hold the ball on the paddle to aim your next shot.
  * **Slow/Speed:** Change the ball's velocity.
  * **Bomb:** The next hit triggers a massive explosion.
  * **Shield:** A protective barrier below your paddle to save lost balls.
  * **1-Up:** Gain an extra life.
* **On-Chain High Scores (ERC-8021):** Built on the **Base** network, Neon Breaker allows you to legally and permanently record your epic high scores directly to the blockchain using the ERC-8021 standard! Connect your Web3 wallet, dominate the leaderboard, and mint your achievement as an immutable on-chain transaction.
* **Boss Levels:** Face off against tougher fortified structures every 5 levels.
* **Local Leaderboard:** Keeps track of your top 5 runs locally in the browser.

## 🕹️ Controls

* **Mouse / Touch:** Move the paddle horizontally.
* **Left Click / Touch Tap:** Launch the ball, fire lasers, or release a caught ball.
* **Keyboard:**
  * **Arrow Left / Right** or **A / D:** Move the paddle.
  * **Spacebar:** Launch the ball, fire lasers, or release.
  * **P:** Pause / Resume the game.
  * **M:** Mute / Unmute audio (Optional depending on build).

## 🚀 Getting Started

To run the project locally:

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start Development Server:**
   ```bash
   npm run dev
   ```

3. **Build for Production:**
   ```bash
   npm run build
   ```

## 🔗 Web3 Integration

Neon Breaker is fully equipped for Web3 interaction using **Wagmi** and **Viem**. 

When a game ends, users can connect their Ethereum wallets (MetaMask, Coinbase Wallet, etc.) and save their score on the **Base** network. The transaction utilizes the **ERC-8021** standard payload, pushing the score data securely onto the blockchain.

---

*Get ready to break the neon grid!*
