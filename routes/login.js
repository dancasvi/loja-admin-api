const express = require('express');
const router = express.Router();
const dbConfig = require('../db/db.js');  // ajuste o caminho conforme seu projeto

router.post('/login', async (req, res) => {
  const { login, senha } = req.body;

  if (!login || !senha) {
    return res.status(400).json({ sucesso: false, erro: 'Login e senha são obrigatórios.' });
  }

  const sql = `SELECT * FROM usuario WHERE login = $1 AND senha = $2`;

  if (dbConfig.type === 'sqlite') {
    const sqliteSql = `SELECT * FROM usuario WHERE login = ? AND senha = ?`;
    dbConfig.db.get(sqliteSql, [login, senha], (err, row) => {
      if (err) return res.status(500).json({ sucesso: false, erro: 'Erro no banco SQLite.' });
      if (row) res.json({ sucesso: true, usuario: row });
      else res.json({ sucesso: false });
    });
  } else if (dbConfig.type === 'postgres') {
    try {
      const result = await dbConfig.pool.query(sql, [login, senha]);
      if (result.rows.length > 0) {
        res.json({ sucesso: true, usuario: result.rows[0] });
      } else {
        res.json({ sucesso: false });
      }
    } catch (err) {
      res.status(500).json({ sucesso: false, erro: 'Erro no banco PostgreSQL.' });
    }
  }
});

module.exports = router;
