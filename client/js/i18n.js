const translations = {
    en: {
        title: "Number Duel",
        lobbyServerPlaceholder: "Lobby Server Address",
        setServer: "Set Lobby Server Address",
        waiting: "Waiting to start...",
        startGame: "Start Game",
        validRange: "Valid range: ",
        enterGuess: "Enter your guess",
        submit: "Submit",
        findingOpponent: "Finding opponent...",
        opponentFound: "Opponent found!",
        yourTurn: "Your Turn",
        opponentTurn: "Opponent's Turn",
        turnIndicator: {
            yourTurn: "Your Turn",
            opponentTurn: "Waiting..."
        },
        matchmakingFailed: "Matchmaking failed, please try again",
        connectionLost: "Connection lost, please try again",
        connectionError: "Connection error, please try again",
        invalidNumber: "Please enter a number between",
        and: "and",
        hints: {
            even: "This is an even number",
            odd: "This is an odd number",
            sumOfDigits: "Sum of digits is: ",
            prime: "This is a prime number",
            notPrime: "This is not a prime number"
        },
        victory: "🎉 You win! 🎉",
        defeat: "Game Over - You lost!"
    },
    cn: {
        title: "数字对决",
        lobbyServerPlaceholder: "大厅服务器地址",
        setServer: "设置服务器地址",
        waiting: "等待开始...",
        startGame: "开始游戏",
        validRange: "有效范围：",
        enterGuess: "输入你的猜测",
        submit: "提交",
        findingOpponent: "寻找对手中...",
        opponentFound: "已找到对手！",
        yourTurn: "轮到你了！",
        opponentTurn: "对手回合",
        turnIndicator: {
            yourTurn: "你的回合",
            opponentTurn: "等待对手..."
        },
        matchmakingFailed: "匹配失败，请重试",
        connectionLost: "连接断开，请重试",
        connectionError: "连接错误，请重试",
        invalidNumber: "请输入介于",
        and: "和",
        hints: {
            even: "这是一个偶数",
            odd: "这是一个奇数",
            sumOfDigits: "数字之和为：",
            prime: "这是一个质数",
            notPrime: "这不是一个质数"
        },
        victory: "🎉 你赢了！🎉",
        defeat: "游戏结束 - 你输了！"
    }
};

let currentLang = navigator.language.startsWith('zh') ? 'cn' : 'en';

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'cn' : 'en';
    document.querySelector('.lang-text').textContent = currentLang.toUpperCase();
    updatePageText();
    
    // Add animation effect
    const btn = document.querySelector('.lang-toggle');
    btn.classList.add('animated', 'rubberBand');
    setTimeout(() => btn.classList.remove('animated', 'rubberBand'), 1000);
}

// Initialize language button text
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.lang-text').textContent = currentLang.toUpperCase();
});

function t(key) {
    const keys = key.split('.');
    let value = translations[currentLang];
    for (const k of keys) {
        value = value[k];
        if (value === undefined) return key;
    }
    return value;
}

function updatePageText() {
    // Update all text content
    document.title = t('title');
    document.querySelector('h1').textContent = t('title');
    document.getElementById('lobbyServer').placeholder = t('lobbyServerPlaceholder');
    document.getElementById('saveConfig').textContent = t('setServer');
    document.getElementById('startGame').textContent = t('startGame');
    document.getElementById('guessInput').placeholder = t('enterGuess');
    document.getElementById('submitGuess').textContent = t('submit');
    
    // Update game status if it's showing default waiting message
    const gameStatus = document.getElementById('gameStatus');
    if (gameStatus.textContent === 'Waiting to start...' || 
        gameStatus.textContent === '等待开始...') {
        gameStatus.textContent = t('waiting');
    }
    
    // Update range display if it exists
    const range = document.getElementById('range');
    if (range.textContent.includes('Valid range') || range.textContent.includes('有效范围')) {
        const numbers = range.textContent.match(/\d+-\d+/)[0];
        range.textContent = `${t('validRange')}${numbers}`;
    }

    // Update turn indicators
    document.querySelectorAll('[data-text]').forEach(element => {
        const key = element.getAttribute('data-text');
        element.textContent = t(key);
    });
}
