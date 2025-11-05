import { cookieStorage, createStorage } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mezoTestnetNetwork } from "../mezoTestnetWalletNetwork";

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID as string,
  networks: [mezoTestnetNetwork],
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
