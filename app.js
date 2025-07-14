const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config(); // 👈 carrega o .env

app.use(cors());
app.use(express.json());

// Rotas
const tipoRoutes = require('./routes/tipos');
const produtoRoutes = require('./routes/produtos');
const promocoesRoutes = require('./routes/promocoes');
const mensagensRoutes = require('./routes/mensagens');
const loginRoutes = require('./routes/login');

app.use('/api', tipoRoutes);
app.use('/api', produtoRoutes);
app.use('/api', promocoesRoutes);
app.use('/api', mensagensRoutes);
app.use('/api', loginRoutes);

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Modo de banco: ${process.env.DB_TYPE}`);
});
