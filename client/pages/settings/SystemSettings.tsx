import { useState } from "react";
import {
  HiOfficeBuilding,
  HiCurrencyDollar,
  HiReceiptTax,
  HiCog,
  HiMoon,
  HiSun,
  HiDatabase,
  HiSave,
} from "react-icons/hi";

const SystemSettings = () => {

  const [settings, setSettings] = useState({

    companyName: "ABC Store",

    companyEmail: "info@abcstore.com",

    companyPhone: "+1 555-123-4567",

    companyAddress: "123 Business Street",

    currency: "USD",

    currencySymbol: "$",

    taxRate: 18,

    receiptFooter:
      "Thank you for shopping with us!",

    darkMode: false,

    backupFrequency: "Daily",

  });

  const updateField = (
    field: string,
    value: any
  ) => {

    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));

  };

  const saveSettings = () => {

    localStorage.setItem(
      "systemSettings",
      JSON.stringify(settings)
    );

    alert("Settings saved successfully.");

  };

  return (

    <div className="space-y-6">

      <div>

        <h1 className="text-3xl font-bold">

          System Settings

        </h1>

        <p className="text-gray-500">

          Configure your business information and system preferences.

        </p>

      </div>

      {/* Company Information */}

      <div className="rounded-xl border bg-white p-6 shadow">

        <div className="mb-6 flex items-center gap-2">

          <HiOfficeBuilding className="text-2xl text-blue-600"/>

          <h2 className="text-xl font-semibold">

            Company Information

          </h2>

        </div>

        <div className="grid gap-4 md:grid-cols-2">

          <input
            value={settings.companyName}
            onChange={(e)=>updateField("companyName",e.target.value)}
            placeholder="Company Name"
            className="rounded-lg border p-3"
          />

          <input
            value={settings.companyEmail}
            onChange={(e)=>updateField("companyEmail",e.target.value)}
            placeholder="Email"
            className="rounded-lg border p-3"
          />

          <input
            value={settings.companyPhone}
            onChange={(e)=>updateField("companyPhone",e.target.value)}
            placeholder="Phone"
            className="rounded-lg border p-3"
          />

          <input
            value={settings.companyAddress}
            onChange={(e)=>updateField("companyAddress",e.target.value)}
            placeholder="Address"
            className="rounded-lg border p-3"
          />

        </div>

      </div>

      {/* Currency */}

      <div className="rounded-xl border bg-white p-6 shadow">

        <div className="mb-6 flex items-center gap-2">

          <HiCurrencyDollar className="text-2xl text-green-600"/>

          <h2 className="text-xl font-semibold">

            Currency Settings

          </h2>

        </div>

        <div className="grid gap-4 md:grid-cols-2">

          <select
            value={settings.currency}
            onChange={(e)=>updateField("currency",e.target.value)}
            className="rounded-lg border p-3"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="BIF">BIF</option>
            <option value="KES">KES</option>
            <option value="TZS">TZS</option>
          </select>

          <input
            value={settings.currencySymbol}
            onChange={(e)=>updateField("currencySymbol",e.target.value)}
            className="rounded-lg border p-3"
          />

        </div>

      </div>

      {/* Tax */}

      <div className="rounded-xl border bg-white p-6 shadow">

        <div className="mb-6 flex items-center gap-2">

          <HiReceiptTax className="text-2xl text-orange-600"/>

          <h2 className="text-xl font-semibold">

            Tax Configuration

          </h2>

        </div>

        <input
          type="number"
          value={settings.taxRate}
          onChange={(e)=>updateField("taxRate",Number(e.target.value))}
          className="w-full rounded-lg border p-3"
        />

      </div>

      {/* Receipt */}

      <div className="rounded-xl border bg-white p-6 shadow">

        <div className="mb-6 flex items-center gap-2">

          <HiReceiptTax className="text-2xl text-purple-600"/>

          <h2 className="text-xl font-semibold">

            Receipt Settings

          </h2>

        </div>

        <textarea
          rows={4}
          value={settings.receiptFooter}
          onChange={(e)=>updateField("receiptFooter",e.target.value)}
          className="w-full rounded-lg border p-3"
        />

      </div>

      {/* Appearance */}

      <div className="rounded-xl border bg-white p-6 shadow">

        <div className="mb-6 flex items-center gap-2">

          <HiCog className="text-2xl text-gray-600"/>

          <h2 className="text-xl font-semibold">

            Appearance

          </h2>

        </div>

        <button
          onClick={()=>updateField("darkMode",!settings.darkMode)}
          className="flex items-center gap-3 rounded-lg border px-5 py-3"
        >

          {settings.darkMode ? (
            <>
              <HiMoon/>
              Dark Mode
            </>
          ) : (
            <>
              <HiSun/>
              Light Mode
            </>
          )}

        </button>

      </div>

      {/* Backup */}

      <div className="rounded-xl border bg-white p-6 shadow">

        <div className="mb-6 flex items-center gap-2">

          <HiDatabase className="text-2xl text-indigo-600"/>

          <h2 className="text-xl font-semibold">

            Backup Settings

          </h2>

        </div>

        <select
          value={settings.backupFrequency}
          onChange={(e)=>updateField("backupFrequency",e.target.value)}
          className="rounded-lg border p-3"
        >
          <option>Daily</option>
          <option>Weekly</option>
          <option>Monthly</option>
          <option>Never</option>
        </select>

      </div>

      {/* Save */}

      <div className="flex justify-end">

        <button
          onClick={saveSettings}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white"
        >

          <HiSave/>

          Save Settings

        </button>

      </div>

    </div>

  );

};

export default SystemSettings;