export class UISystem {
    constructor(game) {
        this.game = game;
        
        this.init();
    }
    
    getHighScore() {
        const user = this.game.authSystem.getCurrentUser();
        return user ? (user.highScore || 0) : 0;
    }
    
    init() {
        try {
            // Main menu buttons
            document.getElementById('startBtn').addEventListener('click', () => {
                this.hideMenu('mainMenu');
                this.showHUD();
                this.game.startGame('endless');
            });
            
            document.getElementById('modeBtn').addEventListener('click', () => {
                this.hideMenu('mainMenu');
                this.showMenu('modeMenu');
            });
            
            // Mode select buttons
            document.getElementById('endlessBtn').addEventListener('click', () => {
                this.hideMenu('modeMenu');
                this.showHUD();
                this.game.startGame('endless');
                document.getElementById('modeLabel').textContent = 'ENDLESS MODE';
            });
            
            // Race button with extra checks
            const raceBtn = document.getElementById('raceBtn');
            if (!raceBtn) {
                console.error('❌ Race button not found in DOM!');
            } else {
                console.log('✅ Race button found, adding event listener...');
                raceBtn.addEventListener('click', (e) => {
                    console.log('🏁 Race button clicked!', e);
                    try {
                        this.hideMenu('modeMenu');
                        this.showRaceHUD();
                        console.log('🏁 Starting race mode...');
                        this.game.startGame('race');
                    } catch (error) {
                        console.error('❌ Error in race button handler:', error);
                    }
                });
            }
        
        document.getElementById('backBtn').addEventListener('click', () => {
            this.hideMenu('modeMenu');
            this.showMenu('mainMenu');
        });
        
        // Game over buttons
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.hideMenu('gameOverMenu');
            this.showHUD();
            this.game.startGame(this.game.gameMode?.mode || 'endless');
        });
        
        document.getElementById('mainMenuBtn').addEventListener('click', () => {
            this.hideMenu('gameOverMenu');
            this.showMenu('mainMenu');
        });
        
        // Race results buttons
        document.getElementById('raceRestartBtn').addEventListener('click', () => {
            this.hideMenu('raceResults');
            this.showRaceHUD();
            this.game.startGame('race');
        });
        
        document.getElementById('raceMenuBtn').addEventListener('click', () => {
            this.hideMenu('raceResults');
            this.showMenu('mainMenu');
        });
        
        } catch (error) {
            console.error('❌ Error initializing UI System:', error);
        }
    }
    
    showMenu(menuId) {
        document.getElementById(menuId).style.display = 'flex';
    }
    
    hideMenu(menuId) {
        document.getElementById(menuId).style.display = 'none';
    }
    
    showHUD() {
        document.getElementById('hud').style.display = 'block';
        
        // Show and update high score display in bottom left
        const highScoreElement = document.querySelector('.hud-highscore');
        console.log('🎯 High Score Element:', highScoreElement);
        if (highScoreElement) {
            highScoreElement.style.display = 'flex';
            console.log('✅ High Score Display Set to Flex');
            console.log('Position:', window.getComputedStyle(highScoreElement).position);
            console.log('Bottom:', window.getComputedStyle(highScoreElement).bottom);
            console.log('Left:', window.getComputedStyle(highScoreElement).left);
            console.log('Display:', window.getComputedStyle(highScoreElement).display);
        }
        const highScore = this.getHighScore();
        document.getElementById('hudHighScore').textContent = highScore;
    }
    
    hideHUD() {
        document.getElementById('hud').style.display = 'none';
        
        // Hide high score display
        const highScoreElement = document.querySelector('.hud-highscore');
        if (highScoreElement) {
            highScoreElement.style.display = 'none';
        }
    }
    
    showRaceHUD() {
        document.getElementById('raceHud').style.display = 'block';
    }
    
    hideRaceHUD() {
        document.getElementById('raceHud').style.display = 'none';
    }
    
    updateRaceHUD(position, progress, time) {
        // Update position
        const positionElement = document.getElementById('racePosition');
        positionElement.textContent = position;
        
        const suffixElement = document.querySelector('#raceHud .position-suffix');
        if (position === 1) suffixElement.textContent = 'st';
        else if (position === 2) suffixElement.textContent = 'nd';
        else if (position === 3) suffixElement.textContent = 'rd';
        else suffixElement.textContent = 'th';
        
        // Update progress percentage
        document.getElementById('raceLap').textContent = `${Math.floor(progress)}%`;
        
        // Update time
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        document.getElementById('raceTime').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    updateHUD(score, distance, speed, gameTime) {
        document.getElementById('timeValue').textContent = Math.floor(gameTime) + 's';
        document.getElementById('scoreValue').textContent = score;
        document.getElementById('distanceValue').textContent = distance + 'm';
        
        const speedElement = document.getElementById('speedValue');
        speedElement.textContent = speed.toFixed(1) + 'x';
        
        // Update speed visual indicator
        speedElement.classList.remove('fast', 'extreme');
        if (speed >= 4) {
            speedElement.classList.add('extreme');
        } else if (speed >= 2.5) {
            speedElement.classList.add('fast');
        }
    }
    
    showGameOver(score, distance) {
        this.hideHUD();
        
        // Check high score
        const highScore = this.getHighScore();
        const isNewHighScore = score > highScore;
        
        if (isNewHighScore) {
            document.getElementById('newHighScore').style.display = 'block';
            document.getElementById('menuHighScore').textContent = score;
        } else {
            document.getElementById('newHighScore').style.display = 'none';
        }
        
        document.getElementById('finalScore').textContent = score;
        document.getElementById('finalDistance').textContent = distance;
        
        this.showMenu('gameOverMenu');
    }
    
    showRaceResults(position, time) {
        this.hideRaceHUD();
        
        // Update position
        const positionElement = document.getElementById('finalPosition');
        positionElement.textContent = position;
        
        const suffixElement = document.querySelector('#raceResults .position-suffix-large');
        if (position === 1) suffixElement.textContent = 'st';
        else if (position === 2) suffixElement.textContent = 'nd';
        else if (position === 3) suffixElement.textContent = 'rd';
        else suffixElement.textContent = 'th';
        
        // Update time
        document.getElementById('finalTime').textContent = time + 's';
        
        this.showMenu('raceResults');
    }
}

