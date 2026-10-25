import cron from 'node-cron';
import { runExpiryAndStockChecks } from '../services/alertService.js';

export function initExpiryCronJob() {
  console.log('[CRON] Initializing daily inventory expiry & low-stock check job...');

  // Run immediately on server boot
  try {
    const initialRun = runExpiryAndStockChecks();
    console.log('[CRON] Initial boot scan result:', initialRun);
  } catch (err) {
    console.error('[CRON] Error during boot inventory check:', err);
  }

  // Schedule to run daily at 00:05 (and also run every 30 minutes in demo mode for quick responsiveness)
  // '0 0 * * *' = midnight daily
  // For microproject demo, we can also check every 30 minutes: '*/30 * * * *'
  cron.schedule('0 0 * * *', () => {
    console.log('[CRON] Running daily scheduled inventory expiry & stock check at midnight...');
    try {
      const result = runExpiryAndStockChecks();
      console.log('[CRON] Daily check finished:', result);
    } catch (err) {
      console.error('[CRON] Error in daily expiry cron job:', err);
    }
  });

  console.log('[CRON] Scheduled daily midnight job registered.');
}
