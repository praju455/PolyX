# PolyX – Gasless, On-Chain Social Network on Polygon

A modern, decentralized Twitter/X clone where all core actions (post, like, retweet, quote, comment, follow) are recorded on-chain. Users never pay gas; a backend relayer with a sponsor wallet signs and sends every transaction.

## 🌟 Features

### ✅ Implemented Features

#### Core Social Features
- ✅ **Posts & Tweets** - Create and share posts (280 character limit)
- ✅ **Likes** - Like posts with real-time count updates
- ✅ **Retweets** - Retweet posts (with unretweet support)
- ✅ **Quote Tweets** - Quote posts with your own commentary
- ✅ **Comments** - Comment on posts with threaded replies
- ✅ **Follow/Unfollow** - Follow users and see their posts in your feed
- ✅ **Profile Pages** - Customizable profiles with avatars, headers, and bios
- ✅ **Feed Modes** - View all posts or filter to following-only
- ✅ **User Discovery** - Explore and search for users
- ✅ **Notifications** - Real-time notifications for likes, comments, quotes, retweets, and follows

#### Messaging Features
- ✅ **Direct Messaging** - WhatsApp-style messaging between users
- ✅ **Read Receipts** - Blue ticks to show when messages are read
- ✅ **Message Deletion** - Delete messages for yourself or everyone
- ✅ **Block Users** - Block users from messaging and seeing your content
- ✅ **Clear Chat** - Clear entire conversation history
- ✅ **Multi-select** - Select multiple messages for bulk actions

#### AI Chatbot
- ✅ **AI Assistant** - Integrated Gemini AI chatbot
- ✅ **Mention Responses** - Bot responds to @PolyXBot mentions in posts/comments
- ✅ **Chat History** - Persistent chat history per user
- ✅ **Direct Chat** - Chat directly with the AI assistant

#### User Experience
- ✅ **Modern 3D UI** - Clean, modern interface with glassmorphism effects
- ✅ **Wallet Connection** - Support for MetaMask, Rainbow, Coinbase Wallet, Trust, Zerion, Ledger via WalletConnect/RainbowKit
- ✅ **Responsive Design** - Works on desktop and mobile
- ✅ **Dark Theme** - Beautiful dark theme with gradient accents
- ✅ **Real-time Updates** - Automatic refresh of feeds and counts

#### Data Storage
- ✅ **On-Chain Storage** - Core social graph stored on blockchain
- ✅ **Supabase Integration** - Fast queries for messages, followers, and blocked users
- ✅ **IPFS/Pinata** - Media storage for images and avatars
- ✅ **Hybrid Architecture** - Best of both worlds (on-chain + off-chain)

### 🚧 Planned Features

#### Short-term (Next Release)
- [ ] **Media Posts** - Upload images/videos to posts
- [ ] **Hashtags** - Tag posts with hashtags
- [ ] **Mentions** - @mention users in posts
- [ ] **Post Search** - Search posts by content
- [ ] **Advanced Filters** - Filter feed by date, author, type
- [ ] **Post Bookmarks** - Save posts for later
- [ ] **Share Posts** - Share posts externally
- [ ] **Rich Text Editor** - Formatting options for posts

#### Medium-term
- [ ] **Groups/Communities** - Create and join communities
- [ ] **NFT Profile Pictures** - Use NFTs as profile pictures
- [ ] **Token Gating** - Exclusive content for token holders
- [ ] **Tip Posts** - Send tokens to creators
- [ ] **Reputation System** - User reputation scores
- [ ] **Moderation Tools** - Community moderation features
- [ ] **Analytics Dashboard** - Post and profile analytics
- [ ] **Export Data** - Download your data

#### Long-term
- [ ] **Multi-chain Support** - Deploy on multiple chains
- [ ] **Layer 2 Migration** - Optimize for lower costs
- [ ] **Decentralized Storage** - Full IPFS integration
- [ ] **Mobile Apps** - Native iOS and Android apps
- [ ] **Video Streaming** - Live video features
- [ ] **Audio Posts** - Voice messages and podcasts
- [ ] **Marketplace** - Buy/sell posts as NFTs
- [ ] **DAO Governance** - Community governance features

## 🌐 Supported Networks

