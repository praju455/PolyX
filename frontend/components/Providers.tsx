"use client";
import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme, getDefaultWallets } from "@rainbow-me/rainbowkit";
import { WagmiProvider, createConfig, http } from "wagmi";
import { polygonAmoy } from "wagmi/chains";
import "@rainbow-me/rainbowkit/styles.css";
import { ThemeProvider } from "./ThemeProvider";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

const chains = [polygonAmoy] as const;
const transports = {
  [polygonAmoy.id]: http("https://rpc-amoy.polygon.technology"),
};

const { connectors } = getDefaultWallets({
  appName: "PolyX",
  projectId,
});

const config = createConfig({
  connectors,
  chains,
  transports,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <RainbowKitProvider theme={darkTheme({ accentColor: "#6366f1" })}>
            {children}
          </RainbowKitProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}


