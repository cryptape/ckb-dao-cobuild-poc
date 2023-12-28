#!/usr/bin/env bash

set -e
set -u
[ -n "${DEBUG:-}" ] && set -x || true

ckb reset-data --all --force
ckb init -c dev --force --ba-arg 0xc8328aabcd9b9e8e64fbc566c4385c3bdeb219d7
sed -i.bak \
  -e 's/^modules = .*/modules = ["Net", "Pool", "Miner", "Chain", "Stats", "Subscription", "Experiment", "Debug", "Indexer", "IntegrationTest"]/' \
  ckb.toml
diff ckb.toml.bak ckb.toml 2>/dev/null || true
rm -f ckb.toml.bak
sed -i.bak \
  -e 's/^epoch_duration_target = .*/epoch_duration_target = 288/' \
  -e 's/^genesis_epoch_length = .*/genesis_epoch_length = 20/' \
  specs/dev.toml
diff specs/dev.toml.bak specs/dev.toml 2>/dev/null || true
rm -f specs/dev.toml.bak
