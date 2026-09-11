const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// -------------------- In-memory rooms --------------------
const rooms = new Map(); // code -> room object

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function createRoom(hostName, socketId) {
  let code;
  do {
    code = generateCode();
  } while (rooms.has(code));

  const room = {
    code,
    hostId: socketId,
    players: [
      { id: socketId, name: hostName, score: 0 }
    ],
    status: 'waiting', // waiting | playing | finished
    level: 'medium',
    totalNumbers: 50,
    board: [],
    currentTarget: null,
    found: new Set(),
    scores: {}
  };

  rooms.set(code, room);
  return room;
}

function getPublicRoom(room) {
  return {
    code: room.code,
    status: room.status,
    level: room.level,
    totalNumbers: room.totalNumbers,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      score: room.scores[p.id] || 0,
      isHost: p.id === room.hostId
    })),
    currentTarget: room.currentTarget,
    foundCount: room.found.size,
    board: room.status === 'playing' || room.status === 'finished' ? room.board : null
  };
}

// -------------------- Board generation --------------------
const DIFFICULTY = {
  medium: { fontMin: 16, fontMax: 26, opacityMin: 0.55, opacityMax: 0.9, rotationRange: 9 },
  hard:   { fontMin: 10, fontMax: 15, opacityMin: 0.22, opacityMax: 0.48, rotationRange: 32 }
};

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildGridPositions(count) {
  if (count === 0) return [];
  const aspect = 400 / 600;
  let cols = Math.max(1, Math.round(Math.sqrt(count * aspect)));
  let rows = Math.ceil(count / cols);
  while (cols * rows < count) rows++;

  const cellW = 100 / cols;
  const cellH = 100 / rows;
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) cells.push({ r, c });
  }
  shuffle(cells);

  return cells.slice(0, count).map(cell => {
    const jitterX = (Math.random() - 0.5) * cellW * 0.6;
    const jitterY = (Math.random() - 0.5) * cellH * 0.6;
    return {
      x: Math.min(96, Math.max(4, cell.c * cellW + cellW / 2 + jitterX)),
      y: Math.min(95, Math.max(5, cell.r * cellH + cellH / 2 + jitterY))
    };
  });
}

function generateBoard(total, level) {
  const settings = DIFFICULTY[level] || DIFFICULTY.medium;
  const numbers = Array.from({ length: total }, (_, i) => i + 1);
  shuffle(numbers);

  const leftNums  = numbers.filter((_, i) => i % 2 === 0);
  const rightNums = numbers.filter((_, i) => i % 2 === 1);

  const leftPos  = buildGridPositions(leftNums.length);
  const rightPos = buildGridPositions(rightNums.length);

  const board = [];

  leftNums.forEach((num, i) => {
    const pos = leftPos[i];
    board.push({
      number: num,
      page: 'left',
      x: pos.x,
      y: pos.y,
      fontSize: Math.floor(Math.random() * (settings.fontMax - settings.fontMin)) + settings.fontMin,
      rotation: Math.floor(Math.random() * (settings.rotationRange * 2 + 1)) - settings.rotationRange,
      opacity: settings.opacityMin + Math.random() * (settings.opacityMax - settings.opacityMin)
    });
  });

  rightNums.forEach((num, i) => {
    const pos = rightPos[i];
    board.push({
      number: num,
      page: 'right',
      x: pos.x,
      y: pos.y,
      fontSize: Math.floor(Math.random() * (settings.fontMax - settings.fontMin)) + settings.fontMin,
      rotation: Math.floor(Math.random() * (settings.rotationRange * 2 + 1)) - settings.rotationRange,
      opacity: settings.opacityMin + Math.random() * (settings.opacityMax - settings.opacityMin)
    });
  });

  return board;
}

function pickNextTarget(room) {
  const remaining = room.board
    .map(b => b.number)
    .filter(n => !room.found.has(n));
  if (remaining.length === 0) return null;
  return remaining[Math.floor(Math.random() * remaining.length)];
}

