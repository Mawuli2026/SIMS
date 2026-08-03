import { useCallback, useEffect, useState } from "react";
import { getDashboard } from "../../../services/dashboardApi";
import { DashboardResponse } from "../../../types/dashboard.types";
import { getAuthToken } from "../../../utils/authSession";

const useDashboardData = () => {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setError("Your session is no longer available. Please sign in again.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      setData(await getDashboard(token));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  return { data, error, isLoading, reload };
};

export default useDashboardData;