### Currently Deployed
- **Polygon Amoy Testnet** - Primary testnet for development
  - RPC: `https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY`
  - Explorer: https://amoy.polygonscan.com
  - Faucet: https://faucet.polygon.technology/

### Planned Deployments

#### Testnets
- **Polygon Mumbai** - Alternative testnet
- **Base Sepolia** - Base testnet
- **Arbitrum Sepolia** - Arbitrum testnet
- **Optimism Sepolia** - Optimism testnet

#### Mainnets
- **Polygon Mainnet** - Primary mainnet deployment
  - Lower gas costs than Ethereum
  - Fast transactions
  - Large ecosystem
- **Base Mainnet** - Coinbase's L2
  - Very low fees
  - Growing ecosystem
- **Arbitrum One** - Ethereum L2
  - Low fees
  - EVM compatible
- **Optimism** - Ethereum L2
  - Low fees
  - Fast transactions

## 📋 Contract Addresses

### Polygon Amoy Testnet (Current - Development)

**PolyX Contract:**
```
Address: 0x[YOUR_CONTRACT_ADDRESS]
Explorer: https://amoy.polygonscan.com/address/0x[YOUR_CONTRACT_ADDRESS]
Network: Polygon Amoy Testnet
Chain ID: 80002
RPC: https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY
```

**Chatbot Address (Optional):**
```
Address: 0x[YOUR_CHATBOT_ADDRESS]
```

> **Note:** Replace `[YOUR_CONTRACT_ADDRESS]` with your deployed contract address after deployment. See deployment instructions below.

### Future Deployments

#### Polygon Mainnet (Planned)
```
Network: Polygon Mainnet
Chain ID: 137
RPC: https://polygon-rpc.com
Explorer: https://polygonscan.com
Status: Planned for v1.2
```

#### Base Mainnet (Planned)
```
Network: Base Mainnet
Chain ID: 8453
RPC: https://mainnet.base.org
Explorer: https://basescan.org
Status: Planned for v1.3
```

#### Arbitrum One (Planned)
```
Network: Arbitrum One
Chain ID: 42161
RPC: https://arb1.arbitrum.io/rpc
Explorer: https://arbiscan.io
Status: Planned for v1.4
```

#### Optimism (Planned)
```
Network: Optimism
Chain ID: 10
RPC: https://mainnet.optimism.io
Explorer: https://optimistic.etherscan.io
Status: Planned for v1.5
```

### How to Deploy Contracts

1. **Setup Environment:**
   ```bash
   cd contracts
   cp env.example .env
   # Fill in AMOY_RPC_URL and DEPLOYER_PRIVATE_KEY
   ```

2. **Deploy:**
   ```bash
   npx hardhat compile
   npx hardhat run scripts/deploy.ts --network amoy
   ```

3. **Copy Contract Address:**
   - The deployment script will print the contract address
   - Copy it to your backend `.env` file as `POLYX_CONTRACT_ADDRESS`

## 📁 Directory Structure

