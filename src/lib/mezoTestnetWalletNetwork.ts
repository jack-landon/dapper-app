import { defineChain } from "@reown/appkit/networks";

export const mezoTestnetNetwork = /*#__PURE__*/ defineChain({
  id: 31611,
  name: "Mezo Testnet",
  nativeCurrency: { name: "Bitcoin", symbol: "BTC", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://rpc.test.mezo.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://explorer.test.mezo.org",
      apiUrl: "https://api.explorer.test.mezo.org/api/v2",
    },
  },
  testnet: true,
  chainNamespace: "eip155",
  caipNetworkId: "eip155:31611",
});
