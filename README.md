# PolyX – Gasless, On-Chain Social Network

<div align="center">

![Blockchain](https://img.shields.io/badge/Blockchain-Polygon-purple?logo=polygon&logoColor=white&style=for-the-badge)
![Network](https://img.shields.io/badge/Network-Amoy%20Testnet-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active%20Development-orange?style=for-the-badge)

![Smart Contracts](https://img.shields.io/badge/Smart%20Contracts-Solidity-navy?logo=ethereum&logoColor=white&style=flat-square)
![Frontend](https://img.shields.io/badge/Frontend-Next.js-black?logo=nextjs&logoColor=white&style=flat-square)
![Backend](https://img.shields.io/badge/Backend-Node.js-green?logo=nodejs&logoColor=white&style=flat-square)
![Database](https://img.shields.io/badge/Database-MongoDB-green?logo=mongodb&logoColor=white&style=flat-square)

[🌐 Website](#) • [📖 Documentation](#) • [🐛 Issues](https://github.com) • [💬 Discord](#)

---

**A decentralized social network where conversations live on-chain and gas is always free.**

PolyX is a modern Twitter/X alternative built on Polygon. Create posts, like, retweet, quote, comment, and follow users—all with zero gas fees thanks to our gasless relayer architecture.

</div>

---

## 🎯 Overview

PolyX combines the social experience you know with the transparency and ownership of Web3. Every action is recorded immutably on the Polygon blockchain, while our relayer network ensures you never pay a cent in gas fees.

Built with **Next.js**, **Hardhat**, **Wagmi**, and **MongoDB**, PolyX demonstrates how to scale a decentralized application with performance-first architecture.

---

## ✨ Core Features

### 🗣️ Social Features

- **Posts & Tweets** – Share thoughts with a 280-character limit
- **Likes & Interactions** – Like posts with real-time count updates
- **Retweets & Quotes** – Amplify or comment on posts
- **Comments & Threads** – Build threaded conversations
- **Follow System** – Build your audience and customize your feed
- **User Profiles** – Customizable with avatars, headers, and bios
- **Smart Feed** – View all posts or filter to following-only
- **User Discovery** – Explore and search for creators

### 💬 Messaging

- **Direct Messages** – WhatsApp-style messaging between users
- **Read Receipts** – Blue ticks show when messages are read
- **Message Management** – Delete for yourself or everyone
- **Block Feature** – Block users from contacting and viewing your content
- **Bulk Actions** – Multi-select messages for batch operations

### 🤖 AI Integration

- **AI Chatbot** – Powered by Google Gemini
- **Mention Responses** – Bot responds to @PolyXBot mentions
- **Persistent History** – Keep your chat history across sessions
- **Direct Chat** – Talk with the AI assistant anytime

### 🎨 User Experience

- **Modern 3D Design** – Glassmorphism effects and smooth animations
- **Multi-Wallet Support** – MetaMask, Rainbow, Coinbase, Trust, Zerion, Ledger
- **Fully Responsive** – Seamless experience on desktop and mobile
- **Dark Theme** – Beautiful dark UI with gradient accents
- **Real-time Updates** – Instant feed and notification refresh

---

## 🛠️ Technical Architecture

### Frontend Stack

- **Next.js 14** – React framework with App Router
- **TypeScript** – Type-safe development
- **Tailwind CSS** – Utility-first styling
- **Wagmi + Viem** – Ethereum React hooks and SDK
- **RainbowKit** – Universal wallet connection UI
- **React Query** – Server state management

### Backend Stack

- **Node.js + Express** – RESTful API server
- **TypeScript** – Type-safe backend
- **Hardhat** – Smart contract toolkit
- **MongoDB** – Document database for messages, bookmarks, reactions, and search
- **Pinata** – IPFS integration for media
- **Google Gemini** – AI chatbot engine

### Blockchain

- **Smart Contracts** – Solidity on Polygon
- **Gasless Architecture** – Relayer pattern with sponsor wallet
- **Hybrid Storage** – On-chain social graph + off-chain fast queries

---

## 📋 Implementation Status

### ✅ Completed Features

| Category | Features |
|----------|----------|
| **Posts** | Create, read, delete, edit posts |
| **Interactions** | Like, retweet, quote, comment |
| **Social Graph** | Follow/unfollow users, view followers |
| **Profiles** | Custom profiles with avatars and bios |
| **Messaging** | DMs, read receipts, blocking, bulk delete |
| **AI Chatbot** | Gemini integration, mention responses, history |
| **Storage** | On-chain smart contracts + MongoDB + IPFS |
| **Wallets** | WalletConnect, RainbowKit, multi-wallet support |
| **UI/UX** | Modern design, responsive, dark theme |

### 🚧 Planned Features

**Short-term:**
- Media uploads (images/videos)
- Hashtags and mentions
- Post search and advanced filters
- Bookmarks and sharing

**Medium-term:**
- Communities and groups
- NFT profile pictures
- Token tipping system
- Reputation scores
- Analytics dashboard

**Long-term:**
- Multi-chain support (Base, Arbitrum, Optimism)
- Native mobile apps
- Live streaming
- Post marketplace
- DAO governance

---

## 🌐 Network Support

### Current Deployment

**Polygon Amoy Testnet** (Development)
- Chain ID: 80002
- RPC: `https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY`
- Explorer: https://amoy.polygonscan.com
- Faucet: https://faucet.polygon.technology/

### Planned Mainnet Deployments

- **Polygon Mainnet** – Primary production network
- **Base Mainnet** – Coinbase's L2 solution
- **Arbitrum One** – Ethereum L2 with low fees
- **Optimism** – Ethereum L2 with fast transactions

---

## 📦 Project Structure

```
PolyX/
├── contracts/                      # Smart Contracts
│   ├── contracts/PolyX.sol        # Main social contract
│   ├── scripts/deploy.ts          # Deployment automation
│   └── hardhat.config.ts          # Hardhat configuration
│
├── backend/                        # Node.js Relayer & API
│   ├── src/
│   │   ├── index.ts               # Express server
│   │   ├── contract.ts            # Contract interactions
│   │   ├── db.ts                  # MongoDB client
│   │   ├── chatbot.ts             # AI integration
│   │   └── types.ts               # TypeScript definitions
│   │   # MongoDB collections (auto-created)
│   └── .env.example               # Configuration template
│
└── frontend/                       # Next.js Application
    ├── app/                       # App Router pages
    │   ├── page.tsx               # Home/Feed
    │   ├── explore/               # User discovery
    │   ├── messaging/             # Direct messages
    │   ├── notifications/         # Alerts & updates
    │   ├── chatbot/               # AI chat interface
    │   ├── profile/               # User profiles
    │   └── settings/              # Profile settings
    ├── components/                # React components
    ├── lib/api.ts                 # Backend client
    └── .env.example               # Configuration template
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** – JavaScript runtime
- **pnpm** (recommended) or npm/yarn – Package manager
- **Polygon Amoy RPC URL** – From Alchemy, Infura, or Ankr
- **Funded Amoy Wallet** – For deployment and relaying (0.1 test MATIC)
- **WalletConnect Project ID** – From https://cloud.walletconnect.com
- **MongoDB** – Local or Atlas at https://mongodb.com
- **Pinata Account** – For IPFS pinning at https://pinata.cloud
- **Google Gemini API Key** – Optional, for chatbot features

### Step 1: Clone & Install

```bash
git clone https://github.com/yourusername/polyx.git
cd polyx

# Install dependencies for all packages
pnpm install --filter ./contracts --filter ./backend --filter ./frontend
```

### Step 2: Deploy Smart Contracts

```bash
cd contracts
cp env.example .env

# Edit .env with your values:
# AMOY_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY
# DEPLOYER_PRIVATE_KEY=your_private_key

pnpm install
npx hardhat compile
npx hardhat run scripts/deploy.ts --network amoy

# Copy the printed contract address for next step
```

### Step 3: Setup MongoDB

1. Install MongoDB locally or use MongoDB Atlas (free tier)
2. Default connection: `mongodb://localhost:27017/polyx`
3. Collections are auto-created on first run

### Step 4: Configure & Run Backend

```bash
cd ../backend
cp env.example .env

# Edit .env with your values:
# AMOY_RPC_URL=your_rpc_url
# SPONSOR_PRIVATE_KEY=funded_wallet_private_key
# POLYX_CONTRACT_ADDRESS=0x... (from Step 2)
# MONGODB_URI=mongodb://localhost:27017/polyx
# PINATA_JWT=your_pinata_jwt
# GEMINI_API_KEY=your_gemini_key (optional)
# PORT=3001

npm install
npm run dev
```

### Step 5: Configure & Run Frontend

```bash
cd ../frontend
cp env.example .env.local

# Edit .env.local with your values:
# NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
# NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
# NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud
# NEXT_PUBLIC_POLYX_CONTRACT_ADDRESS=0x... (for Tip button)

npm install
npm run dev
```

### Step 6: Launch

Open **http://localhost:3000** in your browser and connect your wallet!

---

## 🔌 API Reference

### Posts

```
POST   /api/tweet              Create a new post
GET    /api/feed               Get feed (all posts or following)
GET    /api/post/:id           Get post details
GET    /api/posts/author/:author  Get posts by author
DELETE /api/post/:id           Delete a post
PUT    /api/post/:id           Edit a post
```

### Interactions

```
POST /api/like                  Like a post
POST /api/unlike                Unlike a post
POST /api/retweet               Retweet a post
POST /api/quote                 Create a quote tweet
POST /api/comment               Comment on a post
GET  /api/post/:id/liked/:user  Check if user liked post
```

### Social Graph

```
POST /api/follow                Follow a user
POST /api/unfollow              Unfollow a user
GET  /api/following/:user       Get following list
GET  /api/followers/:user       Get followers list
```

### Profiles

```
POST /api/profile               Create user profile
GET  /api/profile/owner/:owner  Get profile by address
GET  /api/profile/handle/:handle Get profile by handle
PUT  /api/profile               Update profile
GET  /api/handle/available/:handle Check handle availability
```

### Messaging

```
POST /api/message/send          Send a direct message
GET  /api/conversations/:user   Get all conversations
GET  /api/messages/:user/:other Get messages between users
DELETE /api/message/:id         Delete a message
POST /api/chat/clear            Clear a conversation
POST /api/block                 Block a user
POST /api/unblock               Unblock a user
```

### Chatbot

```
POST /api/chatbot/chat          Chat with AI
GET  /api/chatbot/history/:user Get chat history
POST /api/chatbot/clear         Clear history
```

### Notifications

```
GET /api/notifications/:user    Get user notifications
```

---

## 🔐 Security Considerations

- **Relayer Trust** – The backend is a trusted service; secure your server and add rate limiting
- **Key Management** – Never expose sponsor wallet keys; keep in `.env` only
- **Input Validation** – Extend built-in length checks with stricter validation
- **Spam Prevention** – Implement rate limiting and reputation checks in production
- **Database Security** – Secure MongoDB with authentication and network access control
- **CORS & Auth** – Add authentication middleware for sensitive endpoints

---

## 🧪 Testing

### Smart Contracts

```bash
cd contracts
npx hardhat test
```

### Backend API

Test endpoints using Postman or curl:

```bash
# Example: Create a post
curl -X POST http://localhost:3001/api/tweet \
  -H "Content-Type: application/json" \
  -d '{"author":"0x...", "content":"Hello PolyX!"}'
```

### Frontend

1. Connect your Amoy wallet
2. Create a post and verify it appears in the feed
3. Test likes, retweets, quotes, and follows
4. Check contract interactions on Amoy Polygonscan

---

## 📝 Environment Variables

### Smart Contracts (`contracts/.env`)

```
AMOY_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY
DEPLOYER_PRIVATE_KEY=your_private_key_here
```

### Backend (`backend/.env`)

```
AMOY_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY
SPONSOR_PRIVATE_KEY=funded_wallet_private_key
POLYX_CONTRACT_ADDRESS=0x...
MONGODB_URI=mongodb://localhost:27017/polyx
PINATA_JWT=your_pinata_jwt_token
GEMINI_API_KEY=your_gemini_api_key
CHATBOT_ADDRESS=0x... (optional)
PORT=3001
```

### Frontend (`frontend/.env.local`)

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to your branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

For major changes, please open an issue first to discuss what you would like to change.

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) file for details.

---

## 🙏 Built With

<div align="center">

| | |
|---|---|
| [Next.js](https://nextjs.org/) | Modern React framework |
| [Wagmi](https://wagmi.sh/) | Ethereum React Hooks |
| [RainbowKit](https://rainbowkit.com/) | Wallet connection UI |
| [Hardhat](https://hardhat.org/) | Smart contract development |
| [MongoDB](https://mongodb.com/) | Document database |
| [Pinata](https://pinata.cloud/) | IPFS pinning service |
| [Polygon](https://polygon.technology/) | Layer 2 blockchain network |
| [Google Gemini](https://ai.google.dev/) | AI chatbot engine |

</div>

---

## 📞 Support & Community

- 📖 **Documentation** – [Read the docs](#)
- 🐛 **Bug Reports** – [GitHub Issues](https://github.com/yourusername/polyx/issues)
- 💬 **Discord** – [Join our community](#)
- 🐦 **Twitter** – [@PolyX](https://twitter.com)
- 📧 **Email** – support@polyx.com

---

<div align="center">

**Made with ❤️ by the PolyX team**

[⬆ Back to top](#polyx--gasless-on-chain-social-network)

</div>
