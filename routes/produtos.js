const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const dayjs = require('dayjs');

const db = new sqlite3.Database('./db/db_loja.db');

// LISTAR produtos
router.get('/produto', (req, res) => {
  const sql = `
    SELECT p.*, t.descricao as tipo_descricao, pp.preco
    FROM produto p
    LEFT JOIN produto_tipo t ON p.idtipo = t.idproduto_tipo
    LEFT JOIN (
      SELECT idproduto, preco FROM produto_preco
      WHERE data_ultima_edicao IS NULL
    ) pp ON p.idproduto = pp.idproduto
  `;

  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ erro: 'Erro ao listar produtos.' });
    res.json(rows);
  });
});

// CADASTRAR produto
router.post('/produto', (req, res) => {
  const { nome, descricao, idtipo, quantidade_estoque, preco, variacoes } = req.body;

  if (!nome || !descricao || !idtipo || quantidade_estoque == null || preco == null) {
    return res.status(400).json({ erro: 'Dados obrigatórios ausentes.' });
  }

  const data = dayjs().format('YYYY-MM-DD HH:mm:ss');

  db.serialize(() => {
    db.run(`
      INSERT INTO produto (nome, descricao, idtipo, quantidade_estoque, habilitado, data_registro, data_ultima_edicao)
      VALUES (?, ?, ?, ?, 1, ?, NULL)
    `, [nome, descricao, idtipo, quantidade_estoque, data], function (err) {
      if (err) return res.status(500).json({ erro: 'Erro ao cadastrar produto.' });

      const idproduto = this.lastID;

      db.run(`
        INSERT INTO produto_preco (idproduto, preco, data_registro, data_ultima_edicao)
        VALUES (?, ?, ?, NULL)
      `, [idproduto, preco, data], function (err2) {
        if (err2) return res.status(500).json({ erro: 'Erro ao cadastrar preço.' });

        // Salvar variações
        if (variacoes && Array.isArray(variacoes)) {
          const stmt = db.prepare(`
            INSERT INTO produto_variacao 
              (descricao, idproduto, codigo_barras, quantidade_estoque, habilitado, data_registro, data_ultima_edicao)
            VALUES (?, ?, ?, ?, 1, ?, NULL)
          `);

          variacoes.forEach(v => {
            stmt.run([v.descricao, idproduto, v.codigo_barras, v.quantidade_estoque, data]);
          });

          stmt.finalize();
        }

        res.status(201).json({ idproduto, nome, descricao, preco, idtipo });
      });
    });
  });
});

// EDITAR produto
router.put('/produto/:id', (req, res) => {
  const id = req.params.id;
  const { nome, descricao, idtipo, quantidade_estoque, habilitado, preco, variacoes } = req.body;

  if (!nome || !descricao || !idtipo || quantidade_estoque == null || habilitado == null || preco == null) {
    return res.status(400).json({ erro: 'Dados obrigatórios ausentes.' });
  }

  const data = dayjs().format('YYYY-MM-DD HH:mm:ss');

  db.serialize(() => {
    db.run(`
      UPDATE produto
      SET nome = ?, descricao = ?, idtipo = ?, quantidade_estoque = ?, habilitado = ?, data_ultima_edicao = ?
      WHERE idproduto = ?
    `, [nome, descricao, idtipo, quantidade_estoque, habilitado, data, id], function (err) {
      if (err) return res.status(500).json({ erro: 'Erro ao atualizar produto.' });

      db.run(`
        UPDATE produto_preco
        SET data_ultima_edicao = ?
        WHERE idproduto = ? AND data_ultima_edicao IS NULL
      `, [data, id], function (err2) {
        if (err2) return res.status(500).json({ erro: 'Erro ao atualizar preço.' });

        db.run(`
          INSERT INTO produto_preco (idproduto, preco, data_registro, data_ultima_edicao)
          VALUES (?, ?, ?, NULL)
        `, [id, preco, data], function (err3) {
          if (err3) return res.status(500).json({ erro: 'Erro ao inserir novo preço.' });

          // Editar ou adicionar variações
          if (variacoes && Array.isArray(variacoes)) {
            const stmtInsert = db.prepare(`
              INSERT INTO produto_variacao 
              (descricao, idproduto, codigo_barras, quantidade_estoque, habilitado, data_registro, data_ultima_edicao)
              VALUES (?, ?, ?, ?, 1, ?, NULL)
            `);

            const stmtUpdate = db.prepare(`
              UPDATE produto_variacao
              SET descricao = ?, codigo_barras = ?, quantidade_estoque = ?, data_ultima_edicao = ?
              WHERE idproduto_variacao = ?
            `);

            variacoes.forEach(v => {
              if (v.idproduto_variacao) {
                stmtUpdate.run([v.descricao, v.codigo_barras, v.quantidade_estoque, data, v.idproduto_variacao]);
              } else {
                stmtInsert.run([v.descricao, id, v.codigo_barras, v.quantidade_estoque, data]);
              }
            });

            stmtInsert.finalize();
            stmtUpdate.finalize();
          }

          res.json({ mensagem: 'Produto atualizado com sucesso.' });
        });
      });
    });
  });
});

// LISTAR variações de um produto
router.get('/produto/:id/variacoes', (req, res) => {
  const id = req.params.id;
  const sql = `
    SELECT idproduto_variacao, descricao, codigo_barras, quantidade_estoque
    FROM produto_variacao
    WHERE idproduto = ?
  `;
  db.all(sql, [id], (err, rows) => {
    if (err) return res.status(500).json({ erro: 'Erro ao buscar variações.' });
    res.json(rows);
  });
});


module.exports = router;
