# Photon

A demo crypto wallet for iOS, built with Expo and React Native.

Photon recreates the structure and feel of a modern mobile wallet - portfolio
home, token detail with price charts, swap, activity feed, send/receive/buy
flows - as a **simulator**. Every balance is fake and editable. There is no
blockchain connection, no key material, no signing and no money. It exists to
demonstrate wallet UI/UX safely.

> **Demo - not real funds.** Balances are simulated. The recovery phrase shown
> during onboarding is cosmetic and nothing derives keys from it. Addresses are
> random strings in the right shape and cannot receive anything.

---

## Features

**Navigation**
- Segmented pill bar at the top: **Home / Trade / Explore**
- Persistent search field and a primary action button pinned to the bottom
- Account sheet (tap `Account 1`) for Collectibles, Activity, asset list and Settings

**Portfolio**
- Total USD balance with a weighted 24h change shown as a coloured pill, and pull-to-refresh
- **Tokens**: ETH, SOL, USDT, BTC, SUI, MATIC, USDC, BONK, JUP, RAY
- **Stocks**: AAPL, NVDA, TSLA, MSFT, SPY - tokenised equities priced from a separate provider
- Real issuer logos with verification ticks, falling back to a generated badge when offline
- Simulated cash balance card
- Manage asset list - hide or show anything without losing its balance

**Token detail**
- Interactive price chart with a draggable scrubber
- 1H / 1D / 1W / 1M / 1Y timeframes
- Your-holdings block, action menu (Buy, Stake, View on explorer, Share)
- Per-token transaction history

**Flows** - all of them mutate local state and append to Activity
- **Send**: token picker to recipient and amount, review sheet, animated success
- **Swap**: from/to panels, flip control, MAX and 50% shortcuts, live rate line, review sheet
- **Buy**: mock purchase, pick a token and a USD amount, balance is credited
- **Receive**: network selector (Solana / Ethereum / Polygon / Bitcoin), QR code, copy and share

**Other**
- Onboarding with a randomly generated 12-word phrase and an "I saved it" gate
- Activity feed grouped by day, with a transaction detail sheet
- Explore tab - searchable directory of well-known Solana apps (inert, demo-only sheet)
- Collectibles - faithful empty state; NFTs are out of scope
- Settings, including a permanent demo disclosure

### Hidden demo panel

**Tap the total balance on Home five times within three seconds.** (Also reachable
from Settings > Demo > Demo Settings.) It lets you:

- Edit any token balance directly
- Edit the simulated cash balance
- Add a custom token (name, symbol, balance, badge colour)
- Toggle the `DEMO FUNDS` banner on Home
- Reset everything to factory demo data

The "Demo - not real funds" labelling in Settings and in the demo panel is
deliberately not removable.

---

## How the fake data works

| Concern | Approach |
| --- | --- |
| Crypto prices | Real USD quotes from CoinGecko's free public API, cached 60s, with a bundled static table as an offline fallback. Fake balances multiplied by real prices give plausible totals. |
| Stock prices | Yahoo Finance's public chart endpoint, one request per ticker, same 60s cache and fallback. A failure in one provider never blanks out the other section. |
| Logos | Loaded at runtime from the issuers (CoinGecko for tokens, Financial Modeling Prep for equities) rather than bundled. Any image that fails to load falls back to a generated colour-and-letter badge, so the list still renders offline. |
| Charts | Seeded random walk per `token:timeframe`, so the curve is identical every time you open a screen. Rescaled to end at the live price, and the 1D series is anchored to the real 24h change. |
| Addresses | Random strings in the correct alphabet and length: base58 43-44 chars for Solana, `0x` + 40 hex for EVM, bech32-shaped for Bitcoin. Generated once and persisted. |
| Signatures | Random base58, 87-88 chars, matching Solana's shape. |
| Activity | 16 seeded transactions spread over roughly six weeks on first launch, so the feed is never empty. |
| Persistence | Zustand + AsyncStorage. Full reset restores factory data. |

No cryptography is performed anywhere. The BIP-39 wordlist is included purely so
the onboarding phrase looks authentic.

---

## Run it locally

