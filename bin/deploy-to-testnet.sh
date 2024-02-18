#!/usr/bin/env bash

set -e
set -u
[ -n "${DEBUG:-}" ] && set -x || true

if ! [ -e build/release/dao-action-verifier ]; then
  echo "Expect the contract files in build/release" >&2
  echo "Run \`make contract\` to build them" >&2
  exit 1
fi

export API_URL="https://testnet.ckbapp.dev/"
export CKB_CHAIN="testnet"

function deploy() {
  local DEPLOY_NAME="$1"
  local MIGRATION_DIR="migrations/$DEPLOY_NAME-$CKB_CHAIN"
  local INFO_FILE="$MIGRATION_DIR/deployment.json"
  local CONFIG_FILE="migrations/templates/$DEPLOY_NAME.toml"

  mkdir -p "$MIGRATION_DIR"

  if ! [ -f "$INFO_FILE" ]; then
    ckb-cli deploy gen-txs --from-address ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq0yv0tufjegg4an5tmnt5we92t3kr66w5gs8833u \
      --fee-rate 1000 --deployment-config "$CONFIG_FILE" --info-file "$INFO_FILE" --migration-dir "$MIGRATION_DIR"
  fi

  ckb-cli deploy sign-txs --add-signatures --info-file "$INFO_FILE" --from-account 0xe463d7c4cb28457b3a2f735d1d92a971b0f5a751 --output-format json | sed -n 's/: \("[^"]*"\)/: [\1]/p'

  ckb-cli deploy apply-txs --info-file "$INFO_FILE" --migration-dir "$MIGRATION_DIR"

  rm -f "$INFO_FILE"
}

deploy dao-action-verifier
