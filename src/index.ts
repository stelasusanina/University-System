import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.ts";
import { studentRouter } from "./routes/student.ts";

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.use("/auth", authRouter);
app.use("/me", studentRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

