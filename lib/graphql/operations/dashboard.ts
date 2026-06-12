import { gql } from "@apollo/client";

export const GET_DASHBOARD_DATA = gql`
  query GetDashboardData {
    dashboardData {
      stats {
        totalProducts
        totalWarehouses
        totalSuppliers
        totalPurchaseOrders
        totalSalesOrders
        lowStockProducts
        openAlerts
        totalInventoryUnits
      }
      monthlySales {
        month year salesOrders revenue
      }
      inventoryTrend {
        month year incoming outgoing net
      }
      categoryDistribution {
        categoryId categoryName productCount
      }
      warehouseUtilization {
        warehouseId warehouseName warehouseCode
        capacity usedUnits utilisationPct
      }
      recentOrders {
        id number type status party totalAmount date
      }
      lowStockProducts {
        productId sku name totalQuantity reorderPoint deficit
      }
    }
  }
`;
