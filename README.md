# 🥷 **Ninja Strike: Stealth, Strategy, and Surprise in Every Move**

⛩️ **Prepare for the ultimate test of strategy and cunning in Ninja Strike** — a thrilling game where stealth and tactics reign supreme. Set on a 10x10 grid, this game challenges you to hide your team of 10 ninjas while you search for and strike your opponent's hidden forces.

<img src="https://github.com/user-attachments/assets/6226078f-f04a-4046-a0da-e1ef3ebd95f5" alt="image" width="300"/>

## 🎮 **Gameplay**

Each player secretly arranges 10 ninjas on a 10x10 grid, aiming to uncover and eliminate all of the opponent's ninjas before losing their own. 

Players take turns guessing their opponent's ninja locations, employing tactics like clustering ninjas for a final stand or spreading them out to confuse the enemy.

The tension builds with every move, as each guess brings you closer to victory or defeat! 🥷🎯
<img src="https://github.com/user-attachments/assets/e25414d7-1fad-463d-b14b-1bfe68068470" alt="image" width="4000"/>


---

## 🛠 **Cool Integrations and Tools Used**

To make Ninja Strike a reality, we've used some incredible integrations and tools that power everything behind the scenes:

- **Stackr Labs Microrollup**: In [Ninja Strike](https://github.com/ChanX21/Envio-Ninja-Indexer), we've implemented an innovative tracking system that uses Proof of Gameplay to ensure every move is verified and secure. This technology, powered by [Stackr Labs](https://github.com/ChanX21/Ninja-Unity-ETH-Online-2024/tree/main/packages/backend/ninja)' Micro-Rollups, enables us to keep track of in-game actions off-chain while still providing verifiable proof of each player's moves
  
- **Envio Indexer**: The Envio Ninja Indexer helps index game state changes and synchronize game data such as leaderboards, player stats etc across multiple players in real-time, keeping your game experience smooth and responsive.
https://github.com/ChanX21/Envio-Ninja-Indexer 

- **Web3Auth Gaming SDK**:: In Ninja Strike, we've integrated Web3Auth's Gaming SDK to streamline user authentication. This integration allows players to securely and effortlessly connect to the game using decentralized login methods, improving user accessibility and enhancing security.
---



# 🏗 Scaffold-ETH 2

<h4 align="center">
  <a href="https://docs.scaffoldeth.io">Documentation</a> |
  <a href="https://scaffoldeth.io">Website</a>
</h4>

🧪 An open-source, up-to-date toolkit for building decentralized applications (dapps) on the Ethereum blockchain. It's designed to make it easier for developers to create and deploy smart contracts and build user interfaces that interact with those contracts.

⚙️ Built using NextJS, RainbowKit, Hardhat, Wagmi, Viem, and Typescript.

- ✅ **Contract Hot Reload**: Your frontend auto-adapts to your smart contract as you edit it.
- 🪝 **[Custom hooks](https://docs.scaffoldeth.io/hooks/)**: Collection of React hooks wrapper around [wagmi](https://wagmi.sh/) to simplify interactions with smart contracts with typescript autocompletion.
- 🧱 [**Components**](https://docs.scaffoldeth.io/components/): Collection of common web3 components to quickly build your frontend.
- 🔥 **Burner Wallet & Local Faucet**: Quickly test your application with a burner wallet and local faucet.
- 🔐 **Integration with Wallet Providers**: Connect to different wallet providers and interact with the Ethereum network.

![Debug Contracts tab](https://github.com/scaffold-eth/scaffold-eth-2/assets/55535804/b237af0c-5027-4849-a5c1-2e31495cccb1)

## Requirements

Before you begin, you need to install the following tools:

- [Node (>= v18.17)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

## Quickstart

To get started with Scaffold-ETH 2, follow the steps below:

1. Install dependencies if it was skipped in CLI:

```
cd my-dapp-example
yarn install
```

2. Run a local network in the first terminal:

```
yarn chain
```

This command starts a local Ethereum network using Hardhat. The network runs on your local machine and can be used for testing and development. You can customize the network configuration in `packages/hardhat/hardhat.config.ts`.

3. On a second terminal, deploy the test contract:

```
node script/decompressBrotli.js  
yarn deploy
```

This command deploys a test smart contract to the local network. The contract is located in `packages/hardhat/contracts` and can be modified to suit your needs. The `yarn deploy` command uses the deploy script located in `packages/hardhat/deploy` to deploy the contract to the network. You can also customize the deploy script.

4. On a third terminal, start your NextJS app:

```
yarn start
```

Visit your app on: `http://localhost:3000`. You can interact with your smart contract using the `Debug Contracts` page. You can tweak the app config in `packages/nextjs/scaffold.config.ts`.

Run smart contract test with `yarn hardhat:test`

- Edit your smart contract `YourContract.sol` in `packages/hardhat/contracts`
- Edit your frontend homepage at `packages/nextjs/app/page.tsx`. For guidance on [routing](https://nextjs.org/docs/app/building-your-application/routing/defining-routes) and configuring [pages/layouts](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts) checkout the Next.js documentation.
- Edit your deployment scripts in `packages/hardhat/deploy`


## Documentation

Visit our [docs](https://docs.scaffoldeth.io) to learn how to start building with Scaffold-ETH 2.

To know more about its features, check out our [website](https://scaffoldeth.io).

## Contributing to Scaffold-ETH 2

We welcome contributions to Scaffold-ETH 2!

Please see [CONTRIBUTING.MD](https://github.com/scaffold-eth/scaffold-eth-2/blob/main/CONTRIBUTING.md) for more information and guidelines for contributing to Scaffold-ETH 2.
