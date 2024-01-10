#!/usr/bin/env bash

set -e
set -u
[ -n "${DEBUG:-}" ] && set -x || true

ckb-cli wallet transfer --skip-check-to-address --to-address "$1" --capacity 300000 --privkey-path specs/miner.key