Requires Node 20+.

```bash
npm install
npm start
```

Then scan the QR code with **Expo Go** on your phone, or press `i` / `a` for a
simulator. The app runs fully in Expo Go - there are no custom native modules.

Useful scripts:

```bash
npm run typecheck   # tsc --noEmit
npm run ios         # start with the iOS simulator
npm run web         # run in a browser
```

---

## How the CI build works

`.github/workflows/ios-build.yml` produces an **unsigned** `.ipa` on a GitHub
macOS runner. It triggers on a `v*` tag push, or manually via
*Actions > Build unsigned iOS IPA > Run workflow*.

1. Selects the newest Xcode installed on the runner
2. Node 22 with an npm cache, then `npm ci`
3. `npx expo prebuild --platform ios --clean` generates the native project
4. `npx pod-install` installs CocoaPods dependencies
5. `xcodebuild archive` with `CODE_SIGNING_ALLOWED=NO` - no certificates needed
6. Packages the archive by hand: `Payload/Photon.app` zipped to `Photon.ipa`
   (`-exportArchive` is not usable because it demands a signing identity)
7. Publishes a GitHub Release with the `.ipa` attached - a tag push makes a real
   release, a manual run makes a prerelease named after the run number

The repo is public on purpose: public repos get free unlimited Actions minutes,
while private repos bill macOS runners at 10x against the monthly quota.

---

## Installing on iPhone from Windows

The released `.ipa` is unsigned, so you sign it yourself with a **free** Apple
ID. No Mac and no paid developer account required.

1. Download `Photon.ipa` from the [Releases](../../releases) page.
2. Install [Sideloadly](https://sideloadly.io) and iTunes (the non-Microsoft-Store
   version, so Sideloadly can talk to the device).
3. Connect your iPhone over USB and trust the computer.
4. Drag `Photon.ipa` into Sideloadly, enter your Apple ID, and click **Start**.
   Use an app-specific password if you have two-factor authentication on.
5. On the phone: **Settings > General > VPN & Device Management** and trust your
   developer certificate.
6. Launch Photon.

### About the 7-day expiry

A free Apple ID signature is valid for **7 days**, after which the app stops
launching. Two options:

- **Re-sign with Sideloadly** every week - reconnect and repeat step 4. Your data
  is preserved as long as you do not delete the app.
- **Use [AltStore](https://altstore.io)** instead, which keeps a helper running
  on your PC and refreshes the signature automatically in the background while
  the phone is on the same Wi-Fi.

A free Apple ID is also limited to 3 sideloaded apps at a time and 10 app IDs per
7 days.

---

## Project layout

```
app/                     Expo Router routes (file-based)
  (main)/                Chrome + Home, Trade, Explore
  onboarding/            Welcome and recovery-phrase screens
  token/[id].tsx         Asset detail with chart
  send/                  Token picker and compose/review/success
  collectibles.tsx  activity.tsx  receive.tsx  buy.tsx
  settings.tsx  demo-settings.tsx  manage-tokens.tsx
src/
  components/            Screen, Card, buttons, rows, chart, token badges, logo
  data/                  Token catalogue, dApp directory, BIP-39 wordlist
  lib/                   Formatting, seeded RNG, base58, chart series, price APIs
  store/                 Zustand stores: wallet, prices, portfolio selectors
  theme/                 Colours, radii, spacing, type scale
tools/                   Asset and wordlist generators
```

## Branding

**Photon's own branding is original.** The name and the disc mark are mine; the
app icons are generated procedurally by `tools/gen-icons.mjs` - a flat disc with
a negative-space "P", drawn from the geometry in that file and mirrored by
`src/components/Logo.tsx` so the icon and the in-app mark are the same shape. No
other wallet's name, logo, artwork or copy appears anywhere in the app, repo or
metadata.

**Asset logos belong to their issuers.** Token and company marks are referenced
by URL and fetched at runtime for identification purposes, exactly as any
portfolio app does; none are redistributed in this repository. They remain the
property of their respective owners, and the generated badge fallback means the
app is fully functional without them.

## Licence

MIT - see [LICENSE](LICENSE).
