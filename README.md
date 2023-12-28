# CKB DAO Cobuild POC

## Disclaimer

- This is a PoC demo to show how to use JoyID and the new witness layout and transaction building process named Cobuild.
- The demo uses a custom lock which has a different CKB address from the JoyID CKB address.
- The [contract](contracts/joyid-cobuild-poc/README.md) has not been audited, USE AT YOUR OWN RISK!

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
