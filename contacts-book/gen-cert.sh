#!/usr/bin/env bash
set -euo pipefail

mkdir -p certs

openssl req -x509 \
  -newkey rsa:4096 \
  -keyout certs/key.pem \
  -out certs/cert.pem \
  -days 365 \
  -nodes \
  -subj "/CN=localhost/O=ContactsBook/C=US"

# Combine into single server.pem (key first, then cert)
cat certs/key.pem certs/cert.pem > certs/server.pem

echo "Generated certs/server.pem (key + cert combined)"
