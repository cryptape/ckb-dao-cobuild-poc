#!/usr/bin/env bash

set -e
set -u
[ -n "${DEBUG:-}" ] && set -x || true

case "${1:-}" in
--testnet)
  shift
  cat env.example
  ;;
--mainnet)
  shift
  echo 'NEXT_PUBLIC_CKB_CHAIN="LINA"'
  echo 'NEXT_PUBLIC_CKB_RPC_URL="	https://mainnet.ckb.dev/"'
  ;;
*)
  echo 'NEXT_PUBLIC_CKB_CHAIN="DEV"'
  echo 'NEXT_PUBLIC_CKB_RPC_URL="http://127.0.0.1:8114/"'
  GENESIS_TXS="$(ckb-cli rpc get_block_by_number --number 0 | sed -n 's/^    hash: //p')"
  echo 'NEXT_PUBLIC_CKB_GENESIS_TX_0="'"$(echo "$GENESIS_TXS" | head -n 1)"'"'
  echo 'NEXT_PUBLIC_CKB_GENESIS_TX_1="'"$(echo "$GENESIS_TXS" | tail -n 1)"'"'
  ;;
esac

JOYID_INFO_FILE="$(ls migrations/joyid/*.json | grep -v deployment | head -n 1)"
CKB_AUTH_INFO_FILE="$(ls migrations/ckb_auth/*.json | grep -v deployment | head -n 1)"

sed -n \
  -e 's/,$//' \
  -e 's/^ *"type_id": /NEXT_PUBLIC_JOYID_CODE_HASH=/p' \
  "$JOYID_INFO_FILE" | head -1

sed -n \
  -e 's/,$//' \
  -e 's/^ *"tx_hash": /NEXT_PUBLIC_JOYID_TX_HASH=/p' \
  "$JOYID_INFO_FILE" | tail -1

sed -n \
  -e 's/,$//' \
  -e 's/^ *"type_id": "/NEXT_PUBLIC_UNISAT_CODE_HASH="/p' \
  "$CKB_AUTH_INFO_FILE" | head -1

sed -n \
  -e 's/,$//' \
  -e 's/^ *"tx_hash": /NEXT_PUBLIC_AUTH_TX_HASH=/p' \
  "$CKB_AUTH_INFO_FILE" | tail -1
