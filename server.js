// 1. Importar as bibliotecas necessárias
const express = require('express');
const { createServer } = require("http");
const path = require('path');
const { Server } = require("socket.io");
const fetch = require('node-fetch'); // Importa a biblioteca node-fetch

// 2. Configurar o servidor
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000", // Permite conexões vindas do seu próprio jogo
    methods: ["GET", "POST"]
  }
});

// 3. Servir os arquivos do seu jogo (o frontend)
const publicPath = path.join(__dirname);
app.use(express.static(publicPath));

app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

// --- Lógica do Jogo Multiplayer ---

// Função para iniciar o jogo em uma sala
function startGameForRoom(roomId) {
    // Sorteia um Pokémon
    const pokemonId = Math.floor(Math.random() * 151) + 1; // Exemplo simples com Gen 1

    fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`)
        .then(res => res.json())
        .then(data => {
            if (rooms[roomId]) { // Garante que a sala ainda existe
                const pokemonName = data.name.toLowerCase().replace('-', ' ');
                rooms[roomId].pokemonName = pokemonName;
                // Envia o sinal de início para TODOS na sala
                io.to(roomId).emit('gameStart', { pokemonName, pokemonId: pokemonId, gameTime: 60 });
            }
        }).catch(err => console.error("Erro ao iniciar jogo para a sala:", err));
}

let rooms = {}; // Objeto para armazenar o estado de todas as salas

io.on('connection', (socket) => {
    console.log(`Jogador conectado: ${socket.id}`);

    // Evento para criar uma nova sala
    socket.on('createRoom', () => {
        // Gera um código de 4 letras aleatório
        const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
        socket.join(roomId); // Coloca o jogador na sala
        rooms[roomId] = {
            players: [{ id: socket.id, score: 0 }],
            pokemonName: '' // Pokémon será definido quando o jogo começar
        };
        socket.emit('roomCreated', roomId); // Envia o código da sala de volta para o criador
    });

    // Evento para entrar em uma sala existente
    socket.on('joinRoom', (roomId) => {
        if (rooms[roomId] && rooms[roomId].players.length < 2) {
            socket.join(roomId);
            rooms[roomId].players.push({ id: socket.id, score: 0 });
            // Agora que a sala tem 2 jogadores, inicia o jogo para ambos.
            startGameForRoom(roomId);
        } else {
            socket.emit('error', 'Sala não encontrada ou está cheia.');
        }
    });

    // Evento para quando um jogador acerta o nome
    socket.on('playerFinished', (data) => {
        const { roomId } = data;
        // Informa a todos na sala que alguém venceu a rodada
        io.to(roomId).emit('roundEnd', { winnerId: socket.id });

        // Prepara a próxima rodada após um pequeno atraso
        setTimeout(() => {
            // Sorteia um novo Pokémon e inicia a próxima rodada
            const pokemonId = Math.floor(Math.random() * 151) + 1;
            fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`)
                .then(res => res.json())
                .then(pokemonData => { // Adicionado .catch para robustez
                    if (rooms[roomId]) { // Verifica se a sala ainda existe
                        const pokemonName = pokemonData.name.toLowerCase().replace('-', ' ');
                        rooms[roomId].pokemonName = pokemonName;
                        io.to(roomId).emit('nextRound', { pokemonName, pokemonId: pokemonId });
                    }
                }).catch(err => console.error("Erro ao buscar próximo Pokémon:", err));
        }, 3000); // 3 segundos para a próxima rodada
    });

    // Evento para retransmitir o progresso de um jogador
    socket.on('playerProgress', (data) => {
        const { roomId, progressHtml } = data;
        // Envia o progresso para o OUTRO jogador na sala
        socket.to(roomId).emit('opponentProgress', { progressHtml });
    });

    // Evento para quando um jogador se desconecta
    socket.on('disconnect', () => {
        console.log(`Jogador desconectado: ${socket.id}`);
        // Lógica para remover o jogador das salas, se necessário
    });
});


// 4. Iniciar o servidor
const PORT = 3000;
httpServer.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}. Acesse http://localhost:${PORT}`);
});
