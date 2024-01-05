#!/usr/bin/env bash

set -e
set -u
[ -n "${DEBUG:-}" ] && set -x || true

CKB_URL="${CKB_URL:-"https://testnet.ckb.dev"}"

function download() {
  local tx_hash="$2"
  local index="$3"
  local file_name="$1"
  local file_path="build/release/$1"
  if [ -e "$file_path" ]; then
    echo "$file_name exists, delete it to re-download"
  else
    ckb-cli --url "$CKB_URL" rpc get_live_cell --tx-hash "$tx_hash" --index "$index" --with-data |
      sed -n 's/^ *content: 0x//p' |
      xxd -r -ps >"$file_path"
    echo "$file_name downloaded"
  fi
}

mkdir -p build/release
download joyid 0xbe65905ae38972e943874ef67f9d8ff1966dca37959a94be36dc37104ebf0f49 0
download joyid_dep1 0x05d236ed568d9a62b3b610c71f408b95675ab6611bbc8ea2cef3c03f57725651 1
download joyid_dep2 0xf2c9dbfe7438a8c622558da8fa912d36755271ea469d3a25cb8d3373d35c8638 1
download joyid_dep3 0x95ecf9b41701b45d431657a67bbfa3f07ef7ceb53bf87097f3674e1a4a19ce62 1
# secp256k1 data
# download joyid_dep4 0x8f8c79eb6671709633fe6a46de93c0fedc9c1b8a6527a18d3983879542635c9f 3
download joyid_dep5 0x8b3255491f3c4dcc1cfca33d5c6bcaec5409efe4bbda243900f9580c47e0242e 1

download ckb_auth 0xd4f72f0504373ff8effadf44f92c46a0062774fb585ebcacc24eb47b98e2d66a 0
download unisat_lock 0xe842b43df31c92d448fa345d60a6df3e03aaab19ef88921654bf95c673a26872 0
