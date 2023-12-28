#!/bin/sh

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
  ;;
esac

sed -n \
  -e 's/,$//' \
  -e 's/^ *"type_id": /NEXT_PUBLIC_JOYID_COBUILD_POC_CODE_HASH=/p' \
  -e 's/^ *"tx_hash": /NEXT_PUBLIC_JOYID_COBUILD_POC_TX_HASH=/p' \
  "$@"
