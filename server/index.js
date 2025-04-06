const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Ajuste o caminho para sair da pasta server e acessar a public
app.use(express.static(path.join(__dirname, '../public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});