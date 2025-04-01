// server.js
const http = require('http');
const { Server } = require('socket.io');

// Crear servidor HTTP
const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "*" // Permite conexiones desde cualquier origen
  }
});

// Manejar conexiones de Socket.io
io.on('connection', (socket) => {
  console.log(`Usuario conectado: ${socket.id}`);

  // Notificar a todos sobre la nueva conexión
  io.emit('user_connected', { id: socket.id });

  // Unirse a un canal (room)
  socket.on('join_channel', (channel) => {
    socket.join(channel);
    console.log(`${socket.id} se unió a ${channel}`);
    io.to(channel).emit('channel_notification', {
      type: 'join',
      user: socket.id,
      channel
    });
  });

  // Enviar mensaje a un canal
  socket.on('send_message', (data) => {
    console.log(`Mensaje en ${data.channel} de ${data.name}: ${data.message}`);
    io.to(data.channel).emit('new_message', {
      from: data.name,
      message: data.message,
      timestamp: new Date().toISOString()
    });
  });

  // Manejar desconexión
  socket.on('disconnect', () => {
    console.log(`Usuario desconectado: ${socket.id}`);
    io.emit('user_disconnected', { id: socket.id });
  });
});

// Iniciar servidor
const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Servidor Socket.io escuchando en puerto ${PORT}`);
});
