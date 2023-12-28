# Development Docs

## Start Local Dev Chain

Init a dev chain using the test account that has 20 billions of CKB tokens in the genesis block.

```bash
ckb init -c dev --ba-arg 0xc8328aabcd9b9e8e64fbc566c4385c3bdeb219d7
```

Edit `specs/dev.toml` to append `Indexer` and `IntegrationTest` to the `modules` option under the `[rpc]` section.

```toml
modules = ["Net", "Pool", "Miner", "Chain", "Stats", "Subscription", "Experiment", "Debug", "Indexer", "IntegrationTest"]
```

Import the test account into `ckb-cli` with empty password

```bash
echo 'd00c06bfd800d27397002dca6fb0993d5ba6399b4238b2f29ee9deb97593d2bc' > specs/miner.key
ckb-cli account import --privkey-path specs/miner.key </dev/null
```

Start the chain.

```bash
ckb run
```

Mine some blocks to make CKB tokens available to deploy contracts

```bash
bin/generate-blocks.sh 20
```

## Deploy Contracts to the Local Dev Chain

Build contracts

```bash
capsule build --release
```

Or download files from [releases](https://github.com/doitian/ckb-dao-cobuild-poc/releases) and save them into the `build/release/` folder.

Deploy using ckb-cli

Step 1: Call `gen-txs`. Notice the from-address is the test miner account.

```bash
rm -rf migrations/dev && mkdir -p migrations/dev
ckb-cli deploy gen-txs --from-address ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwgx292hnvmn68xf779vmzrshpmm6epn4c0cgwga \
  --fee-rate 1000 --deployment-config deployment.toml --info-file migrations/dev/deployment.json --migration-dir migrations/dev
```

Step 2: Sign txs

```bash
ckb-cli deploy sign-txs --info-file migrations/dev/deployment.json --privkey-path specs/miner.key --output-format json
# => {
# =>   "cell_tx_signatures": {
# =>     "0xc8328...": "0x92d7..."
# =>   }
# => }
```

Add the signatures to the info file `migrations/dev/deployment.json` manually. Attention that wrap the value in an array.

```json
  "cell_tx_signatures": {
    "0xc8328...": ["0x92d7..."]
  },
```

Step 3: Send txs

```bash
ckb-cli deploy apply-txs --info-file migrations/dev/deployment.json --migration-dir migrations/dev
```

Step 4: Mine 3 blocks to commit txs

```bash
bin/generate-blocks.sh 3
```

## Configure The Web App

Generate .env file form the deployment.

```bash
bin/use-env.sh migrations/dev/20*.json > .env
```

Start the local development server.

```bash
pnpm dev
```

Connect JoyID and copy the address displayed at the top of the page.

Transfer some CKB tokens from the miner account to the copied address. Replace `ckbt1qz...` with the real address in the following command.

```bash
ckb-cli wallet transfer --skip-check-to-address --to-address ckt1qz... --capacity 300000 --privkey-path specs/miner.key
```

Mine some blocks to commit the transfer transaction.

```bash
bin/generate-blocks.sh 3
```

Now it's OK to run the web app with the local dev chain. You can run a miner process to generate blocks automatically in another terminal, or just run `bin/generate-blocks.sh 3` to manually commit transactions in the memory pool.

To test the phase 2 withdraw, use the command `bin/generate-epochs.sh 180` to generate 180 epochs, which is a full DAO cycle.

```bash
bin/generate_epochs.sh 180
```
