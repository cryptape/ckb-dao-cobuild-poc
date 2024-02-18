# CKB DAO CoBuild PoC

- [Contributing Guidelines](docs/CONTRIBUTING.md)
- [Guidelines for PoC Reviewers](docs/poc-review-guide.md)

## Disclaimer

- This is a PoC demo showcasing the management of DAO deposits through the use of a new transaction building protocol named [CoBuild](https://talk.nervos.org/t/ckb-transaction-cobuild-protocol-overview/7702).
- There's a [preview](https://ckb-dao-cobuild-poc.vercel.app/) deployed to the testnet, have fun.

## Background

This PoC shows how CoBuild works with type scripts and lock scripts that only support WitnessArgs layout.

- [x] It defines the [CoBuild action data schema for DAO](schemas/dao.mol).
- [x] It adopts the transaction building workflow based on the CoBuild data structure [BuildingPacket](src/lib/cobuild/types.js).
- [x] It uses WitnessArgs layout for lock scripts and the DAO type script.
- [x] It shows how to present the transaction before users sign it.
- [x] By default, the PoC discards the CoBuild message after building the transaction. However, it provides an opt-in feature to pack the CoBuild message and the example contract to verify the message.

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
