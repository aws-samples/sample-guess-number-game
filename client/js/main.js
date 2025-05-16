// DOM Elements
const lobbyServerInput = document.getElementById('lobbyServer');
const saveConfigBtn = document.getElementById('saveConfig');
const startGameBtn = document.getElementById('startGame');
const gameStatus = document.getElementById('gameStatus');
const guessInput = document.getElementById('guessInput');
const submitGuessBtn = document.getElementById('submitGuess');
const rangeDisplay = document.getElementById('range');

// Scenes
const configScene = document.getElementById('configScene');
const matchingScene = document.getElementById('matchingScene');
const gameScene = document.getElementById('gameScene');
const resultScene = document.getElementById('resultScene');

// Game state
let gameState = {
    ws: null,
    canGuess: false,
    gameOver: false,
    isPlayer1: true // Will be set when game starts
};

// Function to get URL parameters
function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Load lobby server address from URL, localStorage, or use default
const DEFAULT_LOBBY_SERVER = 'http://localhost:8080';
let lobbyServer = getUrlParam('lobbyServer') || localStorage.getItem('lobbyServer') || DEFAULT_LOBBY_SERVER;
lobbyServerInput.value = lobbyServer;

// Scene management
function showScene(scene) {
    [configScene, matchingScene, gameScene, resultScene].forEach(s => {
        if (s === scene) {
            s.classList.remove('hidden');
        } else {
            s.classList.add('hidden');
        }
    });
}

// Update player status
function showTurnOverlay(isMyTurn) {
    const overlay = document.createElement('div');
    overlay.className = 'turn-overlay';
    overlay.textContent = isMyTurn ? t('yourTurn') : t('opponentTurn');
    document.body.appendChild(overlay);
    
    setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 500);
    }, 1500);
}

function updatePlayerStatus(isMyTurn) {
    const yourTurnCard = document.querySelector('.your-turn');
    const opponentTurnCard = document.querySelector('.opponent-turn');
    
    // Update active states
    yourTurnCard.classList.toggle('active', isMyTurn);
    opponentTurnCard.classList.toggle('active', !isMyTurn);
    
    // Show turn overlay
    showTurnOverlay(isMyTurn);
}

// Save server configuration
saveConfigBtn.addEventListener('click', () => {
    const newAddress = lobbyServerInput.value.trim();
    if (newAddress) {
        lobbyServer = newAddress;
        localStorage.setItem('lobbyServer', lobbyServer);
        updateStatus(t('serverConfigSaved'));
    }
});

// Update status display with animation
function updateStatus(status) {
    gameStatus.style.animation = 'none';
    gameStatus.offsetHeight; // Trigger reflow
    gameStatus.style.animation = 'fadeInUp 0.5s ease';
    gameStatus.textContent = status;
}

// Enable/disable guess input
function setGuessInputEnabled(enabled) {
    guessInput.disabled = !enabled;
    submitGuessBtn.disabled = !enabled;
    if (enabled) {
        guessInput.focus();
    }
}

// Reset game interface
function resetGame() {
    showScene(configScene);
    rangeDisplay.textContent = t('validRange') + '1-100';
    guessInput.value = '';
    setGuessInputEnabled(false);
    gameState.gameOver = false;
}

// Show matching failure animation
function showMatchingFailure() {
    const status = document.getElementById('gameStatus');
    status.classList.add('shake');
    setTimeout(() => status.classList.remove('shake'), 500);
}

// Start game
startGameBtn.addEventListener('click', async () => {
    startGameBtn.disabled = true;
    showScene(matchingScene);
    updateStatus(t('findingOpponent'));

    try {
        const response = await fetch(`${lobbyServer}/match`);
        if (!response.ok) {
            throw new Error('Matchmaking server error');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const {value, done} = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, {stream: true});
            
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
                if (!line.trim()) continue;
                
                try {
                    const data = JSON.parse(line);
                    
                    switch (data.status) {
                        case 'waiting':
                            updateStatus(data.message);
                            break;
                            
                        case 'matched':
                            updateStatus(t('opponentFound'));
                            if (data.wsUrl) {
                                showCountdown(() => {
                                    connectToBattleServer(data.wsUrl);
                                });
                                return;
                            } else {
                                throw new Error('Invalid server address');
                            }
                            
                        case 'timeout':
                            showMatchingFailure();
                            updateStatus(t('matchmakingFailed'));
                            startGameBtn.disabled = false;
                            return;
                            
                        case 'error':
                            showMatchingFailure();
                            updateStatus(data.message);
                            startGameBtn.disabled = false;
                            return;
                            
                        default:
                            throw new Error('Invalid response from server');
                    }
                } catch (parseError) {
                    console.error('Parse error:', parseError);
                }
            }
        }
    } catch (error) {
        console.error('Error:', error);
        showMatchingFailure();
        updateStatus(t('matchmakingFailed'));
        startGameBtn.disabled = false;
    }
});

