import http from "http";

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("CleverPrices Worker: Active and Healthy\n");
});

server.listen(port, "0.0.0.0", () => {
  console.log(`[Heartbeat] 💓 Server running at http://0.0.0.0:${port}/`);
  console.log(`[Heartbeat] 🛡️ Keeping container alive for Cron Jobs...`);
});

// Basic error handling to prevent crashing
server.on("error", (err) => {
  console.error(`[Heartbeat] 💥 Server error:`, err);
});
