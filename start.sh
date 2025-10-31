#!/bin/bash
# Script simples para iniciar o servidor
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js não encontrado. Instale o Node.js e rode 'npm install' antes."
  exit 1
fi
if [ ! -d "node_modules" ]; then
  echo "Dependências não instaladas. Rodando: npm install"
  npm install
fi
echo "Iniciando servidor..."
node server.js
