import type { PrismaClient } from "@prisma/client";

interface ReportFilter {
  search?:      string | null;
  dateFrom?:    Date   | null;
  dateTo?:      Date   | null;
  status?:      string | null;
  warehouseId?: string | null;
  supplierId?:  string | null;
  categoryId?:  string | null;
}

export const reportService = {

  // ── Inventory Report ──────────────────────────────────────────────────────
  async getInventoryReport(prisma: PrismaClient, filter: ReportFilter = {}) {
    const stocks = await prisma.inventoryStock.findMany({
      where: {
        ...(filter.warehouseId ? { warehouseId: filter.warehouseId } : {}),
        product: {
          ...(filter.categoryId ? { categoryId: filter.categoryId } : {}),
          ...(filter.supplierId ? { supplierId:  filter.supplierId } : {}),
          ...(filter.status     ? { status: filter.status as never  } : {}),
          ...(filter.search ? {
            OR: [
              { name: { contains: filter.search, mode: "insensitive" } },
              { sku:  { contains: filter.search, mode: "insensitive" } },
            ],
          } : {}),
        },
      },
      select: {
        quantity:    true,
        reservedQty: true,
        product: {
          select: {
            id:           true,
            sku:          true,
            name:         true,
            costPrice:    true,
            sellingPrice: true,
            reorderPoint: true,
            status:       true,
            category:     { select: { name: true } },
            supplier:     { select: { name: true } },
          },
        },
        warehouse: { select: { name: true, code: true } },
      },
      orderBy: [{ warehouse: { name: "asc" } }, { product: { name: "asc" } }],
    });

    let totalValue      = 0;
    let lowStockCount   = 0;
    let outOfStockCount = 0;

    const rows = stocks.map((s) => {
      const cost      = Number(s.product.costPrice);
      const value     = cost * s.quantity;
      totalValue     += value;
      if (s.quantity === 0)                         outOfStockCount++;
      else if (s.quantity <= s.product.reorderPoint) lowStockCount++;

      return {
        productId:     s.product.id,
        sku:           s.product.sku,
        name:          s.product.name,
        category:      s.product.category.name,
        supplier:      s.product.supplier?.name ?? "—",
        warehouseName: s.warehouse.name,
        warehouseCode: s.warehouse.code,
        quantity:      s.quantity,
        reservedQty:   s.reservedQty,
        availableQty:  s.quantity - s.reservedQty,
        reorderPoint:  s.product.reorderPoint,
        costPrice:     s.product.costPrice.toString(),
        sellingPrice:  s.product.sellingPrice.toString(),
        stockValue:    value.toFixed(2),
        status:        s.product.status,
      };
    });

    return {
      rows,
      totalRows:       rows.length,
      totalValue:      totalValue.toFixed(2),
      lowStockCount,
      outOfStockCount,
    };
  },

  // ── Sales Report ──────────────────────────────────────────────────────────
  async getSalesReport(prisma: PrismaClient, filter: ReportFilter = {}) {
    const orders = await prisma.salesOrder.findMany({
      where: {
        ...(filter.warehouseId ? { warehouseId: filter.warehouseId } : {}),
        ...(filter.status      ? { status: filter.status as never }   : {}),
        ...(filter.dateFrom || filter.dateTo ? {
          orderDate: {
            ...(filter.dateFrom ? { gte: filter.dateFrom } : {}),
            ...(filter.dateTo   ? { lte: filter.dateTo   } : {}),
          },
        } : {}),
        ...(filter.search ? {
          OR: [
            { soNumber:     { contains: filter.search, mode: "insensitive" } },
            { customerName: { contains: filter.search, mode: "insensitive" } },
            { customerEmail:{ contains: filter.search, mode: "insensitive" } },
          ],
        } : {}),
      },
      select: {
        id:             true,
        soNumber:       true,
        customerName:   true,
        status:         true,
        orderDate:      true,
        deliveredDate:  true,
        subtotal:       true,
        taxAmount:      true,
        discountAmount: true,
        totalAmount:    true,
        warehouse:      { select: { name: true } },
        _count:         { select: { items: true } },
      },
      orderBy: { orderDate: "desc" },
    });

    let totalRevenue  = 0;
    let totalTax      = 0;
    let totalDiscount = 0;

    const rows = orders.map((o) => {
      totalRevenue  += Number(o.totalAmount);
      totalTax      += Number(o.taxAmount);
      totalDiscount += Number(o.discountAmount);
      return {
        orderId:        o.id,
        soNumber:       o.soNumber,
        customerName:   o.customerName,
        warehouse:      o.warehouse.name,
        status:         o.status,
        orderDate:      o.orderDate.toISOString(),
        deliveredDate:  o.deliveredDate?.toISOString() ?? null,
        subtotal:       o.subtotal.toString(),
        taxAmount:      o.taxAmount.toString(),
        discountAmount: o.discountAmount.toString(),
        totalAmount:    o.totalAmount.toString(),
        itemCount:      o._count.items,
      };
    });

    return {
      rows,
      totalRows:     rows.length,
      totalRevenue:  totalRevenue.toFixed(2),
      totalTax:      totalTax.toFixed(2),
      totalDiscount: totalDiscount.toFixed(2),
      orderCount:    rows.length,
    };
  },

  // ── Supplier Report ───────────────────────────────────────────────────────
  async getSupplierReport(prisma: PrismaClient, filter: ReportFilter = {}) {
    const suppliers = await prisma.supplier.findMany({
      where: {
        ...(filter.status ? { status: filter.status as never } : {}),
        ...(filter.search ? {
          OR: [
            { name:        { contains: filter.search, mode: "insensitive" } },
            { code:        { contains: filter.search, mode: "insensitive" } },
            { contactName: { contains: filter.search, mode: "insensitive" } },
            { email:       { contains: filter.search, mode: "insensitive" } },
          ],
        } : {}),
      },
      select: {
        id:           true,
        name:         true,
        code:         true,
        contactName:  true,
        email:        true,
        phone:        true,
        country:      true,
        status:       true,
        paymentTerms: true,
        _count:       { select: { products: true } },
        purchaseOrders: {
          where: {
            ...(filter.dateFrom || filter.dateTo ? {
              orderDate: {
                ...(filter.dateFrom ? { gte: filter.dateFrom } : {}),
                ...(filter.dateTo   ? { lte: filter.dateTo   } : {}),
              },
            } : {}),
            status: { not: "CANCELLED" },
          },
          select: { totalAmount: true, orderDate: true },
          orderBy: { orderDate: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });

    let totalSpend  = 0;
    let activeCount = 0;

    const rows = suppliers.map((s) => {
      const spend = s.purchaseOrders.reduce((acc, po) => acc + Number(po.totalAmount), 0);
      totalSpend += spend;
      if (s.status === "ACTIVE") activeCount++;
      return {
        supplierId:    s.id,
        name:          s.name,
        code:          s.code,
        contactName:   s.contactName ?? "—",
        email:         s.email       ?? "—",
        phone:         s.phone       ?? "—",
        country:       s.country     ?? "—",
        status:        s.status,
        paymentTerms:  s.paymentTerms,
        totalOrders:   s.purchaseOrders.length,
        totalSpend:    spend.toFixed(2),
        lastOrderDate: s.purchaseOrders[0]?.orderDate.toISOString() ?? null,
        productCount:  s._count.products,
      };
    });

    return {
      rows,
      totalRows:   rows.length,
      totalSpend:  totalSpend.toFixed(2),
      activeCount,
    };
  },

  // ── Warehouse Report ──────────────────────────────────────────────────────
  async getWarehouseReport(prisma: PrismaClient, filter: ReportFilter = {}) {
    const warehouses = await prisma.warehouse.findMany({
      where: {
        ...(filter.status ? { status: filter.status as never } : {}),
        ...(filter.search ? {
          OR: [
            { name: { contains: filter.search, mode: "insensitive" } },
            { code: { contains: filter.search, mode: "insensitive" } },
            { city: { contains: filter.search, mode: "insensitive" } },
          ],
        } : {}),
      },
      select: {
        id:       true,
        name:     true,
        code:     true,
        city:     true,
        country:  true,
        status:   true,
        capacity: true,
        _count:   { select: { zones: true } },
        inventoryStock: {
          select: {
            quantity:  true,
            productId: true,
            product:   { select: { costPrice: true } },
          },
        },
        purchaseOrders: {
          where: filter.dateFrom || filter.dateTo ? {
            orderDate: {
              ...(filter.dateFrom ? { gte: filter.dateFrom } : {}),
              ...(filter.dateTo   ? { lte: filter.dateTo   } : {}),
            },
          } : {},
          select: { id: true },
        },
        salesOrders: {
          where: filter.dateFrom || filter.dateTo ? {
            orderDate: {
              ...(filter.dateFrom ? { gte: filter.dateFrom } : {}),
              ...(filter.dateTo   ? { lte: filter.dateTo   } : {}),
            },
          } : {},
          select: { id: true },
        },
      },
      orderBy: { name: "asc" },
    });

    let totalStock   = 0;
    let utilSum      = 0;
    let wareWithCap  = 0;

    const rows = warehouses.map((w) => {
      const usedUnits  = w.inventoryStock.reduce((s, r) => s + r.quantity, 0);
      const stockValue = w.inventoryStock
        .reduce((s, r) => s + Number(r.product.costPrice) * r.quantity, 0)
        .toFixed(2);
      const totalProducts = new Set(w.inventoryStock.map((s) => s.productId)).size;
      const utilisationPct = w.capacity
        ? Math.min(Math.round((usedUnits / w.capacity) * 1000) / 10, 100)
        : 0;

      totalStock += usedUnits;
      if (w.capacity) { utilSum += utilisationPct; wareWithCap++; }

      return {
        warehouseId:    w.id,
        name:           w.name,
        code:           w.code,
        city:           w.city    ?? "—",
        country:        w.country ?? "—",
        status:         w.status,
        capacity:       w.capacity,
        usedUnits,
        utilisationPct,
        totalProducts,
        stockValue,
        zoneCount:      w._count.zones,
        inboundOrders:  w.purchaseOrders.length,
        outboundOrders: w.salesOrders.length,
      };
    });

    return {
      rows,
      totalRows:  rows.length,
      totalStock,
      avgUtil:    wareWithCap > 0 ? Math.round((utilSum / wareWithCap) * 10) / 10 : 0,
    };
  },
};
