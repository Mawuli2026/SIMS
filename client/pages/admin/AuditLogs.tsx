import { useMemo, useState } from "react";
import {
  HiSearch,
  HiDownload,
  HiFilter,
} from "react-icons/hi";

import pdfService from "../../services/pdfService";
import excelService from "../../services/excelService";
import auditService from "../../services/auditService";

const AuditLogs = () => {

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] =
    useState("All");

  const logs = useMemo(() => {

    let data = auditService.getAll();

    if (actionFilter !== "All") {

      data = data.filter(
        log => log.action === actionFilter
      );

    }

    if (search.trim()) {

      const keyword = search.toLowerCase();

      data = data.filter(log =>

        log.user.toLowerCase().includes(keyword) ||

        log.action.toLowerCase().includes(keyword) ||

        log.module.toLowerCase().includes(keyword)

      );

    }

    return data.sort(

      (a, b) =>

        new Date(b.createdAt).getTime() -

        new Date(a.createdAt).getTime()

    );

  }, [search, actionFilter]);

  const exportPdf = () => {

    pdfService.exportTable(

      "Audit Logs",

      [

        { header: "Date", dataKey: "date" },

        { header: "User", dataKey: "user" },

        { header: "Module", dataKey: "module" },

        { header: "Action", dataKey: "action" },

        { header: "Description", dataKey: "description" },

      ],

      logs.map(log => ({

        date: new Date(
          log.createdAt
        ).toLocaleString(),

        user: log.user,

        module: log.module,

        action: log.action,

        description: log.description,

      })),

      "audit-logs"

    );

  };

  const exportExcel = () => {

    excelService.exportData(

      logs,

      "Audit Logs",

      "audit-logs"

    );

  };

  return (

    <div className="space-y-6">

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold">

            Audit Logs

          </h1>

          <p className="text-gray-500">

            System activity history

          </p>

        </div>

        <div className="flex gap-3">

          <button
            onClick={exportPdf}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white"
          >

            <HiDownload />

            PDF

          </button>

          <button
            onClick={exportExcel}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white"
          >

            <HiDownload />

            Excel

          </button>

        </div>

      </div>

      <div className="rounded-xl border bg-white shadow">

        <div className="flex flex-col gap-4 border-b p-5 md:flex-row md:items-center md:justify-between">

          <div className="relative">

            <HiSearch className="absolute left-3 top-3 text-gray-400" />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search user, module or action..."
              className="rounded-lg border py-2 pl-10 pr-4"
            />

          </div>

          <div className="flex items-center gap-2">

            <HiFilter />

            <select
              value={actionFilter}
              onChange={(e) =>
                setActionFilter(e.target.value)
              }
              className="rounded-lg border px-3 py-2"
            >

              <option>All</option>
              <option>Login</option>
              <option>Logout</option>
              <option>Create</option>
              <option>Update</option>
              <option>Delete</option>
              <option>Sale</option>
              <option>Purchase</option>

            </select>

          </div>

        </div>

        <div className="overflow-x-auto">

          <table className="min-w-full">

            <thead className="bg-gray-50">

              <tr>

                <th className="px-5 py-3 text-left">

                  Date

                </th>

                <th className="px-5 py-3">

                  User

                </th>

                <th className="px-5 py-3">

                  Module

                </th>

                <th className="px-5 py-3">

                  Action

                </th>

                <th className="px-5 py-3">

                  Description

                </th>

              </tr>

            </thead>

            <tbody>

              {logs.map(log => (

                <tr
                  key={log.id}
                  className="border-t hover:bg-gray-50"
                >

                  <td className="px-5 py-4">

                    {new Date(
                      log.createdAt
                    ).toLocaleString()}

                  </td>

                  <td className="px-5 py-4">

                    {log.user}

                  </td>

                  <td className="px-5 py-4">

                    {log.module}

                  </td>

                  <td className="px-5 py-4">

                    {log.action}

                  </td>

                  <td className="px-5 py-4">

                    {log.description}

                  </td>

                </tr>

              ))}

              {logs.length === 0 && (

                <tr>

                  <td
                    colSpan={5}
                    className="py-8 text-center text-gray-500"
                  >

                    No audit records found.

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>

  );

};

export default AuditLogs;