import { processVendorPayouts } from "./services/vendorPayout.service";

export async function scheduled(
  event: ScheduledEvent,
  env: any,
  ctx: ExecutionContext
) {
  const environment = env.CLIENT_URL?.includes("localhost")
    ? "staging"
    : "production";

  console.log("🕐 Running scheduled job:", event.cron);
  console.log("📅 Current time:", new Date().toISOString());
  console.log("🌍 Environment:", environment);

  switch (event.cron) {
    case "1 0 * * 5": // Friday at 00:01 AM - Weekly vendor payouts
      console.log("💰 Processing weekly vendor payouts...");
      ctx.waitUntil(processVendorPayouts(env));
      break;

    case "* * * * *": // Every minute - Test job
      console.log("🎉 EVERY MINUTE CRON JOB TRIGGERED!");
      console.log("⏰ This runs every minute for testing purposes");
      console.log(`🧪 Environment: ${environment}`);
      console.log("📊 Current timestamp:", Date.now());
      break;

    default:
      console.log("❓ No handler for cron pattern:", event.cron);
  }
}
