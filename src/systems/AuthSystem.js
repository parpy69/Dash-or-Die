export class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
        
        // Initialize event listeners first
        this.init();
        
        // Then check for saved session (after DOM is ready)
        setTimeout(() => this.loadSession(), 100);
    }
    
    loadSession() {
        const savedSession = localStorage.getItem('dashOrDieSession');
        if (savedSession) {
            const sessionData = JSON.parse(savedSession);
            
            // If guest session
            if (sessionData.isGuest) {
                this.currentUser = sessionData;
                this.showMainMenu();
            } else {
                // Find user in users list
                const user = this.users.find(u => u.username === sessionData.username);
                if (user) {
                    this.currentUser = user;
                    this.showMainMenu();
                }
            }
        }
    }
    
    saveSession() {
        if (this.currentUser) {
            localStorage.setItem('dashOrDieSession', JSON.stringify({
                username: this.currentUser.username,
                isGuest: this.currentUser.isGuest || false
            }));
        }
    }
    
    clearSession() {
        localStorage.removeItem('dashOrDieSession');
    }
    
    init() {
        // Tab switching
        document.getElementById('signInTab').addEventListener('click', () => {
            this.switchTab('signIn');
        });
        
        document.getElementById('signUpTab').addEventListener('click', () => {
            this.switchTab('signUp');
        });
        
        // Sign In
        document.getElementById('signInBtn').addEventListener('click', () => {
            this.signIn();
        });
        
        // Sign Up
        document.getElementById('signUpBtn').addEventListener('click', () => {
            this.signUp();
        });
        
        // Guest
        document.getElementById('guestBtn').addEventListener('click', () => {
            this.playAsGuest();
        });
        
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });
        
        // Leaderboard
        document.getElementById('leaderboardBtn').addEventListener('click', () => {
            this.showLeaderboard();
        });
        
        document.getElementById('leaderboardBackBtn').addEventListener('click', () => {
            this.hideLeaderboard();
        });
        
        // Enter key support
        document.getElementById('signInPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.signIn();
        });
        
        document.getElementById('signUpConfirm').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.signUp();
        });
    }
    
    switchTab(tab) {
        const signInTab = document.getElementById('signInTab');
        const signUpTab = document.getElementById('signUpTab');
        const signInForm = document.getElementById('signInForm');
        const signUpForm = document.getElementById('signUpForm');
        
        if (tab === 'signIn') {
            signInTab.classList.add('active');
            signUpTab.classList.remove('active');
            signInForm.style.display = 'flex';
            signUpForm.style.display = 'none';
        } else {
            signUpTab.classList.add('active');
            signInTab.classList.remove('active');
            signUpForm.style.display = 'flex';
            signInForm.style.display = 'none';
        }
    }
    
    signIn() {
        const username = document.getElementById('signInUsername').value.trim();
        const password = document.getElementById('signInPassword').value;
        
        if (!username || !password) {
            alert('Please enter username and password');
            return;
        }
        
        const user = this.users.find(u => u.username === username);
        
        if (!user) {
            alert('User not found. Please sign up first.');
            return;
        }
        
        if (user.password !== password) {
            alert('Incorrect password');
            return;
        }
        
        this.currentUser = user;
        this.saveSession();
        this.showMainMenu();
    }
    
    signUp() {
        const username = document.getElementById('signUpUsername').value.trim();
        const email = document.getElementById('signUpEmail').value.trim();
        const password = document.getElementById('signUpPassword').value;
        const confirm = document.getElementById('signUpConfirm').value;
        
        if (!username || !email || !password || !confirm) {
            alert('Please fill in all fields');
            return;
        }
        
        if (password !== confirm) {
            alert('Passwords do not match');
            return;
        }
        
        if (password.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }
        
        if (this.users.find(u => u.username === username)) {
            alert('Username already exists');
            return;
        }
        
        const newUser = {
            username,
            email,
            password,
            highScore: 0,
            createdAt: Date.now()
        };
        
        this.users.push(newUser);
        this.saveUsers();
        this.currentUser = newUser;
        this.saveSession();
        this.showMainMenu();
    }
    
    playAsGuest() {
        this.currentUser = {
            username: 'Guest',
            isGuest: true,
            highScore: 0
        };
        this.saveSession();
        this.showMainMenu();
    }
    
    logout() {
        this.currentUser = null;
        this.clearSession();
        
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('leaderboardMenu').style.display = 'none';
        document.getElementById('authScreen').style.display = 'flex';
        
        // Clear forms
        document.getElementById('signInUsername').value = '';
        document.getElementById('signInPassword').value = '';
        document.getElementById('signUpUsername').value = '';
        document.getElementById('signUpEmail').value = '';
        document.getElementById('signUpPassword').value = '';
        document.getElementById('signUpConfirm').value = '';
    }
    
    showMainMenu() {
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('mainMenu').style.display = 'flex';
        document.getElementById('playerName').textContent = this.currentUser.username;
        
        // Load user's high score
        const highScore = this.currentUser.highScore || 0;
        document.getElementById('menuHighScore').textContent = highScore;
    }
    
    updateHighScore(score) {
        if (!this.currentUser) return;
        
        if (score > (this.currentUser.highScore || 0)) {
            this.currentUser.highScore = score;
            
            // Save to localStorage if not guest
            if (!this.currentUser.isGuest) {
                const userIndex = this.users.findIndex(u => u.username === this.currentUser.username);
                if (userIndex !== -1) {
                    this.users[userIndex].highScore = score;
                    this.saveUsers();
                }
            }
        }
    }
    
    loadUsers() {
        const saved = localStorage.getItem('dashOrDieUsers');
        return saved ? JSON.parse(saved) : [];
    }
    
    saveUsers() {
        localStorage.setItem('dashOrDieUsers', JSON.stringify(this.users));
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
    
    showLeaderboard() {
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('leaderboardMenu').style.display = 'flex';
        this.updateLeaderboard();
    }
    
    hideLeaderboard() {
        document.getElementById('leaderboardMenu').style.display = 'none';
        document.getElementById('mainMenu').style.display = 'flex';
    }
    
    updateLeaderboard() {
        const leaderboardList = document.getElementById('leaderboardList');
        
        // Sort users by high score
        const sortedUsers = [...this.users]
            .filter(u => u.highScore > 0)
            .sort((a, b) => b.highScore - a.highScore)
            .slice(0, 10); // Top 10
        
        if (sortedUsers.length === 0) {
            leaderboardList.innerHTML = '<div class="leaderboard-empty">No scores yet. Be the first to play!</div>';
            return;
        }
        
        leaderboardList.innerHTML = sortedUsers.map((user, index) => {
            const rank = index + 1;
            const rankClass = rank === 1 ? 'top-1' : rank === 2 ? 'top-2' : rank === 3 ? 'top-3' : '';
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
            
            return `
                <div class="leaderboard-entry ${rankClass}">
                    <div class="leaderboard-rank">${medal || rank}</div>
                    <div class="leaderboard-name">${user.username}</div>
                    <div class="leaderboard-score">${user.highScore.toLocaleString()}</div>
                </div>
            `;
        }).join('');
    }
}

