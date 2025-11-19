// Variáveis Globais
const GENERATION_RANGES = {
    1: { start: 1, end: 151 },
    2: { start: 152, end: 251 },
    3: { start: 252, end: 386 },
    4: { start: 387, end: 493 },
    5: { start: 494, end: 649 },
    6: { start: 650, end: 721 },
    7: { start: 722, end: 809 },
    8: { start: 810, end: 905 },
    9: { start: 906, end: 1025 },
};
let activePokemonIds = []; // Array com os IDs dos Pokémon que podem aparecer
let GAME_TIME = 30; // Segundos (valor padrão, será atualizável)
let correctPokemonName = '';
let currentScore = 0;
let timeLeft = GAME_TIME;
let correctGuessesCount = 0; // Nova variável para contar os acertos
let timerInterval = null;
let highScore = 0;
let currentLang = 'en'; // Define 'en' como idioma padrão

// --- Constantes da Pontuação ---
const MAX_GUESS_TIME = 20; // Tempo máximo (em segundos) para uma boa pontuação
const SCORE_MULTIPLIER = 18; // Multiplicador para escalar a pontuação
const MINIMUM_SCORE = 10; // Pontuação mínima por acerto
let timeStartedForPokemon = 0; // Timestamp de quando o Pokémon apareceu

// Seletores do DOM
const pokemonImage = document.getElementById('pokemon-image');
const guessContainer = document.getElementById('guess-container');
const feedbackMessage = document.getElementById('feedback-message');
const startButton = document.getElementById('start-button');
const gameArea = document.getElementById('game-area');
let timerDisplay = document.getElementById('time-left'); // Alterado para let
const backgroundMusic = document.getElementById('background-music');
const musicToggleButton = document.getElementById('music-toggle-button');
const settingsButton = document.getElementById('settings-button');
const settingsModal = document.getElementById('settings-modal');
const saveSettingsButton = document.getElementById('save-settings-button');
const generationCheckboxes = document.querySelectorAll('input[name="generation"]');
const timeRadioButtons = document.querySelectorAll('input[name="game-time"]');
const themeRadioButtons = document.querySelectorAll('input[name="theme"]');
// Elementos de texto para tradução
const gameTitle = document.getElementById('game-title');
const timerLabel = document.getElementById('timer-label');
const scoreLabel = document.getElementById('score-label');
const highScoreLabel = document.getElementById('highscore-label');
const guessesLabel = document.createElement('div'); // Cria o elemento para o contador de acertos
const copyrightFooter = document.getElementById('copyright-footer');
const settingsTitle = document.getElementById('settings-title');
const generationsLabel = document.getElementById('generations-label');
const timeSettingsLabel = document.getElementById('time-settings-label');
const themeSettingsLabel = document.getElementById('theme-settings-label');
const multiplayerButton = document.getElementById('multiplayer-button');
const multiplayerModal = document.getElementById('multiplayer-modal');
const createRoomButton = document.getElementById('create-room-button');
const joinRoomButton = document.getElementById('join-room-button');
const joinRoomInput = document.getElementById('join-room-input');
const roomInfo = document.getElementById('room-info');
const roomIdDisplay = document.getElementById('room-id-display');
// Seletores da área multiplayer
const multiplayerGameArea = document.getElementById('multiplayer-game-area');
const mainContainer = document.querySelector('.container');
const myGuessContainer = document.getElementById('my-guess-container');
const opponentGuessContainer = document.getElementById('opponent-guess-container');
const multiplayerRoundFeedback = document.getElementById('multiplayer-round-feedback'); // Este pode ser o mesmo que multiplayer-feedback
const multiplayerTimerLabel = document.getElementById('multiplayer-timer-label');
const startMultiplayerButton = document.getElementById('start-multiplayer-button');
const myScoreDisplay = document.getElementById('my-score');
const opponentScoreDisplay = document.getElementById('opponent-score');
let multiplayerTimeLeft = 0;


backgroundMusic.volume = 0.03;

