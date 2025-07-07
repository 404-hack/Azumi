import { hc } from "hono/client";
import type { routes } from "../../server/src/index";
import { Platform } from "react-native";

const API_BASE_URL =
  Platform.OS === "web"
    ? "http://127.0.0.1:8787"
    : "https://wtkzkc0x-8787.uks1.devtunnels.ms";

let CookieManager: any;
if (Platform.OS !== "web") {
  import("@react-native-cookies/cookies").then((module) => {
    CookieManager = module.default;
  });
}

export const client = hc<typeof routes>(API_BASE_URL, {
  headers: {
    "Content-Type": "application/json",
  },
  fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...init?.headers,
    };

    if (Platform.OS !== "web" && CookieManager) {
      try {
        const cookies = await CookieManager.get(API_BASE_URL);
        if (cookies && Object.keys(cookies).length > 0) {
          const cookieString = Object.entries(cookies)
            .map(([name, cookie]: [string, any]) => `${name}=${cookie.value}`)
            .join("; ");
          headers.Cookie = cookieString;
        }
      } catch (error) {
        console.log("Error getting cookies:", error);
      }
    }

    const fetchOptions: RequestInit = {
      headers,
      ...init,
    };

    if (Platform.OS === "web") {
      fetchOptions.credentials = "include";
    }

    const response = await fetch(url, fetchOptions);

    if (Platform.OS !== "web" && CookieManager) {
      try {
        const setCookieHeader = response.headers.get("set-cookie");
        if (setCookieHeader) {
          await CookieManager.setFromResponse(API_BASE_URL, setCookieHeader);
        }
      } catch (error) {
        console.log("Error saving cookies:", error);
      }
    }

    return response;
  },
}).api;
