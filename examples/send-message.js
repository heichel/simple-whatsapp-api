/**
 * Example: Send WhatsApp Message
 * 
 * This example demonstrates how to send a WhatsApp message using the API
 */

const API_BASE_URL = 'http://localhost:3000';

/**
 * Send a WhatsApp message
 * @param {string} recipient - Phone number or WhatsApp JID (e.g., +14155551234 or 14155551234@s.whatsapp.net)
 * @param {string} message - Message text to send
 * @returns {Promise<Object>} Response with messageId and status
 */
async function sendWhatsAppMessage(recipient, message) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/messages/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: recipient,
                message: message
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        if (!data.success) {
            throw new Error(data.error || 'Failed to send message');
        }

        return data.data;
    } catch (error) {
        console.error('Error sending WhatsApp message:', error.message);
        throw error;
    }
}

/**
 * Check if WhatsApp is connected before sending
 * @returns {Promise<boolean>} True if connected
 */
async function checkConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/connection/status`);
        const data = await response.json();
        return data.data?.connected || false;
    } catch (error) {
        console.error('Error checking connection:', error.message);
        return false;
    }
}

/**
 * Main example function
 */
async function main() {
    console.log('📱 WhatsApp Message Sender Example\n');

    // 1. Check connection
    console.log('1. Checking WhatsApp connection...');
    const isConnected = await checkConnection();

    if (!isConnected) {
        console.log('❌ WhatsApp is not connected!');
        console.log('Please scan QR code at: http://localhost:3000/api/connection/qr');
        return;
    }

    console.log('✅ WhatsApp is connected\n');

    // 2. Send a message
    console.log('2. Sending message...');

    // Replace with actual phone number
    const phoneNumber = '+1234567890'; // Example: +14155551234
    const message = 'Hello! This is a test message from WhatsApp API 👋';

    try {
        const result = await sendWhatsAppMessage(phoneNumber, message);
        console.log('✅ Message sent successfully!');
        console.log('   Message ID:', result.messageId);
        console.log('   Status:', result.status);
    } catch (error) {
        console.log('❌ Failed to send message:', error.message);
    }
}

// Run the example
main().catch(console.error);

export { sendWhatsAppMessage, checkConnection };
