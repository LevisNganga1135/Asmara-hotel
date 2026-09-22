// test-mpesa-auth.js
// Standalone diagnostic script to test Safaricom M-Pesa OAuth authentication & STK Push readiness

require('dotenv').config();
const mpesaService = require('./services/mpesaService');

async function testAuthentication() {
    console.log('🔍 Testing M-Pesa OAuth Access Token generation...');
    try {
        const token = await mpesaService.getAccessToken();
        console.log('✅ OAuth Authentication Successful!');
        console.log(`🔑 Bearer Token retrieved: ${token.substring(0, 15)}...`);
        console.log('🚀 Your M-Pesa Daraja API integration is configured and ready for STK Push!');
    } catch (error) {
        console.error('❌ M-Pesa Authentication Failed:', error.message);
        console.log('\n💡 Troubleshooting checklist:');
        console.log('   1. Check developer.safaricom.co.ke -> My Apps -> Consumer Key & Secret.');
        console.log('   2. Confirm MPESA_ENV is set to "sandbox" for Sandbox apps or "production" for Live apps.');
        console.log('   3. Ensure no quotes or trailing spaces exist around MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET in .env.');
    }
}

testAuthentication();
