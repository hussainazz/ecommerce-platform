import express from "express";
import cookieParser from "cookie-parser";
import { routerV1 } from "routes/index.ts";
import { connectToDatabase } from "@db/database.ts";

const app = express();

app.use(cookieParser());
app.use(express.json());

app.use("/api/v1/", routerV1);

// Ensure database connection is established before starting the server
// This prevents race conditions where routes are hit before DB is ready
async function startServer() {
  try {
    await connectToDatabase();

    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

// ecommerce/monolith/
