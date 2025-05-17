const express = require('express');

const http = require('http');
const { Server } = require('socket.io');
const { connectDB } = require('./db'); // Asegúrate de que connectDB esté exportado correctamenteconst authRoutes = require('./routes/auth.routes');


const app = express();
const PORT = process.env.PORT || 4000;


const server = http.createServer(app);

app.use(express.json()); // Para parsear application/json
app.use(express.urlencoded({ extended: true })); // Para parsear form data
// Iniciar conexión a la DB antes del servidor
// Conectar a DB antes de iniciar el servidor
connectDB()
  .then(() => {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error al conectar a MongoDB:', err);
    process.exit(1); // Detener la aplicación si no hay conexión a la DB
  });

app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);

//TODO  Socket
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true
  },
  pingTimeout: 10000,
  pingInterval: 5000,
});

const messageStore = new Map();

io.on('connection', (socket) => {
  console.log(`Usuario conectado: ${socket.id}`);

  io.emit('user_connected', { id: socket.id });

  socket.on('join_channel', (channel, callback) => {
    try {
      socket.join(channel);
      console.log(`${socket.id} se unió a ${channel}`);

      if (messageStore.has(channel)) {
        const channelMessages = messageStore.get(channel);
        socket.emit('channel_history', channelMessages.slice(-50));
      }

      io.to(channel).emit('channel_notification', {
        type: 'join',
        user: socket.id,
        channel
      });

      if (typeof callback === 'function') {
        callback({ success: true });
      }
    } catch (error) {
      console.error('Error al unirse al canal:', error);
      if (typeof callback === 'function') {
        callback({ success: false, error: 'Error al unirse al canal' });
      }
    }
  });

  socket.on('send_message', (data, callback) => {
    try {
      const { channel, name, message, messageId } = data;
      const timestamp = new Date().toISOString();

      console.log(`Mensaje en ${channel} de ${name}: ${message}`);

      if (!messageStore.has(channel)) {
        messageStore.set(channel, []);
      }

      const messageData = {
        from: name,
        message,
        timestamp,
        messageId: messageId || `msg-${Date.now()}`
      };

      messageStore.get(channel).push(messageData);

      io.to(channel).emit('new_message', messageData);

      if (typeof callback === 'function') {
        callback({ success: true });
      }

      const timeoutId = setTimeout(() => {
        socket.emit('message_delivered', {
          messageId: messageData.messageId,
          timestamp,
        });
      }, 1000);

      socket.on('message_delivered_ack', (ackData) => {
        if (ackData.messageId === messageData.messageId) {
          clearTimeout(timeoutId);
        }
      });

    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      if (typeof callback === 'function') {
        callback({ success: false, error: 'Error al enviar mensaje' });
      }
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`Usuario desconectado (${socket.id}): ${reason}`);
    io.emit('user_disconnected', {
      id: socket.id,
      reason
    });
  });

  socket.on('error', (error) => {
    console.error(`Error en socket ${socket.id}:`, error);
  });
});

io.engine.on('connection_error', (err) => {
  console.error('Error de conexión:', err);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor en puerto ${PORT}`);
});
