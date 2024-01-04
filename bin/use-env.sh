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

sed -n \
  -e 's/,$//' \
  -e 's/^ *"type_id": /NEXT_PUBLIC_JOYID_CODE_HASH=/p' \
  "$@" | head -1

sed -n \
  -e 's/,$//' \
  -e 's/^ *"tx_hash": /NEXT_PUBLIC_JOYID_TX_HASH=/p' \
  "$@" | tail -1
