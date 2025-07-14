const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const dayjs = require('dayjs');

const db = new sqlite3.Database('./db/db_loja.db');

// Criar promoção
router.post('/promocao', (req, res) => {
  const { titulo, desconto_percentual, data_inicio, data_fim, produtos } = req.body;

  if (!titulo || desconto_percentual == null || !data_inicio || !data_fim || !Array.isArray(produtos)) {
    return res.status(400).json({ erro: 'Campos obrigatórios ausentes.' });
  }

  const dataAtual = dayjs().format('YYYY-MM-DD HH:mm:ss');

  db.serialize(() => {
    db.run(`
      INSERT INTO promocao (titulo, desconto_percentual, data_inicio, data_fim, habilitado, data_registro, data_ultima_edicao)
      VALUES (?, ?, ?, ?, 1, ?, NULL)
    `, [titulo, desconto_percentual, data_inicio, data_fim, dataAtual], function (err) {
      if (err) return res.status(500).json({ erro: 'Erro ao criar promoção.', dbg: err });

      const idpromocao = this.lastID;

      const stmt = db.prepare(`
        INSERT INTO promocao_produto (idpromocao, idproduto) VALUES (?, ?)
      `);

      produtos.forEach(idproduto => {
        stmt.run([idpromocao, idproduto]);
      });

      stmt.finalize();
      res.status(201).json({ mensagem: 'Promoção criada com sucesso.', idpromocao });
    });
  });
});

// Editar promoção
router.put('/promocao/:id', (req, res) => {
  const id = req.params.id;
  const { titulo, desconto_percentual, data_inicio, data_fim, habilitado, produtos } = req.body;

  if (!titulo || desconto_percentual == null || !data_inicio || !data_fim || habilitado == null || !Array.isArray(produtos)) {
    return res.status(400).json({ erro: 'Campos obrigatórios ausentes.' });
  }

  const dataAtual = dayjs().format('YYYY-MM-DD HH:mm:ss');

  db.serialize(() => {
    db.run(`
      UPDATE promocao
      SET titulo = ?, desconto_percentual = ?, data_inicio = ?, data_fim = ?, habilitado = ?, data_ultima_edicao = ?
      WHERE idpromocao = ?
    `, [titulo, desconto_percentual, data_inicio, data_fim, habilitado, dataAtual, id], function (err) {
      if (err) return res.status(500).json({ erro: 'Erro ao atualizar promoção.' });

      // Remove produtos existentes
      db.run(`DELETE FROM promocao_produto WHERE idpromocao = ?`, [id], function (err2) {
        if (err2) return res.status(500).json({ erro: 'Erro ao limpar produtos da promoção.' });

        const stmt = db.prepare(`
          INSERT INTO promocao_produto (idpromocao, idproduto) VALUES (?, ?)
        `);

        produtos.forEach(idproduto => {
          stmt.run([id, idproduto]);
        });

        stmt.finalize();
        res.json({ mensagem: 'Promoção atualizada com sucesso.' });
      });
    });
  });
});

// Listar todas as promoções
router.get('/promocao', (req, res) => {
  const sqlPromocoes = `
    SELECT * FROM promocao
  `;

  db.all(sqlPromocoes, [], (err, promocoes) => {
    if (err) return res.status(500).json({ erro: 'Erro ao listar promoções.' });

    const sqlProdutos = `
      SELECT idpromocao, idproduto FROM promocao_produto
    `;

    db.all(sqlProdutos, [], (err2, produtos) => {
      if (err2) return res.status(500).json({ erro: 'Erro ao listar produtos das promoções.' });

      const resposta = promocoes.map(p => {
        const produtosDaPromo = produtos
          .filter(pp => pp.idpromocao === p.idpromocao)
          .map(pp => pp.idproduto);

        return { ...p, produtos: produtosDaPromo };
      });

      res.json(resposta);
    });
  });
});

// Listar promoção por ID
router.get('/promocao/:id', (req, res) => {
  const id = req.params.id;

  db.get(`SELECT * FROM promocao WHERE idpromocao = ?`, [id], (err, promocao) => {
    if (err || !promocao) return res.status(404).json({ erro: 'Promoção não encontrada.' });

    db.all(`SELECT idproduto FROM promocao_produto WHERE idpromocao = ?`, [id], (err2, produtos) => {
      if (err2) return res.status(500).json({ erro: 'Erro ao buscar produtos da promoção.' });

      promocao.produtos = produtos.map(p => p.idproduto);
      res.json(promocao);
    });
  });
});


module.exports = router;