```
PolyX/
├── contracts/              # Smart contracts
│   ├── contracts/
│   │   └── PolyX.sol      # Main social contract
│   ├── scripts/
│   │   └── deploy.ts      # Deployment script
│   ├── hardhat.config.ts  # Hardhat configuration
│   ├── package.json
│   └── env.example        # Contract deployment config
│
├── backend/                # Node.js/Express relayer
│   ├── src/
│   │   ├── index.ts       # Express server + API routes
│   │   ├── contract.ts    # Contract bindings & interactions
│   │   ├── supabase.ts    # Supabase client & functions
│   │   ├── chatbot.ts     # Gemini AI integration
│   │   └── types.ts       # TypeScript types
│   ├── scripts/
│   │   └── get-address.js # Helper script
│   ├── supabase-schema-clean.sql      # Messages & blocked users schema
│   ├── supabase-followers-schema.sql  # Followers/following schema
│   ├── README-SUPABASE-SETUP.md      # Supabase setup guide
│   ├── package.json
│   ├── tsconfig.json
│   └── env.example        # Backend environment variables
│
└── frontend/               # Next.js frontend
    ├── app/                # Next.js App Router
    │   ├── page.tsx       # Home/Feed page
    │   ├── explore/        # User discovery
    │   ├── notifications/  # Notifications page
    │   ├── messaging/      # Direct messaging
    │   ├── chatbot/        # AI chatbot
    │   ├── profile/        # User profiles
    │   ├── settings/       # Profile settings
    │   ├── search/         # User search
    │   └── layout.tsx     # Root layout with sidebar
    ├── components/
    │   ├── Sidebar.tsx    # Left navigation sidebar
    │   ├── Footer.tsx     # Site footer
    │   ├── PostCard.tsx   # Post display component
    │   ├── Composer.tsx   # Post creation component
    │   ├── Feed.tsx       # Feed display component
    │   ├── FollowButton.tsx # Follow/unfollow button
    │   ├── ProfileStats.tsx # Follower/following stats
    │   ├── OnboardingGate.tsx # Profile creation gate
    │   └── Providers.tsx   # React Query & Wagmi providers
    ├── lib/
    │   └── api.ts         # Backend API client
    ├── render.yaml        # Render deployment configuration
    ├── package.json
    ├── tailwind.config.js
    ├── postcss.config.js
    └── env.example        # Frontend environment variables
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm/yarn
- Polygon Amoy RPC URL (e.g., Alchemy/Infura/Ankr)
- A funded Amoy account for deployer/sponsor (0.1 test MATIC is plenty)
- WalletConnect Cloud project ID (for universal wallet connections)
- Supabase account (for messages and followers)
- Pinata account (for media storage)
- Google Gemini API key (for chatbot - optional)

### 1. Install Dependencies

```bash
# Install all dependencies
pnpm install --filter ./contracts --filter ./backend --filter ./frontend
```

### 2. Deploy Contracts

```bash
cd contracts
cp env.example .env
# Fill in: AMOY_RPC_URL, DEPLOYER_PRIVATE_KEY
pnpm install
npx hardhat compile
npx hardhat run scripts/deploy.ts --network amoy
# Copy the printed contract address
```

### 3. Setup Supabase

1. Create a Supabase project at https://supabase.com
2. Go to SQL Editor and run:
   - `backend/supabase-schema-clean.sql` (for messages & blocked users)
   - `backend/supabase-followers-schema.sql` (for followers/following)
3. Copy your Supabase URL and anon key

### 4. Configure Backend

```bash
cd ../backend
cp env.example .env
# Fill in:
# - AMOY_RPC_URL
# - SPONSOR_PRIVATE_KEY (funded Amoy wallet)
# - POLYX_CONTRACT_ADDRESS (from step 2)
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - PINATA_JWT
# - GEMINI_API_KEY (optional, for chatbot)
# - CHATBOT_ADDRESS (optional, for mention responses)
# - PORT (default: 3001)
pnpm install
pnpm dev
```

### 5. Configure Frontend

```bash
cd ../frontend
cp env.example .env.local
# Fill in:
# - NEXT_PUBLIC_BACKEND_URL (e.g., http://localhost:3001)
# - NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
# - NEXT_PUBLIC_PINATA_GATEWAY (optional, defaults to Pinata)
pnpm install
pnpm dev
```

### 6. Open the App

Navigate to `http://localhost:3000` and connect your wallet!

## 🚀 Deployment

### Render Deployment (Recommended)

Deploy both frontend and backend to Render in one go!

**Quick Start:**
1. Push your code to GitHub
2. Go to [dashboard.render.com](https://dashboard.render.com)
3. Click **New +** → **Blueprint**
4. Connect your repository (Render will detect `render.yaml`)
5. Set environment variables for both services
6. Deploy!

**Or Manual Setup:**
- See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for detailed step-by-step instructions
- See [RENDER_QUICK_START.md](./RENDER_QUICK_START.md) for a 5-minute quick guide

**Deployment Options:**

**Option 1: Render (Recommended)**
- ✅ Easy setup with Blueprint
- ✅ Automatic deployments
- ✅ Free tier available (services sleep after 15 min)
- ✅ Starter plan: $7/month per service (no sleep)
- See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)

**Option 2: Railway**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

**Option 3: Other Platforms**
- Vercel (frontend only, serverless functions)
- Heroku (paid plans)
- DigitalOcean App Platform
- AWS/GCP/Azure

