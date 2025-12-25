import express from "express";
import cookieParser from "cookie-parser";
import { routerV1 } from "routes/index.ts";

const app = express();
app.listen(process.env.PORT, async () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

app.use(cookieParser());
app.use(express.json());

app.use("/api/v1/", routerV1);

// ecommerce/monolith/
