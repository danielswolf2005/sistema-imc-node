const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const DB_FILE = path.join(__dirname, 'imc.db');
const SCHEMA_FILE = path.join(__dirname, 'schema.sql');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const dbExists = fs.existsSync(DB_FILE);
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) return console.error(err);
  console.log('SQLite conectado:', DB_FILE);
  if (!dbExists) {
    const schema = fs.readFileSync(SCHEMA_FILE, 'utf8');
    db.exec(schema, (err) => {
      if (err) console.error('Erro criando schema:', err);
      else console.log('Schema criado e categorias seedadas.');
    });
  }
});

function calculaIMC(pesoKg, alturaM) {
  if (!alturaM || alturaM <= 0) return null;
  const imc = pesoKg / (alturaM * alturaM);
  return Math.round(imc * 100) / 100;
}

function encontraCategoria(imc, callback) {
  db.get(
    `SELECT * FROM categorias WHERE (min_val IS NULL OR ? >= min_val) AND (max_val IS NULL OR ? < max_val) LIMIT 1`,
    [imc, imc],
    (err, row) => callback(err, row)
  );
}

/* Endpoints */

// cadastrar pessoa
app.post('/api/pessoas', (req, res) => {
  const { nome, email, data_nasc, sexo } = req.body;
  if (!nome) return res.status(400).json({ error: 'Nome obrigatório' });
  db.run(
    `INSERT INTO pessoas (nome, email, data_nasc, sexo) VALUES (?, ?, ?, ?)`,
    [nome, email || null, data_nasc || null, sexo || null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get('SELECT * FROM pessoas WHERE id = ?', [this.lastID], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
      });
    }
  );
});

// listar pessoas
app.get('/api/pessoas', (req, res) => {
  db.all('SELECT * FROM pessoas ORDER BY criado_em DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// registrar IMC
app.post('/api/imc', (req, res) => {
  const { pessoa_id, peso_kg, altura_m } = req.body;
  if (!pessoa_id || !peso_kg || !altura_m) return res.status(400).json({ error: 'pessoa_id, peso_kg e altura_m obrigatórios' });
  const imc = calculaIMC(Number(peso_kg), Number(altura_m));
  if (imc === null) return res.status(400).json({ error: 'Altura inválida' });

  encontraCategoria(imc, (err, categoria) => {
    if (err) return res.status(500).json({ error: err.message });
    const catId = categoria ? categoria.id : null;
    db.run(
      `INSERT INTO imc_registros (pessoa_id, peso_kg, altura_m, imc, categoria_id) VALUES (?, ?, ?, ?, ?)`,
      [pessoa_id, peso_kg, altura_m, imc, catId],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        db.get('SELECT * FROM imc_registros WHERE id = ?', [this.lastID], (err, row) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ registro: row, categoria });
        });
      }
    );
  });
});

// histórico de IMC de uma pessoa
app.get('/api/pessoas/:id/imc', (req, res) => {
  db.all(
    `SELECT ir.*, c.nome as categoria_nome FROM imc_registros ir LEFT JOIN categorias c ON ir.categoria_id = c.id WHERE pessoa_id = ? ORDER BY medido_em DESC`,
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// listar categorias
app.get('/api/categorias', (req, res) => {
  db.all('SELECT * FROM categorias ORDER BY COALESCE(min_val, -9999)', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
