import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
// import { db } from "./db";
import * as schema from "./db/schema";

import { DrizzleD1Database } from "drizzle-orm/d1";
import { Variables } from "./types";
import { openAPI, organization, phoneNumber, admin } from "better-auth/plugins";
import { env } from "cloudflare:workers";
// export type Environment = {
//   Bindings: CloudflareBindings;
//   Variables: Variables;
// };

// export const auth = betterAuth({
//   database: drizzleAdapter("", {
//     provider: "sqlite",
//   }),
//   user: {
//     modelName: "userTable",
//     additionalFields: {
//       tokens: {
//         type: "number",
//         required: false,
//         defaultValue: 0,
//         input: false, // don't allow user to set role
//       },
//       credits: {
//         type: "number",
//         required: false,
//         input: false, // don't allow user to set role
//       },
//     },
//   },
//   emailAndPassword: {
//     enabled: true,
//     requireEmailVerification: false,
//   },
//   advanced: {
//     defaultCookieAttributes: {
//       sameSite: "none",
//       secure: true,
//     },
//   },
//   trustedOrigins: [
//     "http://localhost:5173/",
//     "http://localhost:5173",
//     "http://127.0.0.1:8787",
//   ],
//   plugins: [
//     openAPI(),
//     organization({
//       schema: {
//         organization: {
//           modelName: "shopTable",
//         },
//       },
//     }),
//   ],
// });

export const createAuth = async (db: DrizzleD1Database<typeof schema>) => {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
    }),
    user: {
      changeEmail: {
        enabled: true,
        sendChangeEmailVerification: async (
          { user, newEmail, url, token },
          request
        ) => {
          console.log("🚀 ~ sendChan:", user, newEmail, url, token);
        },
      },
      modelName: "userTable",
      additionalFields: {
        tokens: {
          type: "number",
          required: false,
          defaultValue: 0,
          input: false, // don't allow user to set role
        },
        credits: {
          type: "number",
          required: false,
          input: false, // don't allow user to set role
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    advanced: {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
      },
    },
    trustedOrigins: ["*"], // Allow any origin
    plugins: [
      organization({
        schema: {
          organization: {
            modelName: "shopTable",
          },
        },

        async sendInvitationEmail(data) {
          const inviteLink = `${env.CLIENT_URL}/accept-invitation/${data.id}`;
          console.log({
            email: data.email,
            invitedByUsername: data.inviter.user.name,
            invitedByEmail: data.inviter.user.email,
            teamName: data.organization.name,
            inviteLink,
          });
        },
      }),
      openAPI(),
      admin({
        // Replace with the actual user ID
      }),
      phoneNumber({
        sendOTP: async ({ phoneNumber, code }, request) => {
          // i am using sendchamp for sending the sms
          const url = `${env.SENDCHAMP_LIVE_URL}/sms/send`;
          const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.SENDCHAMP_API_KEY}`,
          };
          const body = {
            to: phoneNumber.startsWith("0")
              ? `234${phoneNumber.slice(1)}`
              : phoneNumber,
            sender_name: "Schamp",
            message: `Your azumi otp code is ${code}. expires in 5 minutes. Thank you.`,
            route: "dnd",
          };
          const result = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
          });

          console.log("SMS send result:", await result.json());
        },
        signUpOnVerification: {
          getTempEmail: (phoneNumber) => {
            return `${phoneNumber}@my-site.com`;
          },
          //optionally, you can also pass `getTempName` function to generate a temporary name for the user
          getTempName: (phoneNumber) => {
            return phoneNumber; //by default, it will use the phone number as the name
          },
        },
        callbackOnVerification(data, request) {
          console.log("🚀 ~ createAuth ~ request:", request);
          // Implement your logic after phone number verification
        },
      }),
    ],
  });
};
