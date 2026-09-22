// services/mpesaService.js
// Handles M-Pesa API OAuth Token Generation & Lipa Na M-Pesa STK Push Requests

const axios = require('axios');

let cachedToken = null;
let tokenExpiry = null;
const DEFAULT_TIMEOUT_MS = 30000;

class MpesaService {
    getConfig() {
        const consumerKey = process.env.MPESA_CONSUMER_KEY;
        const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
        const shortCode = process.env.MPESA_SHORTCODE || '174379'; // Default Lipa Na M-Pesa Sandbox shortcode
        const passkey = process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'; // Sandbox passkey
        const env = (process.env.MPESA_ENV || 'sandbox').toLowerCase();
        const timeoutMs = parseInt(process.env.MPESA_TIMEOUT_MS || DEFAULT_TIMEOUT_MS, 10);
        const baseUrl = env === 'production' 
            ? 'https://api.safaricom.co.ke' 
            : 'https://sandbox.safaricom.co.ke';

        const rawCallbackUrl = process.env.MPESA_CALLBACK_URL;
        const secret = process.env.MPESA_CALLBACK_SECRET;
        let callbackUrl = rawCallbackUrl;

        if (rawCallbackUrl && secret) {
            try {
                const urlObj = new URL(rawCallbackUrl);
                urlObj.searchParams.set('secret', secret);
                callbackUrl = urlObj.toString();
            } catch (e) {
                console.warn('⚠️ Invalid MPESA_CALLBACK_URL format, using raw value:', e.message);
                callbackUrl = rawCallbackUrl;
            }
        }

        return { consumerKey, consumerSecret, shortCode, passkey, env, baseUrl, callbackUrl, timeoutMs };
    }

