import React, { useState, useEffect } from 'react';
import SalesTrendChart from '../../components/charts/SalesTrendChart';
import RevenuePieChart from '../../components/charts/RevenuePieChart';
import TopProductsChart from '../../components/charts/TopProductsChart';
import ProfitTrendChart from '../../components/charts/ProfitTrendChart';
import InventoryStatusChart from '../../components/charts/InventoryStatusChart';
import salesService from '../../services/salesService';
import inventoryService from '../../services/inventoryService';
import { SalesTrendData } from '../../components/charts/SalesTrendChart';
import { RevenueCategoryData } from '../../components/charts/RevenuePieChart';

interface Sale {
  id: string;
  grandTotal: number;
  createdAt: string;
  items?: Array<{
    category: string;
    productId: string;
    productName: string;
    quantity: number;
    lineTotal: number;
    costPrice: number;
  }>;
}

interface InventoryItem {
  id: string;
  quantity: number;
  reorderLevel: number;
  // Add other inventory properties as needed
}

const BusinessAnalytics = () => {
  const [salesData, setSalesData] = useState<SalesTrendData[]>([]);
  const [revenueByCategory, setRevenueByCategory] = useState<RevenueCategoryData[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [profitTrend, setProfitTrend] = useState<any[]>([]);
  const [inventoryStatus, setInventoryStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    fetchAnalyticsData();
  }, [filter]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const sales = await salesService.getAll();
      const inventory = await inventoryService.getAll();
      
      // Group sales by period for trend chart
      const groupedSales = groupSalesByPeriod(sales, filter);
      setSalesData(groupedSales);

      // Calculate revenue by category for pie chart
      const categoryRevenue = calculateRevenueByCategory(sales);
      setRevenueByCategory(categoryRevenue);

      // Calculate top products
      const topProductsData = calculateTopProducts(sales);
      setTopProducts(topProductsData);

      // Calculate profit trend
      const profitTrendData = calculateProfitTrend(sales);
      setProfitTrend(profitTrendData);

      // Calculate inventory status
      const inventoryStatusData = calculateInventoryStatus(inventory);
      setInventoryStatus(inventoryStatusData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateRevenueByCategory = (sales: Sale[]): RevenueCategoryData[] => {
    const categoryMap = sales.reduce((acc, sale) => {
      if (sale.items) {
        sale.items.forEach((item) => {
          if (!acc[item.category]) {
            acc[item.category] = {
              category: item.category,
              revenue: 0,
            };
          }
          acc[item.category].revenue += item.lineTotal;
        });
      }
      return acc;
    }, {} as Record<string, RevenueCategoryData>);

    return Object.values(categoryMap);
  };

  const calculateTopProducts = (sales: Sale[]) => {
    const productMap = sales.reduce((acc, sale) => {
      if (sale.items) {
        sale.items.forEach((item) => {
          if (!acc[item.productId]) {
            acc[item.productId] = {
              productName: item.productName,
              unitsSold: 0,
              revenue: 0,
            };
          }
          acc[item.productId].unitsSold += item.quantity;
          acc[item.productId].revenue += item.lineTotal;
        });
      }
      return acc;
    }, {} as Record<string, {
      productName: string;
      unitsSold: number;
      revenue: number;
    }>);

    // Convert to array and sort by revenue (highest first)
    return Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10); // Get top 10 products
  };

  const calculateProfitTrend = (sales: Sale[]) => {
    const profitMap = sales.reduce((acc, sale) => {
      const period = new Date(sale.createdAt).toLocaleDateString();
      
      if (!acc[period]) {
        acc[period] = {
          period,
          revenue: 0,
          cost: 0,
          profit: 0,
        };
      }
      
      acc[period].revenue += sale.grandTotal;
      
      if (sale.items) {
        sale.items.forEach(item => {
          const cost = item.costPrice * item.quantity;
          acc[period].cost += cost;
          acc[period].profit += item.lineTotal - cost;
        });
      }
      
      return acc;
    }, {} as Record<string, {
      period: string;
      revenue: number;
      cost: number;
      profit: number;
    }>);

    // Convert to array and sort by date
    return Object.values(profitMap).sort(
      (a, b) => new Date(a.period).getTime() - new Date(b.period).getTime()
    );
  };

  const calculateInventoryStatus = (inventory: InventoryItem[]) => {
    return [
      {
        status: "In Stock",
        value: inventory.filter(
          item => item.quantity > item.reorderLevel
        ).length,
      },
      {
        status: "Low Stock",
        value: inventory.filter(
          item => item.quantity > 0 && item.quantity <= item.reorderLevel
        ).length,
      },
      {
        status: "Out of Stock",
        value: inventory.filter(
          item => item.quantity === 0
        ).length,
      },
    ];
  };

  const groupSalesByPeriod = (sales: Sale[], period: 'daily' | 'weekly' | 'monthly') => {
    const grouped = sales.reduce((acc, sale) => {
      const date = new Date(sale.createdAt);
      let key: string;

      switch (period) {
        case 'daily':
          key = date.toLocaleDateString('en-US', { weekday: 'short' });
          break;
        case 'weekly':
          const weekNumber = getWeekNumber(date);
          key = `Week ${weekNumber}`;
          break;
        case 'monthly':
          key = date.toLocaleDateString('en-US', { month: 'short' });
          break;
        default:
          key = date.toLocaleDateString('en-US', { weekday: 'short' });
      }

      const existing = acc.find(item => item.period === key);
      if (existing) {
        existing.sales += sale.grandTotal;
      } else {
        acc.push({ period: key, sales: sale.grandTotal });
      }
      return acc;
    }, [] as SalesTrendData[]);

    return sortByPeriod(grouped, period);
  };

  const getWeekNumber = (date: Date): number => {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000);
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  };

  const sortByPeriod = (data: SalesTrendData[], period: 'daily' | 'weekly' | 'monthly') => {
    const order: Record<string, number> = {};

    if (period === 'daily') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      days.forEach((day, index) => { order[day] = index; });
    } else if (period === 'monthly') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      months.forEach((month, index) => { order[month] = index; });
    }

    return data.sort((a, b) => (order[a.period] || 0) - (order[b.period] || 0));
  };

  const totalRevenue = salesData.reduce((sum, item) => sum + item.sales, 0);
  const averageDailySales = salesData.length > 0 ? totalRevenue / salesData.length : 0;
  const totalProfit = profitTrend.reduce((sum, item) => sum + item.profit, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Business Analytics</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('daily')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'daily'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setFilter('weekly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'weekly'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setFilter('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
            <p className="text-2xl font-bold text-gray-800 mt-2">
              ${totalRevenue.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Profit</h3>
            <p className="text-2xl font-bold text-green-600 mt-2">
              ${totalProfit.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Average {filter === 'daily' ? 'Daily' : filter === 'weekly' ? 'Weekly' : 'Monthly'} Sales</h3>
            <p className="text-2xl font-bold text-gray-800 mt-2">
              ${averageDailySales.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Transactions</h3>
            <p className="text-2xl font-bold text-gray-800 mt-2">
              {salesData.length}
            </p>
          </div>
        </div>

        {/* Row 1 - Sales Trend & Revenue by Category */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SalesTrendChart
            data={salesData}
            title="Sales Trend"
            subtitle={`${filter.charAt(0).toUpperCase() + filter.slice(1)} Sales Performance`}
            color="#2563eb"
          />
          <RevenuePieChart
            data={revenueByCategory}
          />
        </div>

        {/* Row 2 - Top Products & Profit Trend */}
        <div className="grid gap-6 lg:grid-cols-2">
          <TopProductsChart
            data={topProducts}
          />
          <ProfitTrendChart
            data={profitTrend}
          />
        </div>

        {/* Row 3 - Inventory Status & Recent Sales */}
        <div className="grid gap-6 lg:grid-cols-2">
          <InventoryStatusChart
            data={inventoryStatus}
          />
          {/* Recent Sales Card - Placeholder */}
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Recent Sales</h2>
            <p className="text-gray-500 text-sm">Recent sales data will be displayed here</p>
            {/* Add RecentSalesCard component when available */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessAnalytics;