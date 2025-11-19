// Variáveis Globais
const POKEMON_COUNT = 151; // Limita o jogo aos Pokémon da Geração 1
const GAME_TIME = 60; // Segundos
let correctPokemonName = '';
let currentScore = 0;
let timeLeft = GAME_TIME;
let timerInterval = null;
let currentLang = 'en'; // Define 'en' como idioma padrão

// Seletores do DOM
const pokemonImage = document.getElementById('pokemon-image');
const guessContainer = document.getElementById('guess-container');
const feedbackMessage = document.getElementById('feedback-message');
const startButton = document.getElementById('start-button');
const gameArea = document.getElementById('game-area');
let timerDisplay = document.getElementById('time-left'); // Alterado para let
const backgroundMusic = document.getElementById('background-music');
const musicToggleButton = document.getElementById('music-toggle-button');
// Elementos de texto para tradução
const gameTitle = document.getElementById('game-title');
const timerLabel = document.getElementById('timer-label');
const scoreLabel = document.getElementById('score-label');
const copyrightFooter = document.getElementById('copyright-footer');

backgroundMusic.volume = 0.03;

// Textos para internacionalização (i18n)
const translations = {
    pt: {
        title: 'Quem é Esse Pokémon?',
        score: 'Pontuação',
        time: 'Tempo',
        startButton: 'Começar Jogo',
        playAgain: 'Jogar Novamente',
        correctGuess: 'Parabéns! É o {pokemonName}!',
        timeUp: 'Tempo esgotado! Sua pontuação final: {score}.',
        loadError: 'Erro ao carregar Pokémon. Tente novamente.',
        footer: 'Desenvolvido por <a href="https://x.com/Aludeku2" target="_blank" rel="noopener noreferrer">Aludeku</a>. Pokemon é propriedade de ©GameFreak ©CreaturesInk e ©Nintendo.',
    },
    en: {
        title: 'Who\'s That Pokémon?',
        score: 'Score',
        time: 'Time',
        startButton: 'Start Game',
        playAgain: 'Play Again',
        correctGuess: 'Congratulations! It\'s {pokemonName}!',
        timeUp: 'Time\'s up! Your final score: {score}.',
        loadError: 'Error loading Pokémon. Please try again.',
        footer: 'Developed by <a href="https://x.com/Aludeku2" target="_blank" rel="noopener noreferrer">Aludeku</a>. Pokemon is property of ©GameFreak ©CreaturesInk and ©Nintendo.',
    }
};

// --- Funções Principais ---

// 1. Gera um número aleatório (ID do Pokémon)
function getRandomPokemonId() {
    return Math.floor(Math.random() * POKEMON_COUNT) + 1;
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
    setupSlotListeners();
    // Foca no primeiro slot de input
    guessContainer.querySelector('input.letter-slot')?.focus();
}

// 4. Adiciona os listeners de eventos para os slots
function setupSlotListeners() {
    const slots = guessContainer.querySelectorAll('input.letter-slot');
    slots.forEach((slot, index) => {
        slot.addEventListener('input', (e) => {
            const typedChar = e.target.value.toLowerCase();
            const correctChar = correctPokemonName[slot.dataset.index].toLowerCase();

            if (typedChar === correctChar) {
                slot.classList.remove('incorrect');
                slot.classList.add('correct');
                
                // Move para o próximo slot
                if (index < slots.length - 1) {
                    slots[index + 1].focus();
                } else {
                    // Se for o último, verifica se o jogo foi ganho
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
    timeLeft--;
    timerDisplay.textContent = timeLeft;
    if (timeLeft <= 0) {
        endGame();
    }
}

// 5. Finaliza o jogo
function endGame() {
    clearInterval(timerInterval);
    // Desabilita todos os slots
    guessContainer.querySelectorAll('input.letter-slot').forEach(slot => {
        slot.disabled = true;
    });
    document.getElementById('check-button').style.display = 'none'; // Esconde o botão de verificar
    feedbackMessage.textContent = translations[currentLang].timeUp.replace('{score}', currentScore);
    feedbackMessage.className = 'info';
    startButton.textContent = translations[currentLang].playAgain;
    startButton.style.display = 'block';
}

// 4. Inicia ou reinicia o jogo
function startGame() {
    // Reseta o estado do jogo
    startButton.style.display = 'none'; // Esconde o botão de começar
    gameArea.classList.add('active'); // Mostra a área do jogo
    currentScore = 0;
    document.getElementById('check-button').style.display = 'none';
    scoreLabel.textContent = `${translations[currentLang].score}: ${currentScore}`;

    timerDisplay = document.getElementById('time-left'); // Re-seleciona o elemento do timer
    // Reseta e inicia o cronômetro
    timeLeft = GAME_TIME;
    timerDisplay.textContent = timeLeft;
    clearInterval(timerInterval); // Limpa qualquer cronômetro anterior
    timerInterval = setInterval(updateTimer, 1000);

    fetchNewPokemon();
}

function handleCorrectGuess() {
    currentScore++;
    scoreLabel.textContent = `${translations[currentLang].score}: ${currentScore}`;
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


function setLanguage() {
    const lang = navigator.language.split('-')[0];
    currentLang = (lang === 'pt') ? 'pt' : 'en'; // Define o idioma atual

    const t = translations[currentLang];

    // Atualiza todos os textos estáticos da página
    gameTitle.textContent = t.title;
    startButton.textContent = t.startButton;
    copyrightFooter.innerHTML = t.footer;

    // Atualiza textos que também são alterados durante o jogo
    timerLabel.innerHTML = `${t.time}: <span id="time-left">${GAME_TIME}</span>s`;
    scoreLabel.textContent = `${t.score}: 0`;
}

// --- Event Listeners ---

// Inicia o jogo
startButton.addEventListener('click', startGame);

// Controla a música
musicToggleButton.addEventListener('click', toggleMusic);

// Inicialização: Carrega o primeiro Pokémon assim que a página é carregada
// mas o esconde até que o usuário clique em "Começar Jogo"
document.addEventListener('DOMContentLoaded', () => {
    setLanguage();
    fetchNewPokemon();
});

// Adiciona um listener global para "prender" o foco nos inputs do jogo
document.addEventListener('click', (event) => {
    // Só executa a lógica se a área do jogo estiver ativa
    if (!gameArea.classList.contains('active')) {
        return;
    }

    const target = event.target;

    // Permite que o usuário clique em botões e nos próprios inputs sem interferência
    if (target.tagName === 'BUTTON' || target.tagName === 'INPUT') {
        return;
    }

    // Se o clique foi em qualquer outro lugar, encontra o primeiro slot vazio e foca nele
    const firstEmptySlot = Array.from(guessContainer.querySelectorAll('input.letter-slot')).find(slot => slot.value === '');

    if (firstEmptySlot) {
        firstEmptySlot.focus();
    } else {
        // Se não houver slots vazios (caso raro), foca no último
        guessContainer.querySelector('input.letter-slot:last-child')?.focus();
    }
});
