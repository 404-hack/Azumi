import { DurableObject } from "cloudflare:workers";

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
    for (const connection of this.ctx.getWebSockets()) {
      connection.send(JSON.stringify("notification"));
    }
  }
  async fetch(request: Request): Promise<Response> {
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);
    this.ctx.acceptWebSocket(server);
    const response = new Response(null, {
      status: 101,
      webSocket: client,
    });

    return response;
  }
  async webSocketClose(
    ws: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean
  ) {
    // If the client closes the connection, the runtime will invoke the webSocketClose() handler.
    ws.close(code, "Durable Object is closing WebSocket");
  }
}
