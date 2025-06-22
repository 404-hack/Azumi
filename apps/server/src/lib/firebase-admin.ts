interface FirebaseConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

interface AccessToken {
  token: string;
  expiresAt: number;
}

let cachedToken: AccessToken | null = null;

export async function getFirebaseAccessToken(
  config: FirebaseConfig
): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const jwt = await createJWT(config);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.statusText}`);
  }
  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000 - 60000,
  };

  return cachedToken.token;
}

async function createJWT(config: FirebaseConfig): Promise<string> {
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: config.clientEmail,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  const payloadB64 = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const signatureInput = `${headerB64}.${payloadB64}`;

  const privateKey = await importPrivateKey(config.privateKey);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    encoder.encode(signatureInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return `${signatureInput}.${signatureB64}`;
}

async function importPrivateKey(privateKeyPem: string): Promise<CryptoKey> {
  const pemContent = privateKeyPem
    .replace(/\\n/g, "\n")
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");

  const binaryKey = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));

  return await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );
}

export interface FirebaseMessage {
  data?: Record<string, string>;
  webpush?: {
    notification?: {
      title?: string;
      body?: string;
      icon?: string;
      image?: string;
      badge?: string;
      actions?: Array<{
        action: string;
        title: string;
        icon?: string;
      }>;
      requireInteraction?: boolean;
      tag?: string;
    };
    fcm_options?: {
      link?: string;
    };
    headers?: {
      TTL?: string;
    };
  };
  android?: {
    notification?: {
      title?: string;
      body?: string;
      icon?: string;
      click_action?: string;
    };
    ttl?: string;
  };
  apns?: {
    headers?: {
      "apns-expiration"?: string;
    };
  };
  token?: string;
  topic?: string;
  tokens?: string[];
}

export interface FirebaseMessagingResult {
  name?: string;
  error?: {
    code: string;
    message: string;
    status: string;
  };
}

export async function sendFirebaseMessage(
  config: FirebaseConfig,
  message: FirebaseMessage
): Promise<FirebaseMessagingResult> {
  const accessToken = await getFirebaseAccessToken(config);

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${config.projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    }
  );
  const result = (await response.json()) as FirebaseMessagingResult;

  if (!response.ok) {
    throw new Error(
      `Firebase messaging error: ${(result as any).error?.message || "Unknown error"}`
    );
  }

  return result;
}

export async function sendToMultipleTokens(
  config: FirebaseConfig,
  message: Omit<FirebaseMessage, "token" | "tokens"> & { tokens: string[] }
): Promise<{
  successCount: number;
  failureCount: number;
  responses: FirebaseMessagingResult[];
}> {
  const responses = await Promise.allSettled(
    message.tokens.map((token) =>
      sendFirebaseMessage(config, { ...message, token, tokens: undefined })
    )
  );

  const results = responses.map((response) =>
    response.status === "fulfilled"
      ? response.value
      : {
          error: {
            code: "unknown",
            message: response.reason?.message || "Unknown error",
            status: "error",
          },
        }
  );

  return {
    successCount: results.filter((r) => !r.error).length,
    failureCount: results.filter((r) => r.error).length,
    responses: results,
  };
}

export async function subscribeToTopic(
  config: FirebaseConfig,
  tokens: string[],
  topic: string
): Promise<{ successCount: number; failureCount: number }> {
  const accessToken = await getFirebaseAccessToken(config);

  const response = await fetch(`https://iid.googleapis.com/iid/v1:batchAdd`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: `/topics/${topic}`,
      registration_tokens: tokens,
    }),
  });
  const result = (await response.json()) as any;

  if (!response.ok) {
    throw new Error(
      `Topic subscription error: ${result.error || "Unknown error"}`
    );
  }

  return {
    successCount: result.results?.filter((r: any) => !r.error).length || 0,
    failureCount: result.results?.filter((r: any) => r.error).length || 0,
  };
}

export async function unsubscribeFromTopic(
  config: FirebaseConfig,
  tokens: string[],
  topic: string
): Promise<{ successCount: number; failureCount: number }> {
  const accessToken = await getFirebaseAccessToken(config);

  const response = await fetch(
    `https://iid.googleapis.com/iid/v1:batchRemove`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: `/topics/${topic}`,
        registration_tokens: tokens,
      }),
    }
  );
  const result = (await response.json()) as any;

  if (!response.ok) {
    throw new Error(
      `Topic unsubscription error: ${result.error || "Unknown error"}`
    );
  }

  return {
    successCount: result.results?.filter((r: any) => !r.error).length || 0,
    failureCount: result.results?.filter((r: any) => r.error).length || 0,
  };
}
