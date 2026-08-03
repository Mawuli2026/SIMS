import { NextFunction, Request, Response } from "express";
import { getReport } from "../services/report.service";
import { firstValidationError, reportQuerySchema } from "../utils/validation";

export const getSalesReport = async (request: Request, response: Response, next: NextFunction) => {
  const validation = reportQuerySchema.safeParse(request.query);
  if (!validation.success) {
    response.status(400).json({ message: firstValidationError(validation.error) });
    return;
  }

  try {
    response.status(200).json(await getReport(validation.data));
  } catch (error) {
    next(error);
  }
};
