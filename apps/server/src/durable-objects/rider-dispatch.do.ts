import { DurableObject } from "cloudflare:workers";

interface RiderLocation {
  lat: number;
  lng: number;
  lastUpdate: number;
  isAvailable: boolean;
  riderId: string;
}

interface RiderConnection {
  riderId: string;
  websocket: WebSocket;
  connectedAt: number;
}

interface AvailableOrder {
  id: string;
  shopId: string;
  pickupLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  deliveryLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  orderValue: number;
  deliveryFee: number;
  estimatedDistance: number;
  estimatedDuration: number;
  itemCount: number;
  createdAt: string;
  expiresAt: string;
}

interface OrderDispatchMessage {
  type: "new_order";
  order: AvailableOrder;
  riderId: string;
}

interface LocationUpdateMessage {
  type: "location_update";
  riderId: string;
  lat: number;
  lng: number;
}

interface StatusUpdateMessage {
  type: "status_update";
  riderId: string;
  isAvailable: boolean;
}

interface RiderStatusMessage {
  type: "heartbeat" | "location_update" | "rider_status_update";
  data?: any;
}

interface Env {
  DB: D1Database;
}

export class RiderDispatch extends DurableObject {
  private connections = new Map<string, RiderConnection>();
  private riderLocations = new Map<string, RiderLocation>();
  private pendingOrders = new Map<string, AvailableOrder>();
  private readonly LOCATION_CLEANUP_INTERVAL = 5 * 60 * 1000;
  private readonly HEARTBEAT_TIMEOUT = 2 * 60 * 1000;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);

    setInterval(() => {
      this.cleanupStaleLocations();
    }, this.LOCATION_CLEANUP_INTERVAL);
  }

  private cleanupStaleLocations(): void {
    const now = Date.now();
    for (const [riderId, location] of this.riderLocations) {
      if (now - location.lastUpdate > this.HEARTBEAT_TIMEOUT) {
        console.log(`Removing stale location for rider: ${riderId}`);
        this.riderLocations.delete(riderId);
      }
    }
  }

  private updateRiderLocation(
    riderId: string,
    lat: number,
    lng: number,
    isAvailable: boolean = true
  ): void {
    this.riderLocations.set(riderId, {
      riderId,
      lat,
      lng,
      lastUpdate: Date.now(),
      isAvailable,
    });
  }

  private getRiderLocation(riderId: string): RiderLocation | null {
    return this.riderLocations.get(riderId) || null;
  }

  private findNearbyRiders(
    orderLat: number,
    orderLng: number,
    maxDistanceKm: number = 5
  ): (RiderLocation & { distance: number })[] {
    const nearbyRiders: (RiderLocation & { distance: number })[] = [];

    for (const [riderId, location] of this.riderLocations) {
      if (!location.isAvailable) continue;

      const distance = this.calculateDistance(
        orderLat,
        orderLng,
        location.lat,
        location.lng
      );
      if (distance <= maxDistanceKm) {
        nearbyRiders.push({ ...location, distance });
      }
    }

    return nearbyRiders.sort((a, b) => a.distance - b.distance);
  }

  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/connect") {
      return this.handleWebSocketConnection(request);
    }

    if (url.pathname === "/dispatch-order" && request.method === "POST") {
      return this.handleOrderDispatch(request);
    }

    if (url.pathname === "/rider-status" && request.method === "POST") {
      return this.handleRiderStatusUpdate(request);
    }

    return new Response("Not found", { status: 404 });
  }

  private async handleWebSocketConnection(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get("Upgrade");
    if (!upgradeHeader || upgradeHeader !== "websocket") {
      return new Response("Expected websocket upgrade", { status: 426 });
    }

    const url = new URL(request.url);
    const riderId = url.searchParams.get("riderId");
    const lat = parseFloat(url.searchParams.get("lat") || "0");
    const lng = parseFloat(url.searchParams.get("lng") || "0");

    if (!riderId) {
      return new Response("Missing riderId parameter", { status: 400 });
    }

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    this.ctx.acceptWebSocket(server);

    server.serializeAttachment({
      riderId,
      connectedAt: Date.now(),
    });

    this.connections.set(riderId, {
      riderId,
      websocket: server,
      connectedAt: Date.now(),
    });

    this.updateRiderLocation(riderId, lat, lng, true);

    const currentOrders = await this.getAvailableOrdersForRider(
      riderId,
      lat,
      lng
    );
    server.send(
      JSON.stringify({
        type: "connection_established",
        riderId,
        availableOrders: currentOrders,
      })
    );

    console.log(`Rider ${riderId} connected to dispatch system`);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  private async handleOrderDispatch(request: Request): Promise<Response> {
    try {
      const { order, targetRiders } = (await request.json()) as {
        order: AvailableOrder;
        targetRiders?: string[];
      };

      console.log(`Dispatching order ${order.id} to riders`, { targetRiders });

      const nearbyRiders = this.findNearbyRiders(
        order.pickupLocation.lat,
        order.pickupLocation.lng,
        10
      );

      let notifiedCount = 0;

      for (const riderLocation of nearbyRiders) {
        if (targetRiders && !targetRiders.includes(riderLocation.riderId)) {
          continue;
        }

        const connection = this.connections.get(riderLocation.riderId);
        if (!connection) continue;

        try {
          const message: OrderDispatchMessage = {
            type: "new_order",
            order: {
              ...order,
              estimatedDistance: riderLocation.distance,
            },
            riderId: riderLocation.riderId,
          };

          connection.websocket.send(JSON.stringify(message));
          notifiedCount++;
          console.log(
            `Order ${order.id} sent to rider ${riderLocation.riderId}, distance: ${riderLocation.distance}km`
          );
        } catch (error) {
          console.error(
            `Failed to send order to rider ${riderLocation.riderId}:`,
            error
          );
          this.connections.delete(riderLocation.riderId);
          this.riderLocations.delete(riderLocation.riderId);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          notifiedRiders: notifiedCount,
          orderId: order.id,
          nearbyRidersFound: nearbyRiders.length,
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error dispatching order:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  private async handleRiderStatusUpdate(request: Request): Promise<Response> {
    try {
      const { riderId, type, data } = (await request.json()) as {
        riderId: string;
        type: string;
        data: any;
      };

      const riderLocation = this.riderLocations.get(riderId);
      if (!riderLocation) {
        return new Response("Rider not found", { status: 404 });
      }

      switch (type) {
        case "location_update":
          this.updateRiderLocation(
            riderId,
            data.lat,
            data.lng,
            riderLocation.isAvailable
          );
          break;
        case "availability_update":
          this.updateRiderLocation(
            riderId,
            riderLocation.lat,
            riderLocation.lng,
            data.isAvailable
          );
          break;
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  private async getAvailableOrdersForRider(
    riderId: string,
    lat: number,
    lng: number
  ): Promise<AvailableOrder[]> {
    try {
      return [];
    } catch (error) {
      console.error("Error fetching available orders:", error);
      return [];
    }
  }

  async webSocketMessage(
    ws: WebSocket,
    message: string | ArrayBuffer
  ): Promise<void> {
    try {
      const attachment = ws.deserializeAttachment() as any;
      if (!attachment?.riderId) return;

      const data = JSON.parse(message.toString()) as RiderStatusMessage;

      console.log(`Message from rider ${attachment.riderId}:`, data);

      switch (data.type) {
        case "heartbeat":
          ws.send(
            JSON.stringify({ type: "heartbeat_ack", timestamp: Date.now() })
          );
          break;

        case "location_update":
          if (data.data?.lat && data.data?.lng) {
            const currentLocation = this.riderLocations.get(attachment.riderId);
            this.updateRiderLocation(
              attachment.riderId,
              data.data.lat,
              data.data.lng,
              currentLocation?.isAvailable ?? true
            );
          }
          break;

        case "rider_status_update":
          await this.handleRiderStatusFromWebSocket(
            attachment.riderId,
            data.data
          );
          break;

        default:
          console.log(`Unknown message type: ${data.type}`);
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
  }

  async webSocketClose(
    ws: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean
  ): Promise<void> {
    try {
      const attachment = ws.deserializeAttachment() as any;
      if (attachment?.riderId) {
        this.connections.delete(attachment.riderId);
        this.riderLocations.delete(attachment.riderId);
        console.log(
          `Rider ${attachment.riderId} disconnected from dispatch system`
        );
      }
    } catch (error) {
      console.error("Error handling WebSocket close:", error);
    }
  }

  private async handleRiderStatusFromWebSocket(
    riderId: string,
    data: any
  ): Promise<void> {
    const currentLocation = this.riderLocations.get(riderId);
    if (!currentLocation) return;

    if (data.isAvailable !== undefined) {
      this.updateRiderLocation(
        riderId,
        currentLocation.lat,
        currentLocation.lng,
        data.isAvailable
      );
    }
  }

  async broadcastToAllRiders(message: any): Promise<number> {
    let sentCount = 0;
    const connectedSockets = this.ctx.getWebSockets();

    for (const ws of connectedSockets) {
      try {
        ws.send(JSON.stringify(message));
        sentCount++;
      } catch (error) {
        console.error("Error broadcasting to rider:", error);
      }
    }
    return sentCount;
  }

  async getConnectedRiders(): Promise<RiderConnection[]> {
    return Array.from(this.connections.values());
  }
}
