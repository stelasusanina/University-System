import "dotenv/config";
import express from "express";
import cors from "cors";
import { router } from "./routes.ts";

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.use(router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

