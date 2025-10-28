import { Request, Response } from "express";

// ...existing imports

export async function getDashboardStats(req: Request, res: Response) {
  try {
    // original logic that computes/fetches dashboard stats
    const stats = await computeStatsForUser(req.user?.id);
    return res.json(stats);
  } catch (err) {
    // log full error with context for debugging
    console.error("[API] GET /api/dashboard/stats - error:", {
      userId: req.user?.id,
      message: err?.message ?? String(err),
      stack: err?.stack,
    });
    const body: any = { message: "Failed to fetch dashboard stats" };
    if (process.env.NODE_ENV !== "production")
      body.error = err?.stack ?? String(err);
    return res.status(500).json(body);
  }
}

// ...existing code
