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

Generate some blocks to make the CKB tokens in the genesis block available.

```
bin/generate-blocks.sh 20
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

This will create the `.env` file which contains the configurations for the dev chain. To switch back to the testnet, just rename the `.env` file or delete it.

## Configure The Web App

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

Now it's OK to run the web app with the local dev chain. Start a CKB miner process in another terminal window to commit transactions automatically, or run `bin/generate-blocks.sh 3` to commit transactions manually.

```bash
ckb miner
```

To test the phase 2 withdraw, use the command `bin/generate-epochs.sh 180` to generate 180 epochs, which is a full DAO cycle.

```bash
bin/generate_epochs.sh 180
```