// Textos para internacionalização (i18n)
const translations = {
    pt: {
        title: 'Quem é Esse Pokémon?',
        score: 'Pontuação',
        time: 'Tempo',
        startButton: 'Começar Jogo',
        playAgain: 'Jogar Novamente',
        highScore: 'Recorde',
        correctGuess: 'Parabéns! É o {pokemonName}!',
        guesses: 'Acertos', // Tradução para o novo contador
        timeUp: 'Tempo esgotado! O pokémon era o {pokemonName}!.',
        settingsTitle: 'Configurações',
        generationsLabel: 'Gerações de Pokémon:',
        themeSettingsLabel: 'Tema:',
        timeSettingsLabel: 'Tempo da Partida:',
        loadError: 'Erro ao carregar Pokémon. Tente novamente.',
        footer: 'Desenvolvido por <a href="https://x.com/Aludeku2" target="_blank" rel="noopener noreferrer">Aludeku</a>. Poipole sprite: <a href="https://www.deviantart.com/thecraigadile/art/Shiny-Gen-7-Pokemon-Menu-Icons-694012919" target="_blank" rel="noopener noreferrer">TheCraigadile</a>, Miraidon sprite:<a href="https://www.deviantart.com/ezerart/art/Pokemon-Gen-9-Icon-sprites-3DS-Style-944211258" target="_blank" rel="noopener noreferrer">Ezerart</a>. Pokemon é propriedade de ©GameFreak ©CreaturesInk e ©Nintendo.',
    },
    en: {
        title: 'Who\'s That Pokémon?',
        score: 'Score',
        time: 'Time',
        startButton: 'Start Game',
        playAgain: 'Play Again',
        highScore: 'High Score',
        correctGuess: 'Congratulations! It\'s {pokemonName}!',
        guesses: 'Guesses', // Tradução para o novo contador
        timeUp: 'Time\'s up! The Pokémon is {pokemonName}!.',
        settingsTitle: 'Settings',
        generationsLabel: 'Pokémon Generations:',
        themeSettingsLabel: 'Theme:',
        timeSettingsLabel: 'Game Duration:',
        loadError: 'Error loading Pokémon. Please try again.',
        footer: 'Developed by <a href="https://x.com/Aludeku2" target="_blank" rel="noopener noreferrer">Aludeku</a>. Poipole sprite: <a href="https://www.deviantart.com/thecraigadile/art/Shiny-Gen-7-Pokemon-Menu-Icons-694012919" target="_blank" rel="noopener noreferrer">TheCraigadile</a>, Miraidon sprite:<a href="https://www.deviantart.com/ezerart/art/Pokemon-Gen-9-Icon-sprites-3DS-Style-944211258" target="_blank" rel="noopener noreferrer">Ezerart</a>. Pokemon is property of ©GameFreak ©CreaturesInk and ©Nintendo.',
    }
};

// --- Funções Principais ---

// 1. Atualiza a lista de Pokémon ativos com base nas checkboxes
function updateActivePokemonList() {
    activePokemonIds = [];
    generationCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const gen = checkbox.value;
            const range = GENERATION_RANGES[gen];
            for (let i = range.start; i <= range.end; i++) {
                activePokemonIds.push(i);
            }
        }
    });
    // Garante que sempre haja pelo menos uma geração selecionada
    if (activePokemonIds.length === 0) {
        generationCheckboxes[0].checked = true; // Marca a Gen 1
        updateActivePokemonList(); // Roda a função de novo
    }
}

// 1. Gera um número aleatório (ID do Pokémon)
function getRandomPokemonId() {
    const randomIndex = Math.floor(Math.random() * activePokemonIds.length);
    return activePokemonIds[randomIndex];
}

// 2. Busca e exibe um novo Pokémon
async function fetchNewPokemon() {
    // 1. Limpa o estado anterior
    feedbackMessage.textContent = '';
    pokemonImage.classList.remove('revealed'); // Remove a revelação do anterior
    pokemonImage.classList.add('hidden'); // Garante que o filtro preto esteja ativo
    pokemonImage.src = ''; // Limpa a imagem anterior para evitar "flash"

    // 2. Busca o Pokémon
    const randomId = getRandomPokemonId();
    const url = `https://pokeapi.co/api/v2/pokemon/${randomId}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Falha ao buscar Pokémon');
        }
        const data = await response.json();

        // 3. Armazena o nome e atualiza a imagem
        // Remove hifens e padroniza para letras minúsculas para simplificar a comparação
        correctPokemonName = data.name.toLowerCase().replace('-', ' '); 
        
        // A API usa o ID para a imagem oficial (versão colorida)
        const imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${randomId}.png`;
        pokemonImage.src = imageUrl;
        pokemonImage.alt = `Silhueta do Pokémon ${data.name}`;

    // Inicia o cronômetro para este Pokémon específico
    timeStartedForPokemon = Date.now();

        // 4. Cria os slots para as letras
        createLetterSlots(correctPokemonName);

    } catch (error) {
        console.error('Erro:', error);
        feedbackMessage.textContent = translations[currentLang].loadError;
    }
}

// 3. Cria os blocos de letras para o nome do Pokémon
function createLetterSlots(name) {
    guessContainer.innerHTML = ''; // Limpa os slots anteriores

    for (let i = 0; i < name.length; i++) {
        // Se o caractere for um espaço, cria um elemento diferente
        if (name[i] === ' ') {
            const space = document.createElement('div');
            space.className = 'letter-space'; // Pode ser estilizado no CSS se desejar
            space.style.width = '20px'; // Espaço entre palavras
            guessContainer.appendChild(space);
            continue;
        }

        const slot = document.createElement('input');
        slot.type = 'text';
        slot.maxLength = 1;
        slot.classList.add('letter-slot');
        slot.dataset.index = i;
        guessContainer.appendChild(slot);
    }
    setupSlotListeners(guessContainer);
    // Foca no primeiro slot de input
    guessContainer.querySelector('input.letter-slot')?.focus();
}

// 3b. Cria os blocos de letras para o modo MULTIPLAYER
function createMultiplayerLetterSlots(name) {
    myGuessContainer.innerHTML = ''; // Limpa seus slots
    opponentGuessContainer.innerHTML = ''; // Limpa os slots do oponente

    for (let i = 0; i < name.length; i++) {
        const isSpace = name[i] === ' ';

        // Cria slots para o jogador
        const mySlot = isSpace ? document.createElement('div') : document.createElement('input');
        mySlot.className = isSpace ? 'letter-space' : 'letter-slot';
        if (!isSpace) {
            mySlot.type = 'text';
            mySlot.maxLength = 1;
            mySlot.dataset.index = i;
        } else {
            mySlot.style.width = '20px';
        }
        myGuessContainer.appendChild(mySlot);

        // Cria slots "vazios" para o oponente
        const opponentSlot = document.createElement('div');
        opponentSlot.className = isSpace ? 'letter-space' : 'letter-slot';
        if (isSpace) opponentSlot.style.width = '20px';
        opponentGuessContainer.appendChild(opponentSlot);
    }
    setupSlotListeners(myGuessContainer); // Passa o container correto
    myGuessContainer.querySelector('input.letter-slot')?.focus();
}

// 4. Adiciona os listeners de eventos para os slots
function setupSlotListeners(container) {
    const slots = container.querySelectorAll('input.letter-slot');
    slots.forEach((slot, index) => {
        slot.addEventListener('input', (e) => {
            const typedChar = e.target.value.toLowerCase();
            const correctChar = correctPokemonName[slot.dataset.index].toLowerCase();

            if (typedChar === correctChar) {
                slot.classList.remove('incorrect');
                slot.classList.add('correct');
                
                // --- LÓGICA MULTIPLAYER ---
                // Envia o progresso para o servidor
                const roomId = document.body.dataset.roomId;
                if (roomId) {
                    socket.emit('playerProgress', { roomId, progressHtml: myGuessContainer.innerHTML });
                }

                // Move para o próximo slot
                const nextSlot = slots[index + 1];
                if (nextSlot) {
                    nextSlot.focus();
                } else { // Se for o último slot
                    handleCorrectGuess();
                }
            } else {
                slot.classList.add('incorrect', 'shake');
                // Vibra o dispositivo, se suportado
                if (navigator.vibrate) {
                    navigator.vibrate(200); // Vibra por 200ms
                }
                // Limpa o campo após a animação para o usuário tentar de novo
                setTimeout(() => {
                    slot.value = '';
                    slot.classList.remove('shake');
                }, 500);
            }
        });

        // Impede que o jogador apague manualmente os caracteres
        slot.addEventListener('keydown', (e) => {
            // Previne a ação padrão da tecla Backspace (apagar)
            if (e.key === 'Backspace') e.preventDefault();
        });

        // Impede que o jogador clique em slots que não sejam o próximo vazio
        slot.addEventListener('focus', (e) => {
            const firstEmptySlot = Array.from(slots).find(s => s.value === '');
            
            // Se o slot que recebeu o foco não for o primeiro slot vazio,
            // e existe um slot vazio para focar, redireciona o foco.
            if (firstEmptySlot && e.target !== firstEmptySlot) {
                e.target.blur(); // Remove o foco do slot clicado
                firstEmptySlot.focus(); // Foca no slot correto
            }
        });
    });
}

// 4. Atualiza o cronômetro
function updateTimer() {
    if (gameArea.classList.contains('active')) {
        timeLeft--;
        timerDisplay.textContent = timeLeft;
        if (timeLeft <= 0) {
            endGame();
        }
    }
    // O timer do multiplayer é controlado pelo servidor e atualizado pelo evento 'timerTick'
}

// 5. Finaliza o jogo
function endGame() {
    clearInterval(timerInterval);

    // Desabilita todos os slots
    guessContainer.querySelectorAll('input.letter-slot').forEach(slot => {
        slot.disabled = true;
    });

    // Verifica e salva a pontuação mais alta
    if (currentScore > highScore) {
        highScore = currentScore;
        localStorage.setItem('pokeTyperHighScore', highScore);
        highScoreLabel.textContent = `${translations[currentLang].highScore}: ${highScore}`;
    }

    // Revela o Pokémon e mostra a mensagem de fim de jogo
    pokemonImage.classList.remove('hidden');
    pokemonImage.classList.add('revealed');
    feedbackMessage.textContent = translations[currentLang].timeUp.replace('{pokemonName}', correctPokemonName.toUpperCase());
    feedbackMessage.className = 'info';
    startButton.textContent = translations[currentLang].playAgain;
    startButton.style.display = 'block';
    settingsButton.disabled = false; // Reabilita o botão de configurações
}

// 4. Inicia ou reinicia o jogo
function startGame() {
    // Reseta o estado do jogo
    startButton.style.display = 'none'; // Esconde o botão de começar
    gameArea.classList.add('active'); // Mostra a área do jogo
    correctGuessesCount = 0; // Zera o contador de acertos
    currentScore = 0;
    document.getElementById('check-button').style.display = 'none';
    guessesLabel.innerHTML = `${translations[currentLang].guesses}: <span id="guesses-count">0</span>`;
    scoreLabel.textContent = `${translations[currentLang].score}: ${currentScore}`;
    settingsButton.disabled = true; // Desabilita o botão de configurações durante o jogo

    timerDisplay = document.getElementById('time-left'); // Re-seleciona o elemento do timer
    // Reseta e inicia o cronômetro
    timeLeft = GAME_TIME;
    timerDisplay.textContent = timeLeft;
    clearInterval(timerInterval); // Limpa qualquer cronômetro anterior
    timerInterval = setInterval(updateTimer, 1000);

    fetchNewPokemon();
}

function handleCorrectGuess() {
    // Calcula o tempo gasto para acertar
    const timeEnded = Date.now();
    const timeTaken = (timeEnded - timeStartedForPokemon) / 1000; // em segundos

    // Calcula a pontuação baseada no tempo
    let points = 0;
    const difficultyMultiplier = Math.sqrt(60 / GAME_TIME); 

    if (timeTaken < MAX_GUESS_TIME) {
        const basePoints = (MAX_GUESS_TIME - timeTaken) * SCORE_MULTIPLIER;
        points = Math.round(basePoints * difficultyMultiplier);
    }

    // --- LÓGICA MULTIPLAYER ---
    const roomId = document.body.dataset.roomId;
    if (roomId) {
        // Se estiver em modo multiplayer, avisa o servidor que terminou
        socket.emit('playerFinished', { roomId });
        return; // Não busca o próximo pokémon, espera o servidor mandar
    }

    // Lógica de um jogador (que foi removida por engano)
    currentScore += Math.max(points, MINIMUM_SCORE); // Adiciona a pontuação calculada ou a mínima
    scoreLabel.textContent = `${translations[currentLang].score}: ${currentScore}`;

    correctGuessesCount++; // Incrementa o contador de acertos
    guessesLabel.innerHTML = `${translations[currentLang].guesses}: <span id="guesses-count">${correctGuessesCount}</span>`;

    feedbackMessage.textContent = translations[currentLang].correctGuess.replace('{pokemonName}', correctPokemonName.toUpperCase());
    feedbackMessage.className = 'correct';
    pokemonImage.classList.remove('hidden');
    pokemonImage.classList.add('revealed');
    setTimeout(fetchNewPokemon, 1500);
}

function toggleMusic() {
    if (backgroundMusic.paused) {
        backgroundMusic.play().catch(error => {
            console.log("A reprodução da música foi impedida pelo navegador:", error);
        });
        musicToggleButton.textContent = '🎵';
    } else {
        backgroundMusic.pause();
        musicToggleButton.textContent = '🔇';
    }
}

// Função para aplicar o tema
function applyTheme(theme) {
    document.body.classList.remove('light-theme', 'dark-theme', 'oldschool-theme');
    if (theme !== 'light') { // 'light' é o padrão, não precisa de classe
        document.body.classList.add(`${theme}-theme`);
    }
}

function setLanguage() {
    const lang = navigator.language.split('-')[0];
    currentLang = (lang === 'pt') ? 'pt' : 'en'; // Define o idioma atual

    const t = translations[currentLang];

    // Atualiza todos os textos estáticos da página
    gameTitle.textContent = t.title;
    startButton.textContent = t.startButton;
    copyrightFooter.innerHTML = t.footer;
    settingsTitle.textContent = t.settingsTitle;
    generationsLabel.textContent = t.generationsLabel;
    timeSettingsLabel.textContent = t.timeSettingsLabel;
    themeSettingsLabel.textContent = t.themeSettingsLabel;

    // Atualiza textos que também são alterados durante o jogo
    timerLabel.innerHTML = `${t.time}: <span id="time-left">${GAME_TIME}</span>s`;
    highScoreLabel.textContent = `${t.highScore}: ${highScore}`;
    scoreLabel.textContent = `${t.score}: 0`;
    guessesLabel.innerHTML = `${t.guesses}: <span id="guesses-count">0</span>`;
}

// --- Event Listeners ---

// Inicia o jogo
startButton.addEventListener('click', startGame);

startMultiplayerButton.addEventListener('click', () => {
    const roomId = document.body.dataset.roomId;
    socket.emit('startMatch', roomId);
});

// Controla a música
musicToggleButton.addEventListener('click', toggleMusic);

// Aplica o tema imediatamente ao clicar na opção
themeRadioButtons.forEach(radio => {
    radio.addEventListener('change', () => {
        applyTheme(radio.value);
    });
});

// Controla o modal de configurações
settingsButton.addEventListener('click', () => {
    settingsModal.classList.add('visible');
});

