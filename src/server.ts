import express from "express";
import { configDotenv } from "dotenv";
import findConfig from "find-config";
import { mongo_client } from "@config/database.ts";
configDotenv({ path: findConfig(".env")! });

const app = express();
app.listen(process.env.PORT, async () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

app.use(express.json());

// ecommerce/monolith/
