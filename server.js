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
            const room = rooms[roomId];
            
            // Limpa qualquer timer antigo que possa estar rodando para evitar duplicação
            if (room && room.timerInterval) {
                clearInterval(room.timerInterval);
            }

            if (room) { // Garante que a sala ainda existe
                const pokemonName = data.name.toLowerCase().replace('-', ' ');
                room.pokemonName = pokemonName;
                room.roundOver = false; // Inicia a rodada como "não terminada"

                // Zera a pontuação da partida atual para todos os jogadores
                room.players.forEach(player => {
                    player.score = 0;
                });

                // Envia o sinal de início para TODOS na sala
                const gameTime = 60; // Tempo fixo para multiplayer
                room.gameTimer = gameTime;

                io.to(roomId).emit('gameStart', { pokemonName, pokemonId: pokemonId, gameTime });

                // Inicia o cronômetro do jogo no servidor
                room.timerInterval = setInterval(() => {
                    room.gameTimer--;
                    io.to(roomId).emit('timerTick', room.gameTimer);

                    if (room.gameTimer <= 0) {
                        clearInterval(room.timerInterval);
                        // Determina o vencedor
                        const player1 = room.players[0];
                        const player2 = room.players[1];
                        const winnerId = player1.score > player2.score ? player1.id : (player2.score > player1.score ? player2.id : 'draw');
                        
                        // Incrementa a contagem de vitórias da partida
                        const winnerPlayer = room.players.find(p => p.id === winnerId);
                        if (winnerPlayer) {
                            winnerPlayer.matchWins++;
                        }
                        io.to(roomId).emit('matchEnd', { winnerId, players: room.players });
                    }
                }, 1000);
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
            players: [{ id: socket.id, score: 0, matchWins: 0 }], // Inicializa matchWins aqui
            pokemonName: '', // Pokémon será definido quando o jogo começar
            roundOver: true // A rodada está "terminada" até o jogo começar
        };
        socket.emit('roomCreated', roomId); // Envia o código da sala de volta para o criador
    });

    // Evento para entrar em uma sala existente
    socket.on('joinRoom', (roomId) => {
        if (rooms[roomId] && rooms[roomId].players.length < 2) {
            socket.join(roomId);
            rooms[roomId].players.push({ id: socket.id, score: 0, matchWins: 0 }); // Inicializa matchWins aqui também
            // Agora que a sala tem 2 jogadores, inicia o jogo para ambos.
            // Informa ao jogador que entrou qual é o ID da sala.
            socket.emit('roomJoined', { roomId });
            // Notifica a todos na sala que ela está pronta para começar
            io.to(roomId).emit('roomReady', { hostId: rooms[roomId].players[0].id });
        } else {
            socket.emit('error', 'Sala não encontrada ou está cheia.');
        }
    });
    // O listener 'join-room' foi removido, pois matchWins é inicializado acima.

    // Evento para quando um jogador acerta o nome
    socket.on('playerFinished', (data) => {
        const { roomId } = data;
        const room = rooms[roomId];

        // Garante que a sala existe e que a rodada ainda não terminou
        if (!room || room.roundOver) {
            return;
        }

        // Marca a rodada como terminada para evitar múltiplos vencedores
        room.roundOver = true;

        // Encontra o jogador que acertou e incrementa sua pontuação
        const winningPlayer = room.players.find(p => p.id === socket.id);
        if (winningPlayer) {
            winningPlayer.score++;
        }

        // Informa a todos na sala que alguém venceu a rodada
        io.to(roomId).emit('roundEnd', { winnerId: socket.id });

        // Envia a atualização de pontuação para todos na sala
        const scores = room.players.map(p => ({ id: p.id, score: p.score, matchWins: p.matchWins }));
        io.to(roomId).emit('updateScores', scores);

        // Prepara a próxima rodada após um pequeno atraso
        setTimeout(() => {
            // Verifica se o tempo da partida não acabou
            if (room && room.gameTimer > 0) {
                // Sorteia um novo Pokémon e inicia a próxima rodada
                const pokemonId = Math.floor(Math.random() * 151) + 1;
                fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`)
                    .then(res => res.json())
                    .then(pokemonData => {
                        room.roundOver = false; // Reabre a rodada
                        room.pokemonName = pokemonData.name.toLowerCase().replace('-', ' ');
                        io.to(roomId).emit('nextRound', { pokemonName: room.pokemonName, pokemonId });
                    }).catch(err => console.error("Erro ao buscar próximo Pokémon:", err));
            }
        }, 3000); // 3 segundos para a próxima rodada
    });

    // Evento para retransmitir o progresso de um jogador
    socket.on('playerProgress', (data) => {
        const { roomId, progressHtml } = data;
        // Envia o progresso para o OUTRO jogador na sala
        socket.to(roomId).emit('opponentProgress', { progressHtml });
    });

    // Evento para o host iniciar a partida
    socket.on('startMatch', (roomId) => {
        const room = rooms[roomId];
        // IMPEDE que a partida seja reiniciada se o timer já estiver rodando
        if (room && room.gameTimer > 0) {
            console.log(`Tentativa de reiniciar a partida na sala ${roomId} foi bloqueada.`);
            return;
        }

        // Inicia o jogo para a sala
        startGameForRoom(roomId);
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
