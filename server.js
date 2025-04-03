// // server.js
// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');

// const app = express();
// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: "*", // Permite cualquier origen (en producción restringe esto)
//     methods: ["GET", "POST"]
//   }
// });

// // Health check para Render
// app.get('/', (req, res) => {
//   res.status(200).json({ status: 'OK' });
// });

// // WebSocket events (tu lógica actual)
// // io.on('connection', (socket) => {
// //   // ... (tu código de eventos)
// // });


// // Manejo de conexiones WebSocket
// io.on('connection', (socket) => {
//   console.log(`Usuario conectado: ${socket.id}`);

//   // Notificar a todos sobre la nueva conexión
//   io.emit('user_connected', { id: socket.id });

//   // Unirse a un canal (room)
//   socket.on('join_channel', (channel) => {
//     socket.join(channel);
//     console.log(`${socket.id} se unió a ${channel}`);
//     io.to(channel).emit('channel_notification', {
//       type: 'join',
//       user: socket.id,
//       channel
//     });
//   });

//   // Enviar mensaje a un canal
//   socket.on('send_message', (data) => {
//     console.log(`Mensaje en ${data.channel} de ${data.name}: ${data.message}`);
//     io.to(data.channel).emit('new_message', {
//       from: data.name,
//       message: data.message,
//       timestamp: new Date().toISOString()
//     });
//   });

//   // Manejar desconexión
//   socket.on('disconnect', () => {
//     console.log(`Usuario desconectado: ${socket.id}`);
//     io.emit('user_disconnected', { id: socket.id });
//   });
// });





// const PORT = process.env.PORT || 4000;
// server.listen(PORT, '0.0.0.0', () => {
//   console.log(`Servidor en puerto ${PORT}`);
// });



const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Permite cualquier origen (en producción restringe esto)
    methods: ["GET", "POST"]
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutos
    skipMiddlewares: true
  }
});

// Health check para Render
app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Almacén de mensajes (para recuperación)
const messageStore = new Map();

// Manejo de conexiones WebSocket
io.on('connection', (socket) => {
  console.log(`Usuario conectado: ${socket.id}`);

  // Notificar a todos sobre la nueva conexión
  io.emit('user_connected', { id: socket.id });

  // Unirse a un canal (room)
  socket.on('join_channel', (channel, callback) => {
    try {
      socket.join(channel);
      console.log(`${socket.id} se unió a ${channel}`);
      
      // Enviar historial de mensajes del canal
      if (messageStore.has(channel)) {
        const channelMessages = messageStore.get(channel);
        socket.emit('channel_history', channelMessages.slice(-50)); // Últimos 50 mensajes
      }
      
      io.to(channel).emit('channel_notification', {
        type: 'join',
        user: socket.id,
        channel
      });
      
      // Confirmación exitosa
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

  // Enviar mensaje a un canal
  socket.on('send_message', (data, callback) => {
    try {
      const { channel, name, message, messageId } = data;
      const timestamp = new Date().toISOString();
      
      console.log(`Mensaje en ${channel} de ${name}: ${message}`);
      
      // Almacenar mensaje
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
      
      // Transmitir mensaje
      io.to(channel).emit('new_message', messageData);
      
      // Confirmar entrega al emisor
      if (typeof callback === 'function') {
        callback({ success: true });
      }
      
      // Opcional: Notificar entrega al remitente
      setTimeout(() => {
        socket.emit('message_delivered', { 
          messageId: messageData.messageId,
          timestamp
        });
      }, 500); // Pequeño delay para simular procesamiento
      
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      if (typeof callback === 'function') {
        callback({ success: false, error: 'Error al enviar mensaje' });
      }
    }
  });

  // Manejar desconexión
  socket.on('disconnect', (reason) => {
    console.log(`Usuario desconectado (${socket.id}): ${reason}`);
    io.emit('user_disconnected', { 
      id: socket.id,
      reason 
    });
  });

  // Manejar errores
  socket.on('error', (error) => {
    console.error(`Error en socket ${socket.id}:`, error);
  });
});

// Manejo de errores globales
io.engine.on('connection_error', (err) => {
  console.error('Error de conexión:', err);
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor en puerto ${PORT}`);
});