import { Hono } from "hono";
import { env } from "cloudflare:workers";
import { factory } from "../lib/factory";

const bucketRoute = factory
  .createApp()

  // Route to serve files from R2 bucket in local development
  .get("/:file", async (c) => {
    if (env.NODE_ENV !== "development") {
      return c.json({ message: "Not found" }, 404);
    }

    const bucket = env.BUCKET;
    const key = c.req.param("file");

    try {
      const object = await bucket.get(key);

      if (!object) {
        return c.json({ message: "File not found" }, 404);
      }

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);
      headers.set("Cache-Control", "public, max-age=31536000");

      return new Response(object.body, {
        headers,
      });
    } catch (error) {
      console.error("Error serving file from bucket:", error);
      return c.json({ message: "Error serving file" }, 500);
    }
  });

export default bucketRoute;
