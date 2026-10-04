module.exports = async function handler(req, res) {
  const allowedOrigin = "*";
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const upstreamUrl = process.env.SHEETS_API_URL || "https://script.google.com/macros/s/AKfycbyvszIkUCDx8Qm5MVn1tOz4r60uggpqsoveNl2t1J3AFqjigueoufX4IoHsU4LjlFv4/exec";
  const requestUrl = new URL(upstreamUrl);
  const url = new URL(req.url || "/", "http://localhost");
  const action = url.searchParams.get("action");

  if (action) {
    requestUrl.searchParams.set("action", action);
  }

  const headers = {
    Accept: "application/json",
  };

  let body = undefined;

  if (req.method === "POST") {
    if (typeof req.body === "string") {
      body = req.body;
    } else if (req.body && typeof req.body === "object") {
      body = JSON.stringify(req.body);
    } else {
      body = await new Promise((resolve, reject) => {
        let raw = "";

        req.on("data", (chunk) => {
          raw += chunk;
        });

        req.on("end", () => {
          resolve(raw);
        });

        req.on("error", reject);
      });
    }

    headers["Content-Type"] = "application/json";
  }

  const upstreamResponse = await fetch(requestUrl, {
    method: req.method,
    headers,
    body: body ? body : undefined,
  });

  const responseText = await upstreamResponse.text();
  const responseContentType = upstreamResponse.headers.get("content-type") || "application/json";

  res.status(upstreamResponse.status);
  res.setHeader("Content-Type", responseContentType);
  res.send(responseText);
};
