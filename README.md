# BERTH Presale UI

This app uses Wagmi + Web3Modal for wallet connections and Ethers v6 for contract calls. Follow these steps to avoid common wallet-connect issues.

## Quick setup

1) Environment variables

Create `.env.local` for development (do not commit):

```
REACT_APP_WC_PROJECT_ID=your_walletconnect_project_id
# Enable the Web3Modal Explorer ("View all wallets").
# Leave true for HTTPS or tunnel URLs. Set false on HTTP to avoid modal UI crashes.
REACT_APP_WC_ENABLE_EXPLORER=true

# Serve dev over HTTPS for WalletConnect reliability
HTTPS=true
# Optional: trusted local certs (mkcert recommended)
# SSL_CRT_FILE=/abs/path/localhost+1.pem
# SSL_KEY_FILE=/abs/path/localhost+1-key.pem
```

WalletConnect Cloud → Allowed Origins should include your exact dev/prod origins, e.g.:
- https://localhost:3000
- https://127.0.0.1:3000
- https://your-domain.tld

2) Contracts

Set the correct mainnet addresses in:
- `src/contracts/BerthPresaleABI.js` → `berthPresaleAddress`
- `src/contracts/BerthTokenABI.js` → `berthAddress`

The UI verifies that both contracts are deployed (non-empty code) on Ethereum Mainnet and will show a clear error if not.

3) Chain

Connect on Ethereum Mainnet. The app attempts to auto-switch or add chain (using a public RPC). If blocked by your wallet, switch manually.

4) Run

```sh
npm install --legacy-peer-deps
npm start
```

Then open https://localhost:3000 (or your HTTPS tunnel URL)

Troubleshooting:
- If you see a Web3Modal crash on "View all wallets" in dev: ensure HTTPS and set `REACT_APP_WC_ENABLE_EXPLORER=true`, or set it to `false` on plain HTTP.
- If SSL errors appear: generate local certs with mkcert and set `SSL_CRT_FILE`/`SSL_KEY_FILE`, then restart `npm start`.

---

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
