import dotenv from "dotenv";

// Load environment variables before anything else
dotenv.config();

import app from "./app.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[Daily Backend] Server running on http://localhost:${PORT}`);
  console.log(`[Daily Backend] Health check: http://localhost:${PORT}/health`);
});
