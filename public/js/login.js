
// Authentication cookie utilities
const AUTH_COOKIE_CONFIG = {
    domain: '.genobank.app',
    maxAge: 86400, // 24 hours in seconds
    secure: true,
    sameSite: 'strict',
    path: '/'
};

function setAuthCookie(name, value, maxAge = AUTH_COOKIE_CONFIG.maxAge) {
    if (!value) return;
    
    const cookieString = `${name}=${encodeURIComponent(value)}; ` +
        `domain=${AUTH_COOKIE_CONFIG.domain}; ` +
        `path=${AUTH_COOKIE_CONFIG.path}; ` +
        `max-age=${maxAge}; ` +
        `samesite=${AUTH_COOKIE_CONFIG.sameSite}`;
    
    // Only add secure flag if on HTTPS
    if (window.location.protocol === 'https:') {
        document.cookie = cookieString + '; secure';
    } else {
        document.cookie = cookieString;
    }
}

function setAuthData(authData) {
    const {
        user_sign,
        user_wallet,
        magic_token,
        login_method,
        isPermittee,
        email,
        name,
        picture
    } = authData;
    
    // Set cookies for cross-domain access
    if (user_sign) setAuthCookie('user_sign', user_sign);
    if (user_wallet) setAuthCookie('user_wallet', user_wallet);
    if (magic_token) setAuthCookie('magic_token', magic_token);
    if (login_method) setAuthCookie('login_method', login_method);
    if (isPermittee !== undefined) setAuthCookie('isPermittee', isPermittee.toString());
    if (email) setAuthCookie('email', email);
    if (name) setAuthCookie('name', name);
    if (picture) setAuthCookie('picture', picture);
    
    // Also set localStorage for backward compatibility
    if (user_sign) localStorage.setItem('user_sign', user_sign);
    if (user_wallet) localStorage.setItem('user_wallet', user_wallet);
    if (magic_token) localStorage.setItem('magic_token', magic_token);
    if (login_method) localStorage.setItem('login_method', login_method);
    if (isPermittee !== undefined) localStorage.setItem('isPermittee', isPermittee.toString());
    if (email) localStorage.setItem('email', email);
    if (name) localStorage.setItem('name', name);
    if (picture) localStorage.setItem('picture', picture);
}

// Use environment-aware configuration
const GENOBANK_SERVER = window.GENOBANK_APP_API || "https://genobank.app"
const MESSAGE_TO_SIGN = "I want to proceed"
const RPC_NETWORK = window.RPC_NETWORK || "https://api.avax-test.network/ext/bc/C/rpc"
const CHAIN_ID = window.CHAIN_ID || 43113
const MAGIC_API_KEY = window.MAGIC_API_KEY || "pk_live_5F9630468805C3A0"
const NETWORK_NAME = "Avalanche"
let metamaskLoader, googleLoader;

// Wait for jQuery to load
$(document).ready(function() {
    metamaskLoader = $("#walletBtn .spinner-border");
    googleLoader = $("#googleBtn .spinner-border");
});

async function loginUsingMetamask() {
	console.log("Metamask login")
	metamaskLoader.removeClass('d-none')
	if (typeof window.ethereum === 'undefined') {
		showErrorToast("MetaMask is not detected. Please install MetaMask and try again.");
		metamaskLoader.addClass('d-none');
		return;
	}
	try {
		await startingMetamaskLoginProcess()
		// Send to auth service
		await sendAuthToService('metamask')
	} catch (e) {
		console.log(e.code + ":" + e.message)
		showErrorToast(e.code + " : " + e.message)
		console.error(e)
		return e
	} finally {
		metamaskLoader.addClass('d-none')
	}
}

async function startingMetamaskLoginProcess(){
	let provider = new ethers.providers.Web3Provider(window.ethereum);
	await window.ethereum.request({ method: 'eth_requestAccounts' });
	let sign_autentication = await provider.getSigner().signMessage(MESSAGE_TO_SIGN);
	let wallet = await provider.getSigner().getAddress()
	let isPerm = await getValidatePermittee(wallet)
	
	// Set both cookies and localStorage
	setAuthData({
		user_sign: sign_autentication,
		user_wallet: wallet,
		isPermittee: !!isPerm,
		login_method: 'metamask'
	});
}


function magicConstructor() {
    console.log("Creating Magic instance with:");
    console.log("- API Key:", MAGIC_API_KEY);
    console.log("- RPC URL:", RPC_NETWORK);
    console.log("- Chain ID:", CHAIN_ID);
    
    try {
        const magic = new Magic(MAGIC_API_KEY, {
            extensions: [new MagicOAuthExtension()],
            network: {
                rpcUrl: RPC_NETWORK,
                chainId: CHAIN_ID
            }
        });
        
        console.log("Magic instance created successfully");
        return magic;
    } catch (error) {
        console.error("Error creating Magic instance:", error);
        throw error;
    }
}


function getCurrentDomainWithPort() {
	const location = window.location;
	let domain = location.hostname;
	if (location.port && location.port !== "80" && location.port !== "443") {
		domain += ':' + location.port;
	}
	return domain;
}

