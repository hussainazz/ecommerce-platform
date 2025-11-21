import express from "express";
import { configDotenv } from "dotenv";
import findConfig from "find-config";
import cookieParser from "cookie-parser";
import { routerV1 } from "routes/index.ts";

configDotenv({ path: findConfig(".env")! });

const app = express();
app.listen(process.env.PORT, async () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

app.use(cookieParser());
app.use(express.json());

app.use("/api/v1/", routerV1);

// ecommerce/monolith/
