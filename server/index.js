const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = process.env.PORT || 3000;

// Configuração do arquivo de persistência
const PEDIDOS_FILE = path.join(__dirname, 'pedidos.json');

// Funções para persistência
function carregarPedidos() {
  try {
    if (fs.existsSync(PEDIDOS_FILE)) {
      const data = fs.readFileSync(PEDIDOS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Erro ao carregar pedidos:', err);
  }
  return [];
}

function salvarPedidos(pedidos) {
  try {
    fs.writeFileSync(PEDIDOS_FILE, JSON.stringify(pedidos, null, 2));
  } catch (err) {
    console.error('Erro ao salvar pedidos:', err);
  }
}

// Carrega pedidos ao iniciar
let pedidos = carregarPedidos();

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Rota principal
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

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
    
    // Persiste no arquivo
    salvarPedidos(pedidos);
    
    // Atualiza todos os clientes
    io.emit('pedidos-atualizados', pedidos);
    console.log('Novo pedido recebido:', pedido);
  });

  // Atualiza status do pedido (do painel admin)
  socket.on('atualizar-status', ({ id, status }) => {
    const pedido = pedidos.find(p => p.id === id);
    if (pedido) {
      pedido.status = status;
      // Persiste a mudança
      salvarPedidos(pedidos);
      io.emit('pedidos-atualizados', pedidos);
      console.log(`Pedido ${id} atualizado para status: ${status}`);
    }
  });

  // Limpar pedidos concluídos (opcional)
  socket.on('limpar-pedidos-concluidos', () => {
    pedidos = pedidos.filter(p => p.status !== 'delivered' && p.status !== 'cancelled');
    salvarPedidos(pedidos);
    io.emit('pedidos-atualizados', pedidos);
    console.log('Pedidos concluídos removidos');
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Rota para backup dos pedidos (opcional)
app.get('/backup-pedidos', (req, res) => {
  res.download(PEDIDOS_FILE, 'backup-pedidos.json');
});

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Pedidos carregados: ${pedidos.length}`);
});