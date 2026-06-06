import { Router } from "express";
import { loginUser, registerUser } from "../services/authService.ts";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { email, password, mobile } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const result = await loginUser(email, password, !!mobile);

  if ("error" in result) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.json({ token: result.token, user: result.user });
});

authRouter.post("/register", async (req, res) => {
  const { email, identifierNumber, firstName, lastName, password } = req.body;

  if (!email || !identifierNumber || !firstName || !lastName || !password) {
    return res.status(400).json({ error: "Email, identifier number, first name, last name, and password are required" });
  }

  const result = await registerUser(email, identifierNumber, firstName, lastName, password);

  if ("error" in result) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.status(result.status).json({ token: result.token, user: result.user });
});
