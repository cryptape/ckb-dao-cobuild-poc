#!/usr/bin/env bash

set -e
set -u
[ -n "${DEBUG:-}" ] && set -x || true

function has_tx() {
  curl --request POST \
    -H "Content-Type: application/json" \
    --silent \
    --url http://127.0.0.1:8114/ \
    --data '{
      "id": 42,
      "jsonrpc": "2.0",
      "method": "tx_pool_info",
      "params": []
    }' | grep -q '"\(pending\|proposed\)": *"0x[1-9]'
}

while true; do
  if has_tx; then
    sleep 1
    bin/generate-blocks.sh 3
  fi
  sleep 1
done