async function loginUsingOAuthClient() {
	googleLoader.removeClass('d-none')
	let magic = magicConstructor();
	
	// For auth service, always use the fixed redirect URI
	const fullRedirectURI = 'https://auth.genobank.app/oauth-callback.html';
	
	console.log('=== Magic Link OAuth Debug ===');
	console.log('Full Redirect URI:', fullRedirectURI);
	console.log('Magic API Key:', window.MAGIC_API_KEY || MAGIC_API_KEY);
	console.log('Current location:', window.location.href);
	
	try {
		await magic.oauth.loginWithRedirect({
			provider: 'google',
			redirectURI: fullRedirectURI
		});
	} catch (error) {
		console.error('OAuth Error:', error);
		showErrorToast('OAuth Error: ' + error.message);
		googleLoader.addClass('d-none');
	}
}

async function handleOAuthResult() {
	try {
		console.log("=== Starting OAuth Result Handler ===");
		let magic = magicConstructor();
		console.log("Magic instance created");
		
		// Get OAuth result
		const result = await magic.oauth.getRedirectResult();
		console.log("OAuth result:", result);
		
		// Extract wallet address - simplified approach like OpenCRAVAT
		const walletAddress = result?.magic?.userMetadata?.publicAddress;
		console.log("Wallet address from OAuth:", walletAddress);
		
		if (!walletAddress) {
			console.error("No wallet address in OAuth result");
			throw new Error("Unable to get wallet address from OAuth login");
		}
		
		// Store wallet address for signAndVerify
		localStorage.setItem('user_wallet', walletAddress);
		
		// Skip permittee validation for OAuth users (they're regular users by default)
		let isPerm = false;
		console.log("Is permittee:", isPerm);
		
		// Sign message
		console.log("Signing message...");
		const real_signature = await signAndVerify(MESSAGE_TO_SIGN);
		console.log("Signature obtained:", real_signature);
		
		// Store auth data
		const authData = {
			user_sign: real_signature,
			user_wallet: walletAddress,
			isPermittee: !!isPerm,
			email: result?.oauth?.userInfo?.email,
			name: result?.oauth?.userInfo?.name,
			picture: result?.oauth?.userInfo?.picture,
			login_method: 'magic',
			magic_token: real_signature
		};
		
		console.log("Setting auth data...");
		setAuthData(authData);
		
		// Send authentication to backend
		console.log("Sending auth to backend...");
		await sendAuthToService('google');
		
		// OAuth handled successfully, no need to redirect back to login
		console.log("OAuth authentication complete");
		
	} catch (error) {
		console.error("OAuth handler error:", error);
		console.error("Error details:", error.stack);
		
		// Try to clear session and retry
		if (confirm("Login error: " + error.message + "\n\nWould you like to try again?")) {
			await clearSessionAndRetry();
		}
	}
}









function showErrorToast(message) {
	if ($('#errorAlert').length) {
		$('#errorMessage').text(message);
		$('#errorAlert').removeClass('d-none');
		$('#successAlert').addClass('d-none');
	} else {
		alert('Error: ' + message);
	}
}

function showSuccessToast(message) {
	if ($('#successAlert').length) {
		$('#successMessage').text(message);
		$('#successAlert').removeClass('d-none');
		$('#errorAlert').addClass('d-none');
	} else {
		console.log('Success: ' + message);
	}
}


// async function signAndVerify (message){
// 	try{
// 		let account = localStorage.getItem('user_wallet')
// 		const magic = new Magic(MAGIC_API_KEY, {
// 			network: NETWORK_NAME,
// 		});
// 		console.log("magic constructor",magic)
// 		const web3 = new Web3(magic.rpcProvider);
// 		console.log("sign and verify mensaje: ", message)
// 		const signedMessage = await web3.eth.personal.sign(
// 			message,
// 			account,
// 			""
// 		);
// 		console.log("signedMessage ", signedMessage)

// 		return signedMessage
// 	}catch(error){
// 		console.error("error", error)
// 	}
// }



async function signAndVerify(message) {
    try {
        let account = localStorage.getItem('user_wallet');
        console.log("Account:", account);
        
        if (!account) {
            throw new Error("No account found in localStorage.");
        }
        
        const magic = magicConstructor();
        console.log("Magic constructor:", magic);
        
        const web3 = new Web3(magic.rpcProvider);
        
        // Check if user is logged in
        const isLoggedIn = await magic.user.isLoggedIn();
        if (!isLoggedIn) {
            throw new Error("User is not logged in with Magic.");
        }
        
        console.log("Signing message:", message);
        const signedMessage = await web3.eth.personal.sign(
            message,
            account,
            ""
        );
        console.log("Signed message obtained");
        
        return signedMessage;
    } catch (error) {
        console.error("Error signing the message:", error);
        showErrorToast("Error signing the message: " + error.message);
        throw error;
    }
}





