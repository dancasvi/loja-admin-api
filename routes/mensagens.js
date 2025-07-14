const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const dayjs = require('dayjs');

const db = new sqlite3.Database('./db/db_loja.db');

// GET - listar mensagens
router.get('/mensagem', (req, res) => {
  db.all(`SELECT * FROM mensagem_cliente`, [], (err, rows) => {
    if (err) return res.status(500).json({ erro: 'Erro ao buscar mensagens.' });
    res.json(rows);
  });
});

module.exports = router;