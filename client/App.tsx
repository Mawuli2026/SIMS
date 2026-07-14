import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import DashboardLayout from "./components/layout/DashboardLayout";

import Dashboard from "./pages/dashboard/Dashboard";
import ExecutiveDashboard from "./pages/dashboard/ExecutiveDashboard";
import Products from "./pages/products/Products";
import AddProduct from "./pages/products/AddProduct";
import EditProduct from "./pages/products/EditProduct";
import ProductDetails from "./pages/products/ProductDetails";
import Categories from "./pages/categories/Categories";
import Suppliers from "./pages/suppliers/Suppliers";
import AddSupplier from "./pages/suppliers/AddSupplier";
import EditSupplier from "./pages/suppliers/EditSupplier";
import SupplierDetails from "./pages/suppliers/SupplierDetails";
import PurchaseOrders from "./pages/purchase-orders/PurchaseOrders";
import AddPurchaseOrder from "./pages/purchase-orders/AddPurchaseOrder";
import EditPurchaseOrder from "./pages/purchase-orders/EditPurchaseOrder";
import PurchaseOrderDetails from "./pages/purchase-orders/PurchaseOrderDetails";
import Inventory from "./pages/inventory/Inventory";
import Sales from "./pages/sales/Sales";
import NewSale from "./pages/sales/NewSale";
import SalesHistory from "./pages/sales/SalesHistory";
import Receipt from "./pages/sales/Receipt";
import SaleDetails from "./pages/sales/SaleDetails";
import CustomerList from "./pages/customers/CustomerList";
import CustomerForm from "./pages/customers/CustomerForm";
import CustomerProfile from "./pages/customers/CustomerProfile";
import CustomerDashboard from "./pages/customers/CustomerDashboard";
import CustomerReports from "./pages/customers/CustomerReports";
import ReportsDashboard from "./pages/reports/ReportsDashboard";
import SalesReport from "./pages/reports/SalesReport";
import ProfitReport from "./pages/reports/ProfitReport";
import InventoryReport from "./pages/reports/InventoryReport";
import PurchaseReport from "./pages/reports/PurchaseReport";
import ProductPerformanceReport from "./pages/reports/ProductPerformanceReport";
import SystemSettings from "./pages/settings/SystemSettings";
import AuditLogs from "./pages/admin/AuditLogs";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect */}
        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        {/* Dashboard Layout */}
        <Route element={<DashboardLayout />}>
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/executive-dashboard"
            element={<ExecutiveDashboard />}
          />

          <Route
            path="/products"
            element={<Products />}
          />

          <Route
            path="/products/new"
            element={<AddProduct />}
          />

          <Route
            path="/products/edit/:id"
            element={<EditProduct />}
          />

          <Route
            path="/products/:id"
            element={<ProductDetails />}
          />

          {/* Categories Route */}
          <Route
            path="/categories"
            element={<Categories />}
          />

          {/* Suppliers Routes */}
          <Route
            path="/suppliers"
            element={<Suppliers />}
          />
          <Route
            path="/suppliers/new"
            element={<AddSupplier />}
          />
          <Route
            path="/suppliers/edit/:id"
            element={<EditSupplier />}
          />
          <Route
            path="/suppliers/:id"
            element={<SupplierDetails />}
          />

          {/* Purchase Orders Routes */}
          <Route
            path="/purchase-orders"
            element={<PurchaseOrders />}
          />
          <Route
            path="/purchase-orders/new"
            element={<AddPurchaseOrder />}
          />
          <Route
            path="/purchase-orders/edit/:id"
            element={<EditPurchaseOrder />}
          />
          <Route
            path="/purchase-orders/:id"
            element={<PurchaseOrderDetails />}
          />

          {/* Inventory Route */}
          <Route
            path="/inventory"
            element={<Inventory />}
          />

          {/* Sales Route */}
          <Route
            path="/sales"
            element={<Sales />}
          />

          {/* New Sale Route */}
          <Route
            path="/sales/new"
            element={<NewSale />}
          />

          {/* Sales History Route */}
          <Route
            path="/sales/history"
            element={<SalesHistory />}
          />

          {/* Sale Details Route */}
          <Route
            path="/sales/:id"
            element={<SaleDetails />}
          />

          {/* Receipt Route */}
          <Route
            path="/receipt/:id"
            element={<Receipt />}
          />

          {/* Customers Routes */}
          <Route
            path="/customers/dashboard"
            element={<CustomerDashboard />}
          />

          <Route
            path="/customers/reports"
            element={<CustomerReports />}
          />

          <Route
            path="/customers"
            element={<CustomerList />}
          />
          
          <Route
            path="/customers/new"
            element={<CustomerForm />}
          />
          
          <Route
            path="/customers/edit/:id"
            element={<CustomerForm />}
          />

          <Route
            path="/customers/:id"
            element={<CustomerProfile />}
          />

          {/* Reports Routes */}
          <Route
            path="/reports"
            element={<ReportsDashboard />}
          />

          <Route
            path="/reports/sales"
            element={<SalesReport />}
          />

          <Route
            path="/reports/profit"
            element={<ProfitReport />}
          />

          <Route
            path="/reports/inventory"
            element={<InventoryReport />}
          />

          <Route
            path="/reports/purchases"
            element={<PurchaseReport />}
          />

          <Route
            path="/reports/products"
            element={<ProductPerformanceReport />}
          />

          {/* Settings Route */}
          <Route
            path="/settings"
            element={<SystemSettings />}
          />

          {/* Admin Routes */}
          <Route
            path="/admin/audit-logs"
            element={<AuditLogs />}
          />
        </Route>

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="flex h-screen items-center justify-center">
              <h1 className="text-4xl font-bold">
                404 - Page Not Found
              </h1>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;