// Connect to battle server
function connectToBattleServer(wsUrl) {
    if (gameState.ws) {
        gameState.ws.close();
    }

    gameState.ws = new WebSocket(wsUrl);

    gameState.ws.onopen = () => {
        console.log('Connected to battle server');
    };

    gameState.ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            handleGameMessage(message);
        } catch (error) {
            console.error('Message parsing error:', error);
            updateStatus(t('messageError'));
        }
    };

    gameState.ws.onclose = () => {
        if (!gameState.gameOver) {
            updateStatus(t('connectionLost'));
            startGameBtn.disabled = false;
            showScene(configScene);
        }
    };

    gameState.ws.onerror = () => {
        updateStatus(t('connectionError'));
        startGameBtn.disabled = false;
        showScene(configScene);
    };
}

// Handle game messages
function displayHints(message) {
    const hintsDiv = document.getElementById('hints');
    const hints = [];

    if (message.isEven !== undefined && message.isEven !== -1) {
        hints.push(message.isEven === 1 ? t('hints.even') : t('hints.odd'));
    }

    if (message.sum !== undefined && message.sum !== -1) {
        hints.push(t('hints.sumOfDigits') + message.sum);
    }

    if (message.isPrime !== undefined && message.isPrime !== -1) {
        hints.push(message.isPrime === 1 ? t('hints.prime') : t('hints.notPrime'));
    }

    if (hints.length > 0) {
        hintsDiv.innerHTML = hints.map(hint => `<p>${hint}</p>`).join('');
        hintsDiv.style.animation = 'fadeInUp 0.5s ease';
    } else {
        hintsDiv.innerHTML = '';
    }
}

function showGameResult(message) {
    showScene(resultScene);
    const resultTitle = document.getElementById('resultTitle');
    const resultMessage = document.getElementById('resultMessage');
    
    if (message.includes('win')) {
        resultTitle.textContent = t('victory');
        resultTitle.style.color = 'var(--success-color)';
        resultTitle.className = 'victory-animation';
        document.querySelector('.background-animation').style.animation = 'pulseBackground 2s ease-in-out infinite';
    } else {
        resultTitle.textContent = t('defeat');
        resultTitle.style.color = 'var(--error-color)';
        resultTitle.className = 'defeat-animation';
    }
    resultMessage.textContent = message;
}

// Show countdown animation
function showCountdown(callback) {
    const countdownOverlay = document.createElement('div');
    countdownOverlay.style.position = 'fixed';
    countdownOverlay.style.top = '0';
    countdownOverlay.style.left = '0';
    countdownOverlay.style.width = '100%';
    countdownOverlay.style.height = '100%';
    countdownOverlay.style.display = 'flex';
    countdownOverlay.style.alignItems = 'center';
    countdownOverlay.style.justifyContent = 'center';
    countdownOverlay.style.background = 'rgba(0, 0, 0, 0.8)';
    countdownOverlay.style.zIndex = '1000';
    
    document.body.appendChild(countdownOverlay);
    
    let count = 3;
    
    function updateCount() {
        if (count > 0) {
            countdownOverlay.innerHTML = `<div class="countdown">${count}</div>`;
            count--;
            setTimeout(updateCount, 1000);
        } else {
            countdownOverlay.remove();
            callback();
        }
    }
    
    updateCount();
}

function handleGameMessage(message) {
    switch (message.type) {
        case 'waiting':
            showScene(matchingScene);
            updateStatus(message.message);
            break;
            
        case 'start':
            showScene(gameScene);
            gameState.isPlayer1 = message.message.includes('Player 1');
            updateStatus(message.message);
            const isMyTurn = message.message.includes('your turn');
            updatePlayerStatus(isMyTurn);
            gameState.canGuess = isMyTurn;
            setGuessInputEnabled(isMyTurn);
            displayHints(message);
            break;

        case 'update':
            updateStatus(message.message);
            const rangeMatch = message.message.match(/range: (\d+)-(\d+)/);
            if (rangeMatch) {
                rangeDisplay.textContent = `${t('validRange')}${rangeMatch[1]}-${rangeMatch[2]}`;
            }
            const myTurn = message.message.includes('your turn');
            updatePlayerStatus(myTurn);
            gameState.canGuess = myTurn;
            setGuessInputEnabled(myTurn);
            displayHints(message);
            break;

        case 'end':
            gameState.gameOver = true;
            showGameResult(message.message);
            startGameBtn.disabled = false;
            break;

        case 'error':
            updateStatus(message.message);
            break;

        default:
            console.error('Unknown message type:', message.type);
            break;
    }
}

// Submit guess
submitGuessBtn.addEventListener('click', () => {
    const guess = parseInt(guessInput.value);
    
    const rangeText = rangeDisplay.textContent;
    const rangeMatch = rangeText.match(/\d+-\d+/)[0].split('-');
    const minRange = parseInt(rangeMatch[0]);
    const maxRange = parseInt(rangeMatch[1]);
    
    if (isNaN(guess) || guess < minRange || guess > maxRange) {
        alert(`${t('invalidNumber')} ${minRange} ${t('and')} ${maxRange}`);
        guessInput.value = '';
        setGuessInputEnabled(true);
        return;
    }

    if (gameState.ws && gameState.ws.readyState === WebSocket.OPEN) {
        gameState.ws.send(JSON.stringify({
            type: 'guess',
            number: guess
        }));
        guessInput.value = '';
        setGuessInputEnabled(false);
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    resetGame();
    updatePageText(); // Initialize translations
});
