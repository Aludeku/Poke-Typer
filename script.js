// Variáveis Globais
const POKEMON_COUNT = 151; // Limita o jogo aos Pokémon da Geração 1
const GAME_TIME = 60; // Segundos
let correctPokemonName = '';
let currentScore = 0;
let timeLeft = GAME_TIME;
let timerInterval = null;

// Seletores do DOM
const pokemonImage = document.getElementById('pokemon-image');
const guessInput = document.getElementById('guess-input');
const checkButton = document.getElementById('check-button');
const feedbackMessage = document.getElementById('feedback-message');
const scoreDisplay = document.getElementById('score');
const startButton = document.getElementById('start-button');
const gameArea = document.getElementById('game-area');
const timerDisplay = document.getElementById('time-left');

// --- Funções Principais ---

// 1. Gera um número aleatório (ID do Pokémon)
function getRandomPokemonId() {
    return Math.floor(Math.random() * POKEMON_COUNT) + 1;
}

// 2. Busca e exibe um novo Pokémon
async function fetchNewPokemon() {
    // 1. Limpa o estado anterior
    guessInput.value = '';
    feedbackMessage.textContent = '';
    pokemonImage.classList.add('hidden'); // Silhueta

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

    } catch (error) {
        console.error('Erro:', error);
        feedbackMessage.textContent = 'Erro ao carregar Pokémon. Tente novamente.';
    }
}

// 3. Verifica o palpite do usuário
function checkGuess() {
    const userGuess = guessInput.value.toLowerCase().trim().replace('-', ' ');

    if (!userGuess) {
        feedbackMessage.textContent = 'Por favor, digite um nome!';
        feedbackMessage.className = 'incorrect';
        return;
    }

    if (userGuess === correctPokemonName) {
        // ACERTOU!
        currentScore++;
        scoreDisplay.textContent = `Pontuação: ${currentScore}`;
        feedbackMessage.textContent = `Parabéns! É o ${correctPokemonName.toUpperCase()}!`;
        feedbackMessage.className = 'correct';

        // Revela a imagem
        pokemonImage.classList.remove('hidden');
        pokemonImage.classList.add('revealed');
        
        // Carrega o próximo Pokémon após um breve atraso
        setTimeout(fetchNewPokemon, 1500); // 1.5 segundos
    } else {
        // ERROU!
        feedbackMessage.textContent = 'Nome incorreto. Tente novamente.';
        feedbackMessage.className = 'incorrect';
    }
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
    guessInput.disabled = true;
    checkButton.disabled = true;
    feedbackMessage.textContent = `Tempo esgotado! Sua pontuação final: ${currentScore}.`;
    feedbackMessage.className = 'info';
    startButton.textContent = 'Jogar Novamente';
    startButton.style.display = 'block';
}

// 4. Inicia ou reinicia o jogo
function startGame() {
    // Reseta o estado do jogo
    startButton.style.display = 'none'; // Esconde o botão de começar
    gameArea.classList.add('active'); // Mostra a área do jogo
    currentScore = 0;
    scoreDisplay.textContent = `Pontuação: ${currentScore}`;
    guessInput.disabled = false;
    checkButton.disabled = false;

    // Reseta e inicia o cronômetro
    timeLeft = GAME_TIME;
    timerDisplay.textContent = timeLeft;
    clearInterval(timerInterval); // Limpa qualquer cronômetro anterior
    timerInterval = setInterval(updateTimer, 1000);

    fetchNewPokemon();
}

// --- Event Listeners ---

// Inicia o jogo
startButton.addEventListener('click', startGame);

// Botão de Verificação
checkButton.addEventListener('click', checkGuess);

// Permite verificar o palpite ao pressionar "Enter"
guessInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        checkGuess();
    }
});

// Inicialização: Carrega o primeiro Pokémon assim que a página é carregada
// mas o esconde até que o usuário clique em "Começar Jogo"
document.addEventListener('DOMContentLoaded', fetchNewPokemon);