#!/bin/bash

CKB_RPC_URL="${CKB_RPC_URL:-http://127.0.0.1:8114}"

function generate() {
  local n="$(printf '%x' "${1:-1}")"
  curl --request POST \
    --url http://127.0.0.1:8114/ \
    --data '{
  "id": 42,
  "jsonrpc": "2.0",
  "method": "generate_epochs",
  "params": ["0x'"$n"'"]
}'
}

case "${1:-}" in
--url)
  CKB_RPC_URL="$2"
  shift
  shift
  generate "$@"
  ;;
--url=*)
  CKB_RPC_URL="${1#*=}"
  shift
  generate "$@"
  ;;
--help)
  echo 'usage: generate-epochs.sh [--help|--url CKB_RPC_URL] [count]'
  ;;
*)
  generate "$@"
  ;;
esac