function getProvider() {
	const loginMethod = getLoginMethod();
	if (loginMethod === 'metamask') {
		return new ethers.providers.Web3Provider(window.ethereum);
	} else if (loginMethod === 'magic') {
		const magic = magicConstructor()
		return magic.rpcProvider
	} else {
		throw new Error('Provider not set')
	}
}










async function getValidatePermittee(address) {
	// Use proxy endpoint to avoid CORS issues
	const url = new URL(`${window.API_BASE_URL}/proxy/validate_permittee`)
	url.searchParams.append('permittee', address);
	return fetch(url, {
		method: 'GET',
		headers: {
			"Content-type": "application/json; charset=UTF-8"
		},
	}).then((res) => {
		return res.json();
	}).catch((e) => {
		console.log('Validate permittee error:', e);
		return false; // Default to non-permittee if error
	});
}


// complement 


async function sendAuthToService(method) {
    const wallet = localStorage.getItem('user_wallet');
    const signature = localStorage.getItem('user_sign');
    const email = localStorage.getItem('email');
    const name = localStorage.getItem('name');
    const magicToken = localStorage.getItem('magic_token');
    
    if (!wallet || !signature) {
        throw new Error('Missing authentication data');
    }
    
    try {
        let authData;
        
        if (method === 'google') {
            // For Google OAuth via Magic, send with google method
            authData = {
                method: 'google',
                address: wallet,
                signature: signature,
                email: email || '',
                token: magicToken || signature
            };
            
            // Add optional fields
            if (name) authData.name = name;
        } else {
            // For wallet-based methods
            authData = {
                method: method,
                address: wallet,
                signature: signature,
                message: MESSAGE_TO_SIGN
            };
            
            // Only add email and name if they exist
            if (email) authData.email = email;
            if (name) authData.name = name;
        }
        
        const response = await fetch(`${window.API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(authData)
        });
        
        let data;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            // Handle non-JSON responses (like rate limit text)
            const text = await response.text();
            data = {
                success: false,
                error: text || `HTTP ${response.status}: ${response.statusText}`
            };
        }
        
        console.log('Auth response:', data);
        
        if (response.ok && data.success) {
            // Get return URL from query params
            const urlParams = new URLSearchParams(window.location.search);
            const returnUrl = urlParams.get('returnUrl');
            
            // Show success message
            showSuccessToast('Authentication successful! Redirecting...');
            
            // Redirect
            setTimeout(() => {
                window.location.href = returnUrl || '/dashboard.html';
            }, 1000);
        } else {
            // Handle rate limiting specifically
            if (response.status === 429) {
                throw new Error('Too many login attempts. Please wait a minute and try again.');
            }
            throw new Error(data.error || 'Authentication failed');
        }
    } catch (error) {
        console.error('Auth service error:', error);
        throw error;
    }
}

function closingPopup() {
    // For auth service, we need to handle this differently based on context
    const loginMethod = localStorage.getItem('login_method');
    
    if (loginMethod === 'magic') {
        // For Magic/Google OAuth, auth is already sent in handleOAuthResult
        console.log('Magic OAuth - auth already handled');
    } else {
        // For other methods, send auth now
        sendAuthToService(loginMethod).catch(console.error);
    }
}


function isCurrentUserPermittee() {
	const permitteeValue = localStorage.getItem('isPermittee');
	return permitteeValue === "true";
}

function isMetaMaskMobileBrowser() {
	const userAgent = (navigator.userAgent || '').toLowerCase();
	return userAgent.includes('metamaskmobile');
  }




// Function to clear session and retry login
async function clearSessionAndRetry() {
	try {
		console.log("Clearing session and retrying...");
		
		// Clear localStorage
		localStorage.clear();
		
		// Clear cookies
		document.cookie.split(";").forEach(function(c) { 
			document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/;domain=.genobank.app");
		});
		
		// Try to logout from Magic if instance exists
		try {
			const magic = magicConstructor();
			const isLoggedIn = await magic.user.isLoggedIn();
			if (isLoggedIn) {
				await magic.user.logout();
				console.log("Logged out from Magic");
			}
		} catch (e) {
			console.log("Could not logout from Magic:", e);
		}
		
		// Redirect to login page
		window.location.href = '/login/genobank_auth/';
	} catch (error) {
		console.error("Error clearing session:", error);
		// Force redirect anyway
		window.location.href = '/login/genobank_auth/';
	}
}

// Exportar funciones globalmente
window.loginUsingMetamask = loginUsingMetamask;
window.loginUsingOAuthClient = loginUsingOAuthClient;
window.handleOAuthResult = handleOAuthResult;
window.showErrorToast = showErrorToast;
window.signAndVerify = signAndVerify;
window.getProvider = getProvider;
window.getValidatePermittee = getValidatePermittee;
window.closingPopup = closingPopup;
window.isCurrentUserPermittee = isCurrentUserPermittee;
window.isMetaMaskMobileBrowser = isMetaMaskMobileBrowser;
window.startingMetamaskLoginProcess = startingMetamaskLoginProcess;
window.clearSessionAndRetry = clearSessionAndRetry;

