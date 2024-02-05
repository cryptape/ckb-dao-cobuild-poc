#!/usr/bin/env bash

set -e
set -u
[ -n "${DEBUG:-}" ] && set -x || true

if ! [ -f build/release/joyid ]; then
  echo "Expect the contract files in build/release" >&2
  echo "Run bin/download-contracts.sh to download them from the testnet" >&2
  exit 1
fi

if ! [ -f specs/miner.key ]; then
  echo "specs/miner.key not found, use the default test account" >&2
  mkdir -p specs
  echo "d00c06bfd800d27397002dca6fb0993d5ba6399b4238b2f29ee9deb97593d2bc" >specs/miner.key
fi

function deploy() {
  local DEPLOY_NAME="$1"
  local MIGRATION_DIR="migrations/$DEPLOY_NAME"
  local CONFIG_FILE="$MIGRATION_DIR/deployment.toml"
  local INFO_FILE="$MIGRATION_DIR/deployment.json"
  local TEMPLATE_FILE="migrations/templates/$DEPLOY_NAME.toml"

  rm -rf "$MIGRATION_DIR" && mkdir -p "$MIGRATION_DIR"
  GENESIS_TX0="$(ckb list-hashes | sed -n 's/tx_hash = "\(.*\)"/\1/p' | head -1)"
  sed "s/0x8f8c79eb6671709633fe6a46de93c0fedc9c1b8a6527a18d3983879542635c9f/$GENESIS_TX0/" "$TEMPLATE_FILE" >"$CONFIG_FILE"

  ckb-cli deploy gen-txs --from-address ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwgx292hnvmn68xf779vmzrshpmm6epn4c0cgwga \
    --fee-rate 1000 --deployment-config "$CONFIG_FILE" --info-file "$INFO_FILE" --migration-dir "$MIGRATION_DIR"

  ckb-cli deploy sign-txs --add-signatures --info-file "$INFO_FILE" --privkey-path specs/miner.key --output-format json | sed -n 's/: \("[^"]*"\)/: [\1]/p'

  ckb-cli deploy apply-txs --info-file "$INFO_FILE" --migration-dir "$MIGRATION_DIR"
}

deploy dao-action-verifier
bin/generate-blocks.sh 4
sleep 1

# try twice in case the indexer has not updated yet
deploy joyid || deploy joyid
bin/generate-blocks.sh 4
sleep 1

# try twice in case the indexer has not updated yet
deploy omnilock || deploy omnilock
bin/generate-blocks.sh 4

bin/use-env.sh >.env
