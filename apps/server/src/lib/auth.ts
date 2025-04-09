import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
// import { db } from "./db";
import * as schema from "./db/schema";

import { DrizzleD1Database } from "drizzle-orm/d1";
import { Variables } from "./types";
import { openAPI, organization } from "better-auth/plugins";
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
    ],
  });
};
