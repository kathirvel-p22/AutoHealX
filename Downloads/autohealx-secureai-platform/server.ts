import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import crypto from "crypto";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Mock Ingestion Endpoint - Now just relays raw logs to frontend
  app.post("/api/ingest", async (req, res) => {
    const { logs, serviceName } = req.body;
    
    if (!logs) {
      return res.status(400).json({ error: "Logs are required" });
    }

    const logEvent = {
      id: crypto.randomUUID(),
      serviceName: serviceName || "unknown",
      logs,
      timestamp: new Date().toISOString()
    };

    // Notify connected clients to perform analysis
    io.emit("raw_logs_ingested", logEvent);

    res.json({ status: "ingested", id: logEvent.id });
  });

  // Crypto Signing Helper (Backend)
  app.post("/api/sign-action", (req, res) => {
    const { actionId, data } = req.body;
    // In a real app, this would use a secure private key
    // For demo, we create a deterministic hash
    const signature = crypto.createHmac('sha256', process.env.GEMINI_API_KEY || 'secret')
                            .update(JSON.stringify(data))
                            .digest('hex');
    res.json({ signature });
  });

  // --- Vite / Frontend Middleware ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // --- WebSocket Logic ---
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