    validateCallbackUrl(callbackUrl) {
        if (!callbackUrl) {
            throw new Error('MPESA_CALLBACK_URL is required for STK Push. Use a public HTTPS URL, for example an ngrok/cloudflared URL ending in /api/payments/callback.');
        }

        let urlObj;
        try {
            urlObj = new URL(callbackUrl);
        } catch (e) {
            throw new Error(`MPESA_CALLBACK_URL is not a valid URL: ${callbackUrl}`);
        }

        const hostname = urlObj.hostname.toLowerCase();
        const isLocalhost = ['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(hostname);
        const isPrivateIp = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(hostname);

        if (urlObj.protocol !== 'https:' || isLocalhost || isPrivateIp) {
            throw new Error('MPESA_CALLBACK_URL must be a public HTTPS URL reachable by Safaricom. Localhost/private HTTP callbacks will not work for Daraja STK Push.');
        }
    }

    getSafaricomError(error) {
        if (error.code === 'ECONNABORTED') {
            return 'Safaricom request timed out. Check internet/firewall/proxy access to the Daraja host or increase MPESA_TIMEOUT_MS.';
        }

        if (['ETIMEDOUT', 'ECONNRESET', 'ENETUNREACH', 'EHOSTUNREACH'].includes(error.code)) {
            return `Cannot connect to Safaricom Daraja (${error.code}). Check network/firewall/proxy/VPN access to sandbox.safaricom.co.ke or api.safaricom.co.ke on port 443.`;
        }

        return null;
    }

    /**
     * Generate Safaricom Access Token (OAuth 2.0)
     * @returns {Promise<string>} Bearer Access Token
     */
    async getAccessToken() {
        // Return cached token if still valid
        if (cachedToken && Date.now() < tokenExpiry) {
            return cachedToken;
        }

        const config = this.getConfig();

        if (!config.consumerKey || !config.consumerSecret || 
            config.consumerKey.includes('your_safaricom') || 
            config.consumerSecret.includes('your_safaricom')) {
            throw new Error('M-Pesa Consumer Key or Consumer Secret is invalid or set to a placeholder in .env');
        }

        const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');
        
        try {
            const response = await axios.get(`${config.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
                headers: { Authorization: `Basic ${auth}` },
                timeout: config.timeoutMs
            });

            const { access_token, expires_in } = response.data;
            
            cachedToken = access_token;
            // Subtract a 60s buffer for clock drift/latency
            const bufferMs = 60 * 1000;
            tokenExpiry = Date.now() + parseInt(expires_in, 10) * 1000 - bufferMs;

            return access_token;
        } catch (error) {
            const networkMsg = this.getSafaricomError(error);
            if (networkMsg) {
                console.error('💥 M-Pesa OAuth network failure:', networkMsg);
                throw new Error(`M-Pesa Authorization failed: ${networkMsg}`);
            }

            const errorData = error.response ? JSON.stringify(error.response.data) : error.message;
            console.error(`💥 Failed to generate M-Pesa OAuth access token [${config.baseUrl}]:`, errorData);
            
            const serverMsg = error.response?.data?.errorMessage || error.response?.data?.error_description || error.message;
            throw new Error(`M-Pesa Authorization failed: ${serverMsg}`);
        }
    }

    /**
     * Format and validate Kenyan phone numbers to standard 12-digit format (2547XXXXXXXX / 2541XXXXXXXX)
     * @param {string} phone 
     * @returns {string} 12-digit phone number
     */
    formatPhoneNumber(phone) {
        if (!phone) {
            throw new Error('Phone number is required for M-Pesa payment.');
        }

        let formatted = String(phone).trim().replace(/[\s-()+]/g, '');

        if (formatted.startsWith('0')) {
            formatted = '254' + formatted.slice(1);
        } else if (formatted.startsWith('7') || formatted.startsWith('1')) {
            if (formatted.length === 9) {
                formatted = '254' + formatted;
            }
        }

        if (!/^254[17]\d{8}$/.test(formatted)) {
            throw new Error(`Invalid Kenyan M-Pesa phone number: "${phone}". Must be a valid Safaricom number (e.g. 0712345678 or 254712345678).`);
        }

        return formatted;
    }

    /**
     * Trigger Lipa Na M-Pesa Online (STK Push)
     * @param {string} phoneNumber Phone number to push prompt to
     * @param {number} amount Payment amount (KES)
     * @param {string} accountRef Short reference (e.g., "Room 302")
     * @param {string} transactionDesc Description of transaction (e.g., "Order MO-123456")
     */
    async initiateStkPush(phoneNumber, amount, accountRef, transactionDesc) {
        const config = this.getConfig();

        this.validateCallbackUrl(config.callbackUrl);

        const accessToken = await this.getAccessToken();
        const formattedPhone = this.formatPhoneNumber(phoneNumber);

        // Generate Timestamp in YYYYMMDDHHmmss format
        const date = new Date();
        const timestamp = date.getFullYear() +
            String(date.getMonth() + 1).padStart(2, '0') +
            String(date.getDate()).padStart(2, '0') +
            String(date.getHours()).padStart(2, '0') +
            String(date.getMinutes()).padStart(2, '0') +
            String(date.getSeconds()).padStart(2, '0');

        // Generate Password: Base64(ShortCode + Passkey + Timestamp)
        const password = Buffer.from(`${config.shortCode}${config.passkey}${timestamp}`).toString('base64');

        const payload = {
            BusinessShortCode: config.shortCode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.round(amount),
            PartyA: formattedPhone,
            PartyB: config.shortCode,
            PhoneNumber: formattedPhone,
            CallBackURL: config.callbackUrl,
            AccountReference: (accountRef || 'Asmara Hotel').substring(0, 12),
            TransactionDesc: (transactionDesc || 'Food Order').substring(0, 20)
        };

        try {
            const response = await axios.post(`${config.baseUrl}/mpesa/stkpush/v1/processrequest`, payload, {
                headers: { Authorization: `Bearer ${accessToken}` },
                timeout: config.timeoutMs
            });
            return response.data;
        } catch (error) {
            const networkMsg = this.getSafaricomError(error);
            if (networkMsg) {
                console.error('💥 M-Pesa STK Push network failure:', networkMsg);
                throw new Error(`Safaricom connection failure: ${networkMsg}`);
            }

            const errorData = error.response ? JSON.stringify(error.response.data) : error.message;
            console.error(`💥 M-Pesa STK Push API call failed [${config.baseUrl}]:`, errorData);

            const serverMsg = error.response?.data?.errorMessage || error.response?.data?.ResponseDescription || error.message;
            throw new Error(`Safaricom connection failure: ${serverMsg}`);
        }
    }
}

module.exports = new MpesaService();

