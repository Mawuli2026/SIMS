import { useCallback, useEffect, useState } from "react";
import { getAuditLogs } from "../../../services/auditApi";
import { AuditAction, AuditLog, AuditOutcome, auditActions } from "../../../types/audit.types";
import { getAuthToken } from "../../../utils/authSession";

const formatAction = (action: string) => action.toLowerCase().split("_").map((word) =>
  word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const formatDetails = (details: AuditLog["details"]) => Object.entries(details)
  .map(([key, value]) => `${key.replace(/([A-Z])/g, " $1")}: ${String(value)}`)
  .join(" · ") || "—";

const AuditLogs = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [query, setQuery] = useState("");
  const [action, setAction] = useState<AuditAction | "">("");
  const [outcome, setOutcome] = useState<AuditOutcome | "">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadAuditLogs = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setErrorMessage("Your session is no longer available. Please sign in again.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await getAuditLogs(token, { query, action, outcome, fromDate, toDate });
      setAuditLogs(response.auditLogs);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load audit logs.");
    } finally {
      setIsLoading(false);
    }
  }, [query, action, outcome, fromDate, toDate]);

  useEffect(() => { void loadAuditLogs(); }, [loadAuditLogs]);

  return <div>
    <div className="page-header">
      <h1>Audit Logs</h1>
      <p>Review authentication, employee, inventory, and sales security events.</p>
    </div>

    <section className="dashboard-panel">
      <div className="audit-toolbar">
        <input aria-label="Search audit logs" placeholder="Search actor, target, action, or record..." value={query} onChange={(event) => setQuery(event.target.value)} />
        <select aria-label="Filter audit logs by action" value={action} onChange={(event) => setAction(event.target.value as AuditAction | "")}>
          <option value="">All actions</option>
          {auditActions.map((item) => <option key={item} value={item}>{formatAction(item)}</option>)}
        </select>
        <select aria-label="Filter audit logs by outcome" value={outcome} onChange={(event) => setOutcome(event.target.value as AuditOutcome | "")}>
          <option value="">All outcomes</option><option value="success">Success</option><option value="failure">Failure</option>
        </select>
        <label>From<input aria-label="Audit logs from date" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label>
        <label>To<input aria-label="Audit logs to date" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} /></label>
        <span className="product-count">Latest {auditLogs.length} event{auditLogs.length === 1 ? "" : "s"}</span>
      </div>

      {errorMessage && <div className="product-request-error" role="alert"><span>{errorMessage}</span>
        <button className="secondary-button" type="button" onClick={() => void loadAuditLogs()}>Retry</button></div>}

      {isLoading ? <p className="product-loading" role="status">Loading audit logs...</p> : <div className="table-scroll">
        <table className="dashboard-table audit-table">
          <thead><tr><th>Time</th><th>Action</th><th>Outcome</th><th>Actor</th><th>Target / Record</th><th>Details</th><th>Connection</th></tr></thead>
          <tbody>
            {auditLogs.map((log) => <tr key={log.id}>
              <td>{formatDate(log.createdAt)}</td>
              <td><strong>{formatAction(log.action)}</strong><small className="stock-available">{log.entityType}</small></td>
              <td><span className={log.outcome === "success" ? "badge-success" : "badge-danger"}>{log.outcome}</span></td>
              <td>{log.actorName ?? "System / anonymous"}<small className="stock-available">{log.actorEmail ?? "—"}</small></td>
              <td>{log.targetName ?? `${log.entityType} ${log.entityId ?? "—"}`}<small className="stock-available">{log.targetEmail ?? (log.entityId ? `ID ${log.entityId}` : "—")}</small></td>
              <td className="audit-details">{formatDetails(log.details)}</td>
              <td title={log.userAgent ?? undefined}>{log.ipAddress ?? "—"}</td>
            </tr>)}
            {auditLogs.length === 0 && <tr><td className="empty-table" colSpan={7}>No audit events match these filters.</td></tr>}
          </tbody>
        </table>
      </div>}
    </section>
  </div>;
};

export default AuditLogs;

