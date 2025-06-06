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
  console.log('🔑 [FIREBASE] Getting access token...');
  console.log('🔑 [FIREBASE] Config projectId:', config.projectId);
  console.log('🔑 [FIREBASE] Config clientEmail:', config.clientEmail);
  console.log('🔑 [FIREBASE] Config privateKey length:', config.privateKey?.length || 0);
  
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    console.log('🔑 [FIREBASE] Using cached token, expires at:', new Date(cachedToken.expiresAt));
    return cachedToken.token;
  }

  console.log('🔑 [FIREBASE] Creating JWT...');
  const jwt = await createJWT(config);
  console.log('🔑 [FIREBASE] JWT created, length:', jwt.length);

  console.log('🔑 [FIREBASE] Requesting access token from Google OAuth...');
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

  console.log('🔑 [FIREBASE] OAuth response status:', response.status);
  console.log('🔑 [FIREBASE] OAuth response ok:', response.ok);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('🔑 [FIREBASE] OAuth error response:', errorText);
    throw new Error(`Failed to get access token: ${response.statusText} - ${errorText}`);
  }
  
  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };
  
  console.log('🔑 [FIREBASE] Access token received, expires_in:', data.expires_in);
  
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000 - 60000,
  };

  console.log('🔑 [FIREBASE] Token cached, expires at:', new Date(cachedToken.expiresAt));
  return cachedToken.token;
}

async function createJWT(config: FirebaseConfig): Promise<string> {
  console.log('🔐 [JWT] Creating JWT token...');
  
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

  console.log('🔐 [JWT] JWT payload:', {
    iss: payload.iss,
    scope: payload.scope,
    aud: payload.aud,
    exp: payload.exp,
    iat: payload.iat,
    validFor: payload.exp - payload.iat
  });

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
  console.log('🔐 [JWT] Signature input length:', signatureInput.length);

  console.log('🔐 [JWT] Importing private key...');
  const privateKey = await importPrivateKey(config.privateKey);
  console.log('🔐 [JWT] Private key imported successfully');
  
  console.log('🔐 [JWT] Signing JWT...');
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    encoder.encode(signatureInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const jwt = `${signatureInput}.${signatureB64}`;
  console.log('🔐 [JWT] JWT created successfully, length:', jwt.length);
  
  return jwt;
}

async function importPrivateKey(privateKeyPem: string): Promise<CryptoKey> {
  console.log('🔑 [PRIVATE_KEY] Importing private key...');
  console.log('🔑 [PRIVATE_KEY] Original key length:', privateKeyPem.length);
  
  const pemContent = privateKeyPem
    .replace(/\\n/g, "\n")
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");

  console.log('🔑 [PRIVATE_KEY] Processed key length:', pemContent.length);
  console.log('🔑 [PRIVATE_KEY] Key starts with:', pemContent.substring(0, 20));

  try {
    const binaryKey = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));
    console.log('🔑 [PRIVATE_KEY] Binary key length:', binaryKey.length);

    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      binaryKey,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      false,
      ["sign"]
    );
    
    console.log('🔑 [PRIVATE_KEY] Private key imported successfully');
    return cryptoKey;
  } catch (error) {
    console.error('🔑 [PRIVATE_KEY] Error importing private key:', error);
    console.error('🔑 [PRIVATE_KEY] Error type:', typeof error);
    console.error('🔑 [PRIVATE_KEY] Error message:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export interface FirebaseMessage {
  notification?: {
    title: string;
    body: string;
    image?: string;
  };
  data?: Record<string, string>;
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
  console.log('🚀 [FCM] Sending Firebase message...');
  console.log('🚀 [FCM] Message details:', {
    hasNotification: !!message.notification,
    notificationTitle: message.notification?.title,
    hasData: !!message.data,
    dataKeys: message.data ? Object.keys(message.data) : [],
    hasToken: !!message.token,
    hasTopic: !!message.topic,
    tokenLength: message.token?.length || 0
  });

  console.log('🚀 [FCM] Getting access token...');
  const accessToken = await getFirebaseAccessToken(config);
  console.log('🚀 [FCM] Access token obtained, length:', accessToken.length);

  const fcmUrl = `https://fcm.googleapis.com/v1/projects/${config.projectId}/messages:send`;
  console.log('🚀 [FCM] FCM URL:', fcmUrl);

  const requestBody = { message };
  console.log('🚀 [FCM] Request body:', JSON.stringify(requestBody, null, 2));

  console.log('🚀 [FCM] Making FCM API request...');
  const response = await fetch(fcmUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  console.log('🚀 [FCM] FCM response status:', response.status);
  console.log('🚀 [FCM] FCM response ok:', response.ok);
  console.log('🚀 [FCM] FCM response headers:', Object.fromEntries(response.headers.entries()));

  const result = (await response.json()) as FirebaseMessagingResult;
  console.log('🚀 [FCM] FCM response body:', JSON.stringify(result, null, 2));

  if (!response.ok) {
    const errorMessage = `Firebase messaging error: ${(result as any).error?.message || "Unknown error"}`;
    console.error('🚀 [FCM] FCM error:', errorMessage);
    console.error('🚀 [FCM] Full error object:', result);
    throw new Error(errorMessage);
  }

  console.log('🚀 [FCM] Message sent successfully:', result.name);
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
