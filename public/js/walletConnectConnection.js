window.process = { env: { NODE_ENV: 'production' } };

import {
  EthereumClient,
  w3mConnectors,
  w3mProvider,
  WagmiCore,
  WagmiCoreChains,
} from "https://unpkg.com/@web3modal/ethereum@2.7.1";
import { Web3Modal } from "https://unpkg.com/@web3modal/html@2.7.1";
import { Buffer } from 'https://cdn.skypack.dev/buffer';

window.Buffer = window.Buffer || Buffer;

const { mainnet, polygon, avalanche, arbitrum } = WagmiCoreChains;
const { configureChains, createConfig, signMessage, getAccount, disconnect } = WagmiCore;

const chains = [mainnet, polygon, avalanche, arbitrum];
const projectId = "2faedae5e25139c05cb092e6c098a44c";

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ chains, version: 2, projectId }),
  publicClient: configureChains(chains, [w3mProvider({ projectId })]).publicClient,
});

const options = {
  projectId,
  privacyPolicyUrl: 'https://genobank.io/privacy-policy',
  themeMode: 'light',
  walletImages: { safe: "https://genobank.io/images/GenoBank.io_logo@2x.svg" }
}

const web3Modal = new Web3Modal(
  options,
  new EthereumClient(wagmiConfig, chains)
);

// Function to subscribe to disconnect event
const subscribeToDisconnect = (account) => {
  console.log("subscribeToDisconnect", account)
  if (account.connector) {

    console.log("Subscribing to disconnect events")

    
    account.connector.on('disconnect', () => {
      onDisconnectWallet();
    });
  }
};



const connectAndSign = async () => {
  // Show loading spinner if button exists
  const walletConnectBtn = document.getElementById('walletConnectBtn');
  const spinner = walletConnectBtn?.querySelector('.spinner-border');
  if (spinner) {
    spinner.classList.remove('d-none');
  }

  await web3Modal.openModal();

  // Listen for modal close event
  web3Modal.subscribeModal(({ open }) => {
    if (!open) {
      console.log("Modal closed");
      // Hide spinner when modal closes
      if (spinner) {
        spinner.classList.add('d-none');
      }
    }
  });

  while (getAccount().isConnecting) {
    console.log('Waiting to complete connection...');
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  const account = getAccount();
  if (!account.connector) return console.error('Cant get the connector.');

  subscribeToDisconnect(account); // Subscribe to disconnect event

  try {
    const signature = await signMessage({ message: "I want to proceed" });
    console.log('Message signed:', signature);

    // Save to localStorage
    localStorage.setItem("user_wallet", account.address);
    localStorage.setItem("user_sign", signature);
    localStorage.setItem("login_method", "walletConnect");
    
    // Hide spinner
    if (spinner) {
      spinner.classList.add('d-none');
    }

    closingPopup()

  } catch (error) {
    console.error('Error signing message:', error);
    // Hide spinner on error
    if (spinner) {
      spinner.classList.add('d-none');
    }
  }
};

const disconnectWallet = async () => {
  try {
    await disconnect();

    console.log('Wallet desconectada.');

    // Limpiar el localStorage
    localStorage.removeItem("user_wallet");
    localStorage.removeItem("user_sign");
    localStorage.removeItem("login_method");

    location.reload()

    // Aquí puedes agregar lógica adicional si es necesario
  } catch (error) {
    console.error('Error al desconectar la wallet:', error);
  }
};

function onDisconnectWallet() {
  console.log('Wallet desconectada.');

  // localStorage.removeItem("user_wallet");
  // localStorage.removeItem("user_sign");
  // localStorage.removeItem("login_method");
  localStorage.clear()

  location.reload();
}

async function walletConnectSignMessage (message) {
  const account = getAccount();

  // Verifica si ya hay una conexión activa
  if (!account.isConnected) {
    await web3Modal.openModal();

    // Esperar a que se complete la conexión
    while (getAccount().isConnecting) {
      console.log('Waiting to complete connection...');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Firma el mensaje
  try {
    const signature = await signMessage({ message });
    console.log('Mensaje firmado:', signature);
    return signature;
  } catch (error) {
    console.error('Error al firmar el mensaje:', error);
    throw error;
  }
};


function closingPopup() {
  // In auth service, send auth data to backend
  const wallet = localStorage.getItem('user_wallet');
  const signature = localStorage.getItem('user_sign');
  
  if (wallet && signature && window.API_BASE_URL) {
    console.log('WalletConnect authentication data ready');
    
    // Send to auth service
    fetch(`${window.API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        method: 'walletconnect',
        address: wallet,
        signature: signature,
        message: 'I want to proceed'
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('WalletConnect auth response:', data);
      if (data.success) {
        // Show success message
        if (document.getElementById('successAlert')) {
          document.getElementById('successMessage').textContent = 'Authentication successful! Redirecting...';
          document.getElementById('successAlert').classList.remove('d-none');
          document.getElementById('errorAlert').classList.add('d-none');
        }
        
        // Get return URL
        const urlParams = new URLSearchParams(window.location.search);
        const returnUrl = urlParams.get('returnUrl');
        
        // Redirect
        setTimeout(() => {
          window.location.href = returnUrl || 'https://genobank.app/dashboard';
        }, 1000);
      } else {
        throw new Error(data.error || 'Authentication failed');
      }
    })
    .catch(error => {
      console.error('WalletConnect auth error:', error);
      if (document.getElementById('errorAlert')) {
        document.getElementById('errorMessage').textContent = error.message;
        document.getElementById('errorAlert').classList.remove('d-none');
        document.getElementById('successAlert').classList.add('d-none');
      }
    });
  }
}




  while (getAccount().isReconnecting) {
    console.log('Waiting to complete connection...');
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Check if there's an existing connection when loading the page
const account = getAccount();
if (account.isConnected) {
  console.log('Wallet is already connected.');
  subscribeToDisconnect(account);
}

window.disconnectWallet = disconnectWallet;
window.connectAndSign = connectAndSign;
window.walletConnectSignMessage = walletConnectSignMessage;

// document.querySelector('w3m-core-button').addEventListener('click', connectAndSign);