## 🔧 Backend API Endpoints

### Posts
- `POST /api/tweet` - Create a post
- `GET /api/feed` - Get feed (all posts)
- `GET /api/post/:id` - Get post details
- `GET /api/posts/author/:author` - Get posts by author
- `DELETE /api/post/:id` - Delete a post
- `PUT /api/post/:id` - Edit a post

### Interactions
- `POST /api/like` - Like a post
- `POST /api/unlike` - Unlike a post
- `POST /api/retweet` - Retweet a post
- `POST /api/quote` - Quote a post
- `POST /api/comment` - Comment on a post
- `GET /api/post/:id/liked/:user` - Check if user liked post

### Social Graph
- `POST /api/follow` - Follow a user
- `POST /api/unfollow` - Unfollow a user
- `GET /api/following/:user` - Get users following list
- `GET /api/followers/:user` - Get users followers list

### Profiles
- `POST /api/profile` - Create profile
- `GET /api/profile/owner/:owner` - Get profile by address
- `GET /api/profile/handle/:handle` - Get profile by handle
- `GET /api/handle/available/:handle` - Check handle availability
- `PUT /api/profile` - Update profile

### Messaging
- `POST /api/message/send` - Send a message
- `GET /api/conversations/:user` - Get all conversations
- `GET /api/messages/:user/:other` - Get messages between users
- `DELETE /api/message/:id` - Delete a message
- `POST /api/chat/clear` - Clear a conversation
- `POST /api/block` - Block a user
- `POST /api/unblock` - Unblock a user
- `GET /api/blocked/:user/:other` - Check if user is blocked
- `GET /api/blocked/:user` - Get all blocked users

### Chatbot
- `POST /api/chatbot/chat` - Chat with AI bot
- `GET /api/chatbot/history/:user` - Get chat history
- `POST /api/chatbot/clear` - Clear chat history

### Notifications
- `GET /api/notifications/:user` - Get user notifications

## 🔐 Security Notes

- The backend is a trusted relayer; lock down the server, rate-limit, and add auth as needed
- Place the sponsor key in `.env` only, never in the frontend
- Inputs are length-checked; extend with stricter validation and spam controls for production
- Feeds are assembled via on-chain reads; for scale, add an indexer/subgraph
- Supabase uses anon key for client-side operations; consider RLS policies for production

## 🧪 Testing

1. **Contracts**: Run `npx hardhat test` inside `contracts/`
2. **Backend**: Test routes with curl/Postman
3. **Frontend**: Connect wallet, post, like, retweet, quote, follow, message, and verify on-chain

## 📝 Environment Variables

### Contracts
- `AMOY_RPC_URL` - Polygon Amoy RPC endpoint
- `DEPLOYER_PRIVATE_KEY` - Private key for deployment

### Backend
- `AMOY_RPC_URL` - Polygon Amoy RPC endpoint
- `SPONSOR_PRIVATE_KEY` - Funded wallet that pays gas
- `POLYX_CONTRACT_ADDRESS` - Deployed contract address
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anon key
- `PINATA_JWT` - Pinata JWT token for IPFS
- `GEMINI_API_KEY` - Google Gemini API key (optional)
- `CHATBOT_ADDRESS` - Chatbot wallet address (optional)
- `PORT` - Server port (default: 3001)

### Frontend
- `NEXT_PUBLIC_BACKEND_URL` - Backend API URL
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - WalletConnect project ID
- `NEXT_PUBLIC_PINATA_GATEWAY` - IPFS gateway URL (optional)

## 📄 License

MIT

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) - React framework
- [Wagmi](https://wagmi.sh/) - React Hooks for Ethereum
- [RainbowKit](https://rainbowkit.com/) - Wallet connection UI
- [Supabase](https://supabase.com/) - Backend as a service
- [Pinata](https://pinata.cloud/) - IPFS pinning service
- [Google Gemini](https://ai.google.dev/) - AI chatbot
- [Hardhat](https://hardhat.org/) - Ethereum development environment
- [Polygon](https://polygon.technology/) - Layer 2 blockchain
- [Render](https://render.com/) - Deployment platform

## 📞 Support

For issues, questions, or contributions, please open an issue on GitHub.
