#!/usr/bin/env bash

set -e
set -u
[ -n "${DEBUG:-}" ] && set -x || true

if ! [ -f build/release/joyid ]; then
  echo "Expect the contract files in build/release" >&2
  echo "Run bin/download-joyid-cells.sh to download them from the testnet" >&2
  exit 1
fi

if ! [ -f specs/miner.key ]; then
  echo "specs/miner.key not found, use the default test account" >&2
  mkdir -p specs
  echo "d00c06bfd800d27397002dca6fb0993d5ba6399b4238b2f29ee9deb97593d2bc" >specs/miner.key
fi

rm -rf migrations/dev && mkdir -p migrations/dev
GENESIS_TX0="$(ckb list-hashes | sed -n 's/tx_hash = "\(.*\)"/\1/p' | head -1)"
sed "s/0x8f8c79eb6671709633fe6a46de93c0fedc9c1b8a6527a18d3983879542635c9f/$GENESIS_TX0/" deployment.toml >migrations/dev/deployment.toml

ckb-cli deploy gen-txs --from-address ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwgx292hnvmn68xf779vmzrshpmm6epn4c0cgwga \
  --fee-rate 1000 --deployment-config migrations/dev/deployment.toml --info-file migrations/dev/deployment.json --migration-dir migrations/dev

SIGNATURES="$(ckb-cli deploy sign-txs --info-file migrations/dev/deployment.json --privkey-path specs/miner.key --output-format json | sed -n 's/: \("[^"]*"\)/: [\1]/p')"
echo "$SIGNATURES"
CELLS_SIGNATURES="$(echo "$SIGNATURES" | head -1)"
DEP_GROUPS_SIGNATURES="$(echo "$SIGNATURES" | tail -1)"

sed -i.bak \
  -e 's/"cell_tx_signatures": {}/"cell_tx_signatures": {'"$CELLS_SIGNATURES"'}/' \
  migrations/dev/deployment.json
sed -i.bak \
  -e 's/"dep_group_tx_signatures": {}/"dep_group_tx_signatures": {'"$DEP_GROUPS_SIGNATURES"'}/' \
  migrations/dev/deployment.json
rm -f migrations/dev/deployment.json.bak

ckb-cli deploy apply-txs --info-file migrations/dev/deployment.json --migration-dir migrations/dev

DEPLOY_RESULT_FILE="$(ls migrations/dev/*.json | grep -v deployment | head -n 1)"
bin/use-env.sh "$DEPLOY_RESULT_FILE" >.env

bin/generate-blocks.sh 3
