import { processVendorPayouts } from "./services/vendorPayout.service";

export default {
  // Process weekly payouts every Sunday at 00:01 AM
  async scheduled(event: ScheduledEvent, env: any, ctx: ExecutionContext) {
    console.log("Running scheduled job:", event.cron);

    switch (event.cron) {
      case "1 0 * * 0": // Sunday at 00:01 AM
        ctx.waitUntil(processVendorPayouts(env));
        break;

      // You can add other scheduled jobs here as needed
      default:
        console.log("No handler for cron pattern:", event.cron);
    }
  },
};
