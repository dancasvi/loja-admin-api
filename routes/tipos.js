const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const dayjs = require('dayjs');

const db = new sqlite3.Database('./db/db_loja.db');

// POST - cadastrar tipo de produto
router.post('/tipo-produto', (req, res) => {
  const { descricao } = req.body;

  if (!descricao || descricao.trim() === '') {
    return res.status(400).json({ erro: 'Descrição é obrigatória.' });
  }

  const dataRegistro = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const sql = `
    INSERT INTO produto_tipo (descricao, habilitado, data_registro, data_ultima_edicao)
    VALUES (?, 1, ?, NULL)
  `;

  db.run(sql, [descricao.trim(), dataRegistro], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ erro: 'Erro ao inserir tipo de produto.' });
    }

    return res.status(201).json({
      idproduto_tipo: this.lastID,
      descricao,
      habilitado: 1,
      data_registro: dataRegistro,
      data_ultima_edicao: null
    });
  });
});

// GET - listar tipos
router.get('/tipo-produto', (req, res) => {
  db.all(`SELECT * FROM produto_tipo WHERE habilitado = 1`, [], (err, rows) => {
    if (err) return res.status(500).json({ erro: 'Erro ao buscar tipos.' });
    res.json(rows);
  });
});

// PUT - editar tipo
router.put('/tipo-produto/:id', (req, res) => {
  const id = req.params.id;
  const { descricao, habilitado } = req.body;

  if (!descricao || typeof habilitado !== 'number') {
    return res.status(400).json({ erro: 'Dados inválidos.' });
  }

  const dataEdicao = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const sql = `
    UPDATE produto_tipo
    SET descricao = ?, habilitado = ?, data_ultima_edicao = ?
    WHERE idproduto_tipo = ?
  `;

  db.run(sql, [descricao.trim(), habilitado, dataEdicao, id], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ erro: 'Erro ao atualizar tipo de produto.' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ erro: 'Tipo de produto não encontrado.' });
    }

    res.json({ mensagem: 'Atualizado com sucesso', data_ultima_edicao: dataEdicao });
  });
});

module.exports = router;
