const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = process.env.PORT || 3001;

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Rota principal
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Armazenamento em memória (substitui banco de dados)
let pedidos = [];

// Configuração do Socket.io
io.on('connection', (socket) => {
  console.log('Novo cliente conectado:', socket.id);

  // Envia pedidos atuais para o painel admin quando conecta
  socket.emit('pedidos-atualizados', pedidos);

  // Recebe novos pedidos do cliente
  socket.on('novo-pedido', (pedido) => {
    pedido.id = Date.now().toString();
    pedido.status = 'pending';
    pedido.data = new Date().toLocaleString('pt-BR');
    pedidos.push(pedido);
    
    // Atualiza todos os clientes (incluindo painel admin)
    io.emit('pedidos-atualizados', pedidos);
    console.log('Novo pedido recebido:', pedido);
  });

  // Atualiza status do pedido (do painel admin)
  socket.on('atualizar-status', ({ id, status }) => {
    const pedido = pedidos.find(p => p.id === id);
    if (pedido) {
      pedido.status = status;
      io.emit('pedidos-atualizados', pedidos);
      console.log(`Pedido ${id} atualizado para status: ${status}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});