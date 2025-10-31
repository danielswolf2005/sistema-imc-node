PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS pessoas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT,
  data_nasc TEXT,
  sexo TEXT,
  criado_em TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  min_val REAL,
  max_val REAL,
  descricao TEXT
);

CREATE TABLE IF NOT EXISTS imc_registros (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pessoa_id INTEGER NOT NULL,
  peso_kg REAL NOT NULL,
  altura_m REAL NOT NULL,
  imc REAL NOT NULL,
  categoria_id INTEGER,
  medido_em TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (pessoa_id) REFERENCES pessoas(id) ON DELETE CASCADE,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  pessoa_id INTEGER,
  criado_em TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (pessoa_id) REFERENCES pessoas(id)
);

INSERT INTO categorias (nome, min_val, max_val, descricao) VALUES
  ('Abaixo do peso', NULL, 18.5, 'IMC < 18.5'),
  ('Normal', 18.5, 25, 'IMC 18.5–24.9'),
  ('Sobrepeso', 25, 30, 'IMC 25–29.9'),
  ('Obesidade I', 30, 35, 'IMC 30–34.9'),
  ('Obesidade II', 35, 40, 'IMC 35–39.9'),
  ('Obesidade III', 40, NULL, 'IMC >= 40');
