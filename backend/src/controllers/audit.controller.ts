import { NextFunction, Request, Response } from "express";
import { getAuditLogs } from "../services/audit.service";
import { auditQuerySchema, firstValidationError } from "../utils/validation";

export const listAuditLogs = async (request: Request, response: Response, next: NextFunction) => {
  const validation = auditQuerySchema.safeParse(request.query);
  if (!validation.success) {
    response.status(400).json({ message: firstValidationError(validation.error) });
    return;
  }

  try {
    const auditLogs = await getAuditLogs({
      query: validation.data.q,
      action: validation.data.action,
      outcome: validation.data.outcome,
      fromDate: validation.data.fromDate,
      toDate: validation.data.toDate,
    });
    response.status(200).json({ auditLogs });
  } catch (error) {
    next(error);
  }
};

