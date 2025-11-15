export class GameMode {
    constructor(mode) {
        this.mode = mode; // 'endless', 'ranked', 'unranked'
        this.opponentScore = 0;
        this.opponentDistance = 0;
        
        if (mode === 'ranked' || mode === 'unranked') {
            this.simulateOpponent();
        }
    }
    
    simulateOpponent() {
        const difficulty = this.mode === 'ranked' ? 1.2 : 0.8;
        const baseScore = Math.floor(Math.random() * 5000 * difficulty);
        
        this.opponentScore = baseScore;
        this.opponentDistance = Math.floor(baseScore / 10);
    }
    
    getOpponentData() {
        return {
            score: this.opponentScore,
            distance: this.opponentDistance
        };
    }
    
    compareScores(playerScore) {
        if (this.mode === 'endless') {
            return null; // No comparison in endless mode
        }
        
        return {
            won: playerScore > this.opponentScore,
            difference: playerScore - this.opponentScore
        };
    }
}