saveSettingsButton.addEventListener('click', () => {
    updateActivePokemonList();
    // Atualiza a variável GAME_TIME com o valor selecionado
    const selectedTime = document.querySelector('input[name="game-time"]:checked').value;
    GAME_TIME = parseInt(selectedTime, 10);
    timerLabel.innerHTML = `${translations[currentLang].time}: <span id="time-left">${GAME_TIME}</span>s`;

    // Aplica o tema selecionado e salva no localStorage
    const selectedTheme = document.querySelector('input[name="theme"]:checked').value;
    localStorage.setItem('pokeTyperTheme', selectedTheme);

    settingsModal.classList.remove('visible');
    //fetchNewPokemon(); // Carrega um novo Pokémon com as novas configurações
});

// Inicialização: Carrega o primeiro Pokémon assim que a página é carregada
// mas o esconde até que o usuário clique em "Começar Jogo"
document.addEventListener('DOMContentLoaded', () => {
    // Carrega e aplica o tema salvo
    const savedTheme = localStorage.getItem('pokeTyperTheme') || 'light';
    document.querySelector(`input[name="theme"][value="${savedTheme}"]`).checked = true;
    applyTheme(savedTheme);

    // Carrega a pontuação mais alta salva
    highScore = parseInt(localStorage.getItem('pokeTyperHighScore')) || 0;

    // Adiciona o novo contador de acertos ao DOM, logo após a pontuação
    guessesLabel.id = 'guesses-label';
    guessesLabel.className = 'stat-item';
    scoreLabel.parentNode.insertBefore(guessesLabel, highScoreLabel);

    setLanguage();
    updateActivePokemonList(); // Define a lista inicial de Pokémon (Gen 1)
    fetchNewPokemon();
});

// --- Lógica Multiplayer com Socket.IO ---

// Conecta ao seu servidor
const socket = io("http://localhost:3000"); 

multiplayerButton.addEventListener('click', () => {
    multiplayerModal.classList.add('visible');
});

createRoomButton.addEventListener('click', () => {
    socket.emit('createRoom');
});

joinRoomButton.addEventListener('click', () => {
    const roomId = joinRoomInput.value.trim().toUpperCase();
    if (roomId) {
        socket.emit('joinRoom', roomId);
    }
});

// --- Exemplo de como você lidaria com eventos do servidor ---

socket.on('roomCreated', (roomId) => {
    roomIdDisplay.textContent = roomId;
    roomInfo.classList.remove('hidden');
    // Armazena o ID da sala para uso futuro
    document.body.dataset.roomId = roomId;
});

socket.on('roomJoined', (data) => {
    const { roomId } = data;
    // Armazena o ID da sala para uso futuro (para o jogador que entra)
    document.body.dataset.roomId = roomId;
});

socket.on('roomReady', (data) => {
    // A sala está pronta, com 2 jogadores. Prepara a interface para AMBOS.
    multiplayerModal.classList.remove('visible');
    mainContainer.classList.add('multiplayer-active');
    gameArea.style.display = 'none';
    multiplayerGameArea.classList.add('active');

    // Esconde os botões de modo de jogo para ambos os jogadores
    document.querySelector('.game-modes').style.display = 'none';

    if (data.hostId === socket.id) {
        startMultiplayerButton.classList.remove('hidden');
    }
});

