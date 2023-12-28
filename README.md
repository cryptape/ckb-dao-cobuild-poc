# CKB DAO Cobuild POC

## Disclaimer

- This is a PoC demo showcasing the management of DAO deposits through the use of a new witness layout and transaction building protocol named **Cobuild**.
- In this demo, JoyID is used to sign transactions. Please note that the CKB address used in this demo is different from the official JoyID CKB address, as a [custom lock][custom-lock] is employed to support the Cobuild witness layout.
- The [custom lock][custom-lock] utilized in this demo has never been audited, USE AT YOUR OWN RISK!
- There's a [preview](https://ckb-dao-cobuild-poc.vercel.app/) deployed to the testnet, have fun.

[custom-lock]: contracts/joyid-cobuild-poc/README.md

## Getting Started

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

This will use the testnet and the public RPC node `https://testnet.ckbapp.dev/`. See [docs/dev.md](docs/dev.md) about how to set up a dev chain for local development and testing.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

See the list of configurable environment variables in the file [env.example](env.example).

## Contract Development

```
cargo install cross --git https://github.com/cross-rs/cross
cargo install ckb-capsule
capsule build
capsule test
```
