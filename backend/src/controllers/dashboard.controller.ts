import { NextFunction, Request, Response } from "express";
import {
  getCashierDashboard,
  getManagerDashboard,
  getNotificationsForRole,
  getSidebarForRole,
} from "../services/dashboard.service";

export const getDashboard = async (request: Request, response: Response, next: NextFunction) => {
  if (!request.authUser) {
    response.status(401).json({ message: "Authentication token is required." });
    return;
  }

  try {
    const { id, role } = request.authUser;
    const dashboard = role === "Cashier" ? await getCashierDashboard(id) : await getManagerDashboard(role);
    response.status(200).json(dashboard);
  } catch (error) {
    next(error);
  }
};

export const getSidebar = (request: Request, response: Response) => {
  if (!request.authUser) {
    response.status(401).json({ message: "Authentication token is required." });
    return;
  }

  const { role } = request.authUser;
  response.status(200).json({ role, menuItems: getSidebarForRole(role) });
};

export const getNotifications = async (request: Request, response: Response, next: NextFunction) => {
  if (!request.authUser) {
    response.status(401).json({ message: "Authentication token is required." });
    return;
  }

  try {
    const { id, role } = request.authUser;
    const notifications = await getNotificationsForRole(role, id);
    response.status(200).json({ notifications });
  } catch (error) {
    next(error);
  }
};
