import { NextFunction, Request, Response } from "express";
import { search } from "../services/search.service";

export const searchAll = async (request: Request, response: Response, next: NextFunction) => {
  if (!request.authUser) {
    response.status(401).json({ message: "Authentication token is required." });
    return;
  }

  const rawQuery = request.query.q;
  const term = typeof rawQuery === "string" ? rawQuery.trim() : "";

  if (!term) {
    response.status(400).json({ message: "Search query is required." });
    return;
  }

  try {
    const results = await search(term, request.authUser.role);
    response.status(200).json({ query: term, results });
  } catch (error) {
    next(error);
  }
};