// -------------------- Socket handlers --------------------
io.on('connection', (socket) => {
  console.log('[+] connected', socket.id);

  socket.on('create_room', ({ playerName }, cb) => {
    if (!playerName || !playerName.trim()) {
      return cb({ error: 'Name required' });
    }
    const room = createRoom(playerName.trim(), socket.id);
    socket.join(room.code);
    cb({ ok: true, room: getPublicRoom(room), playerId: socket.id });
  });

  socket.on('join_room', ({ code, playerName }, cb) => {
    if (!code || !playerName) return cb({ error: 'Code and name required' });
    const room = rooms.get(code.toUpperCase());
    if (!room) return cb({ error: 'Room not found' });
    if (room.status !== 'waiting') return cb({ error: 'Game already started' });
    if (room.players.length >= 2) return cb({ error: 'Room is full' });

    room.players.push({ id: socket.id, name: playerName.trim(), score: 0 });
    socket.join(room.code);

    io.to(room.code).emit('room_updated', getPublicRoom(room));
    cb({ ok: true, room: getPublicRoom(room), playerId: socket.id });
  });

  socket.on('start_game', ({ code, level, totalNumbers }, cb) => {
    const room = rooms.get(code);
    if (!room) return cb({ error: 'Room not found' });
    if (room.hostId !== socket.id) return cb({ error: 'Only host can start' });
    if (room.players.length < 2) return cb({ error: 'Need 2 players' });

    const max = level === 'hard' ? 300 : 400;
    const total = Math.max(10, Math.min(max, parseInt(totalNumbers) || 50));

    room.level = level || 'medium';
    room.totalNumbers = total;
    room.board = generateBoard(total, room.level);
    room.found = new Set();
    room.scores = {};
    room.players.forEach(p => room.scores[p.id] = 0);
    room.status = 'playing';
    room.currentTarget = pickNextTarget(room);

    io.to(room.code).emit('game_started', getPublicRoom(room));
    cb({ ok: true });
  });

  socket.on('claim_number', ({ code, number }, cb) => {
    const room = rooms.get(code);
    if (!room || room.status !== 'playing') return cb({ error: 'Invalid room' });
    if (room.found.has(number)) return cb({ error: 'Already found' });
    if (number !== room.currentTarget) return cb({ error: 'Wrong number' });

    // First claim wins
    room.found.add(number);
    room.scores[socket.id] = (room.scores[socket.id] || 0) + 1;

    const player = room.players.find(p => p.id === socket.id);

    if (room.found.size >= room.totalNumbers) {
      room.status = 'finished';
      room.currentTarget = null;
      io.to(room.code).emit('number_claimed', {
        number,
        playerId: socket.id,
        playerName: player?.name,
        room: getPublicRoom(room)
      });
      io.to(room.code).emit('game_over', getPublicRoom(room));
    } else {
      room.currentTarget = pickNextTarget(room);
      io.to(room.code).emit('number_claimed', {
        number,
        playerId: socket.id,
        playerName: player?.name,
        room: getPublicRoom(room)
      });
    }

    cb({ ok: true });
  });

  socket.on('leave_room', ({ code }) => {
    const room = rooms.get(code);
    if (!room) return;

    room.players = room.players.filter(p => p.id !== socket.id);
    socket.leave(code);

    if (room.players.length === 0) {
      rooms.delete(code);
    } else {
      // transfer host if needed
      if (room.hostId === socket.id) {
        room.hostId = room.players[0].id;
      }
      io.to(code).emit('room_updated', getPublicRoom(room));
    }
  });

  socket.on('disconnect', () => {
    for (const [code, room] of rooms.entries()) {
      const idx = room.players.findIndex(p => p.id === socket.id);
      if (idx !== -1) {
        room.players.splice(idx, 1);
        if (room.players.length === 0) {
          rooms.delete(code);
        } else {
          if (room.hostId === socket.id) {
            room.hostId = room.players[0].id;
          }
          io.to(code).emit('room_updated', getPublicRoom(room));
        }
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Number Hunt server running on port ${PORT}`);
});