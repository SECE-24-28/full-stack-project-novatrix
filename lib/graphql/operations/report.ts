import { gql } from "@apollo/client";

const REPORT_FILTER = `
  fragment ReportFilter on ReportFilterInput { __typename }
`;

export const GET_INVENTORY_REPORT = gql`
  query GetInventoryReport($filter: ReportFilterInput) {
    inventoryReport(filter: $filter) {
      totalRows totalValue lowStockCount outOfStockCount
      rows {
        productId sku name category supplier
        warehouseName warehouseCode
        quantity reservedQty availableQty reorderPoint
        costPrice sellingPrice stockValue status
      }
    }
  }
`;

export const GET_SALES_REPORT = gql`
  query GetSalesReport($filter: ReportFilterInput) {
    salesReport(filter: $filter) {
      totalRows totalRevenue totalTax totalDiscount orderCount
      rows {
        orderId soNumber customerName warehouse status
        orderDate deliveredDate
        subtotal taxAmount discountAmount totalAmount itemCount
      }
    }
  }
`;

export const GET_SUPPLIER_REPORT = gql`
  query GetSupplierReport($filter: ReportFilterInput) {
    supplierReport(filter: $filter) {
      totalRows totalSpend activeCount
      rows {
        supplierId name code contactName email phone country
        status paymentTerms totalOrders totalSpend lastOrderDate productCount
      }
    }
  }
`;

export const GET_WAREHOUSE_REPORT = gql`
  query GetWarehouseReport($filter: ReportFilterInput) {
    warehouseReport(filter: $filter) {
      totalRows totalStock avgUtil
      rows {
        warehouseId name code city country status
        capacity usedUnits utilisationPct
        totalProducts stockValue zoneCount
        inboundOrders outboundOrders
      }
    }
  }
`;
