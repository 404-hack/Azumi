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
    case "59 23 * * 5": // Friday at 23:59 PM - Weekly vendor payouts (end of week)
      console.log("💰 Processing weekly vendor payouts...");
      ctx.waitUntil(processVendorPayouts(env));
      break;

    default:
      console.log("❓ No handler for cron pattern:", event.cron);
  }
}