socket.on('gameStart', (data) => {
    multiplayerModal.classList.remove('visible');
    mainContainer.classList.add('multiplayer-active'); // Expande o container principal
    gameArea.style.display = 'none'; // Esconde a área de um jogador
    multiplayerGameArea.classList.add('active'); // Mostra a área multiplayer
    settingsButton.disabled = true;
    startMultiplayerButton.classList.add('hidden'); // ESCONDE o botão para TODOS

    correctPokemonName = data.pokemonName;
    
    // Configura a imagem e os slots
    document.getElementById('multiplayer-pokemon-image').src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.pokemonId}.png`;
    document.getElementById('multiplayer-pokemon-image').classList.add('hidden');
    createMultiplayerLetterSlots(data.pokemonName);

    // O timer do multiplayer é apenas visual e controlado pelo servidor
    const multiplayerTimerDisplay = document.getElementById('multiplayer-time-left');
    multiplayerTimerDisplay.textContent = data.gameTime;

});

socket.on('nextRound', (data) => {
    multiplayerRoundFeedback.textContent = '';
    correctPokemonName = data.pokemonName;
    document.getElementById('multiplayer-pokemon-image').src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.pokemonId}.png`;
    // Garante que a imagem esteja pronta para a próxima rodada
    document.getElementById('multiplayer-pokemon-image').classList.remove('revealed');
    document.getElementById('multiplayer-pokemon-image').classList.add('hidden');
    createMultiplayerLetterSlots(data.pokemonName);
});

socket.on('roundEnd', (data) => {
    const { winnerId } = data;
    if (winnerId === socket.id) {
        // Você venceu!
        multiplayerRoundFeedback.textContent = "Você venceu a rodada!";
        multiplayerRoundFeedback.className = 'correct';
    } else {
        // Você perdeu!
        multiplayerRoundFeedback.textContent = "Você perdeu a rodada!";
        multiplayerRoundFeedback.className = 'incorrect';
    }
    // Revela o Pokémon para todos
    document.getElementById('multiplayer-pokemon-image').classList.remove('hidden');
    document.getElementById('multiplayer-pokemon-image').classList.add('revealed');
});

socket.on('opponentProgress', (data) => {
    opponentGuessContainer.innerHTML = data.progressHtml;
});

socket.on('updateScores', (scores) => {
    const myScore = scores.find(s => s.id === socket.id)?.score || 0;
    const opponentScore = scores.find(s => s.id !== socket.id)?.score || 0;

    myScoreDisplay.textContent = `Pontos: ${myScore}`;
    opponentScoreDisplay.textContent = `Pontos: ${opponentScore}`;
});

socket.on('timerTick', (timeLeft) => {
    const multiplayerTimerDisplay = document.getElementById('multiplayer-time-left');
    if (multiplayerTimerDisplay) {
        multiplayerTimerDisplay.textContent = timeLeft;
    }
});

socket.on('matchEnd', (data) => {
    const { winnerId } = data;
    let finalMessage = '';
    if (winnerId === 'draw') {
        finalMessage = "Empate!";
    } else if (winnerId === socket.id) {
        finalMessage = "Você venceu o jogo!";
    } else {
        finalMessage = "Você perdeu o jogo!";
    }
    multiplayerRoundFeedback.textContent = finalMessage;
    settingsButton.disabled = false; // Reabilita o botão de configurações
    startMultiplayerButton.classList.remove('hidden'); // REAPARECE o botão
    startMultiplayerButton.disabled = false; // REABILITA o botão para uma nova partida
});

socket.on('error', (message) => {
    alert(message);
});

// Adiciona um listener global para "prender" o foco nos inputs do jogo
document.addEventListener('click', (event) => {
    // Só executa a lógica se a área do jogo estiver ativa
    if (!gameArea.classList.contains('active') && !multiplayerGameArea.classList.contains('active')) {
        return;
    }

    const target = event.target;

    // Permite que o usuário clique em botões e nos próprios inputs sem interferência
    if (target.tagName === 'BUTTON' || target.tagName === 'INPUT') {
        return;
    }

    // Determina qual container de input está ativo
    const activeContainer = multiplayerGameArea.classList.contains('active') ? myGuessContainer : guessContainer;

    // Se o clique foi em qualquer outro lugar, encontra o primeiro slot vazio e foca nele
    const firstEmptySlot = Array.from(activeContainer.querySelectorAll('input.letter-slot')).find(slot => slot.value === '');

    if (firstEmptySlot) {
        firstEmptySlot.focus();
    } else {
        // Se não houver slots vazios (caso raro), foca no último
        activeContainer.querySelector('input.letter-slot:last-child')?.focus();
    }
});
