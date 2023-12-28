# Development Docs

## Start Local Dev Chain

Init a dev chain using the test account that has 20 billions of CKB tokens in the genesis block.

```bash
bin/init-dev-chain.sh
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

## Deploy Contracts to the Local Dev Chain

Build contracts

```bash
capsule build --release
```

Or download files from [releases](https://github.com/doitian/ckb-dao-cobuild-poc/releases) and save them into the `build/release/` folder.

Deploy using ckb-cli by running the following script

```
bin/deploy-to-dev-chain.sh
```

## Configure The Web App

Ensure the local CKB node is running and generate the .env file from the deployment result file.

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
