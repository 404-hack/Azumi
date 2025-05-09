import { DurableObject, DurableObjectState } from "cloudflare:workers";

interface Env {
  // Define any bindings this Durable Object might need from wrangler.toml
  // For this example, it's not using any directly.
}

// Durable Object
export class OrderNotification extends DurableObject {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    // If you encounter TypeScript errors like "DurableObjectState is not exported",
    // ensure your project's tsconfig.json includes "@cloudflare/workers-types"
    // in compilerOptions.types, and that @cloudflare/workers-types is a devDependency.
  }

  async newOrder(vendorId: string, orderId: string): Promise<void> {
    console.log(
      `DURABLE_OBJECT (Vendor ID: ${vendorId}): New order (Order ID: ${orderId}) received. Logging: 'order made'`
    );
    // In a full implementation, you would use this.ctx.getWebSockets() or similar
    // to send this information to a connected vendor client via WebSockets.
  }

  // To enable WebSocket connections, you would also implement a 'fetch' handler:
  // async fetch(request: Request) {
  //   const url = new URL(request.url);
  //   if (url.pathname === '/websocket' && request.headers.get("Upgrade") === "websocket") {
  //     const pair = new WebSocketPair();
  //     this.ctx.acceptWebSocket(pair[1]); // Accept and manage the WebSocket
  //     return new Response(null, { status: 101, webSocket: pair[0] });
  //   }
  //   return new Response("Not found", { status: 404 });
  // }
}
