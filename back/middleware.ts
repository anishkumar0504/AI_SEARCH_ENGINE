import { Request, Response, NextFunction } from "express";
import { supabase } from "./lib/client.js";

// Remove: const client = supabase();

export async function middleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.userId = data.user.id;

  next();
}



