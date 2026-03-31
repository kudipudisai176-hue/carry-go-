const axios = require('axios');

/**
 * SMS Service for CarryGo
 * Handles OTP dispatch via Fast2SMS (India) or fallback logging.
 */
const sendSMS = async (numbers, message) => {
  const apiKey = process.env.FAST2SMS_API_KEY;
  const isEnabled = process.env.SMS_ENABLED === 'true';

  console.log(`[SMS Service] Dispatching to ${numbers}: "${message}"`);

  if (!isEnabled || !apiKey || apiKey === 'your_api_key_here') {
    console.warn(`[SMS Service] SMS disabled or API Key missing. Logging to console instead.`);
    return { success: true, message: 'SMS logged to console (Simulation Mode)' };
  }

  try {
    // Fast2SMS Bulk V2 API (Query Route)
    const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
      route: 'q',
      message: message,
      numbers: Array.isArray(numbers) ? numbers.join(',') : numbers,
    }, {
      headers: {
        'authorization': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.return) {
      console.log(`[SMS Service] Successfully sent to ${numbers}`);
      return { success: true, data: response.data };
    } else {
      console.error(`[SMS Service] Fast2SMS Error:`, response.data);
      return { success: false, error: response.data.message };
    }
  } catch (error) {
    console.error(`[SMS Service] API Request Failed:`, error.response ? error.response.data : error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendSMS };
