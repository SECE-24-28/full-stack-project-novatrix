import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ── helpers ───────────────────────────────────────────────────────────────────
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log("🌱 Seeding database...\n");

  // ── 1. USERS ────────────────────────────────────────────────────────────────
  const pw = await bcrypt.hash("Admin@12345", 12);

  const [superAdmin, admin, whManager, invClerk, viewer] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@iwms.local" },
      update: {},
      create: { email: "admin@iwms.local",        passwordHash: pw, firstName: "Super",   lastName: "Admin",   role: "SUPER_ADMIN"       },
    }),
    prisma.user.upsert({
      where: { email: "manager@iwms.local" },
      update: {},
      create: { email: "manager@iwms.local",       passwordHash: pw, firstName: "Alice",   lastName: "Johnson", role: "ADMIN"             },
    }),
    prisma.user.upsert({
      where: { email: "wh.manager@iwms.local" },
      update: {},
      create: { email: "wh.manager@iwms.local",    passwordHash: pw, firstName: "Bob",     lastName: "Smith",   role: "WAREHOUSE_MANAGER" },
    }),
    prisma.user.upsert({
      where: { email: "clerk@iwms.local" },
      update: {},
      create: { email: "clerk@iwms.local",          passwordHash: pw, firstName: "Carol",   lastName: "Davis",   role: "INVENTORY_CLERK"   },
    }),
    prisma.user.upsert({
      where: { email: "viewer@iwms.local" },
      update: {},
      create: { email: "viewer@iwms.local",          passwordHash: pw, firstName: "David",   lastName: "Wilson",  role: "VIEWER"            },
    }),
  ]);
  console.log("✅ Users seeded (5)");

  // ── 2. CATEGORIES ───────────────────────────────────────────────────────────
  const catElectronics = await prisma.category.upsert({
    where: { name: "Electronics" },
    update: {},
    create: { name: "Electronics", description: "Electronic devices and components" },
  });
  const catFurniture = await prisma.category.upsert({
    where: { name: "Furniture" },
    update: {},
    create: { name: "Furniture", description: "Office and home furniture" },
  });
  const catOffice = await prisma.category.upsert({
    where: { name: "Office Supplies" },
    update: {},
    create: { name: "Office Supplies", description: "Stationery and office consumables" },
  });
  const catClothing = await prisma.category.upsert({
    where: { name: "Clothing" },
    update: {},
    create: { name: "Clothing", description: "Apparel and garments" },
  });
  const catFood = await prisma.category.upsert({
    where: { name: "Food & Beverages" },
    update: {},
    create: { name: "Food & Beverages", description: "Packaged food and drinks" },
  });
  const catTools = await prisma.category.upsert({
    where: { name: "Tools & Hardware" },
    update: {},
    create: { name: "Tools & Hardware", description: "Hand tools and hardware equipment" },
  });
  // Sub-categories
  const catLaptops = await prisma.category.upsert({
    where: { name: "Laptops" },
    update: {},
    create: { name: "Laptops", description: "Portable computers", parentId: catElectronics.id },
  });
  const catMobiles = await prisma.category.upsert({
    where: { name: "Mobile Phones" },
    update: {},
    create: { name: "Mobile Phones", description: "Smartphones and feature phones", parentId: catElectronics.id },
  });
  console.log("✅ Categories seeded (8)");

  // ── 3. SUPPLIERS ────────────────────────────────────────────────────────────
  const suppliers = await Promise.all([
    prisma.supplier.upsert({ where: { code: "SUP001" }, update: {}, create: {
      name: "TechVision Pvt Ltd", code: "SUP001", contactName: "Rajesh Kumar",
      email: "rajesh@techvision.in", phone: "+91-9876543210",
      address: "12, MG Road", city: "Bangalore", country: "India",
      status: "ACTIVE", paymentTerms: 30, gstNumber: "29AABCT1332L1ZB",
      notes: "Primary electronics supplier",
    }}),
    prisma.supplier.upsert({ where: { code: "SUP002" }, update: {}, create: {
      name: "Global Office Solutions", code: "SUP002", contactName: "Priya Sharma",
      email: "priya@globalofficein", phone: "+91-9865432109",
      address: "45, Anna Salai", city: "Chennai", country: "India",
      status: "ACTIVE", paymentTerms: 45, gstNumber: "33AABCG2341M1ZA",
      notes: "Office supplies and furniture vendor",
    }}),
    prisma.supplier.upsert({ where: { code: "SUP003" }, update: {}, create: {
      name: "FashionFirst Exports", code: "SUP003", contactName: "Amit Patel",
      email: "amit@fashionfirst.com", phone: "+91-9754321098",
      address: "78, Ring Road", city: "Surat", country: "India",
      status: "ACTIVE", paymentTerms: 60, gstNumber: "24AABCF3412N1ZC",
    }}),
    prisma.supplier.upsert({ where: { code: "SUP004" }, update: {}, create: {
      name: "FreshHarvest Foods", code: "SUP004", contactName: "Sunita Reddy",
      email: "sunita@freshharvest.in", phone: "+91-9643210987",
      address: "23, APMC Yard", city: "Hyderabad", country: "India",
      status: "ACTIVE", paymentTerms: 15,
    }}),
    prisma.supplier.upsert({ where: { code: "SUP005" }, update: {}, create: {
      name: "ProTools Industries", code: "SUP005", contactName: "Vikram Mehta",
      email: "vikram@protools.co.in", phone: "+91-9532109876",
      address: "56, Industrial Area", city: "Pune", country: "India",
      status: "INACTIVE", paymentTerms: 30,
    }}),
  ]);
  console.log("✅ Suppliers seeded (5)");

  // ── 4. WAREHOUSES & ZONES ───────────────────────────────────────────────────
  const [wh1, wh2, wh3] = await Promise.all([
    prisma.warehouse.upsert({ where: { code: "WH-BLR" }, update: {}, create: {
      name: "Bangalore Central", code: "WH-BLR",
      address: "Plot 12, Bommasandra Industrial Area", city: "Bangalore", country: "India",
      phone: "+91-8023456789", email: "blr@iwms.local",
      capacity: 10000, status: "ACTIVE",
    }}),
    prisma.warehouse.upsert({ where: { code: "WH-MUM" }, update: {}, create: {
      name: "Mumbai Logistics Hub", code: "WH-MUM",
      address: "Shed 7, Bhiwandi Warehouse Complex", city: "Mumbai", country: "India",
      phone: "+91-9876543211", email: "mum@iwms.local",
      capacity: 15000, status: "ACTIVE",
    }}),
    prisma.warehouse.upsert({ where: { code: "WH-DEL" }, update: {}, create: {
      name: "Delhi Distribution Center", code: "WH-DEL",
      address: "Unit 3, Kundli Industrial Zone", city: "Delhi", country: "India",
      phone: "+91-1123456789", email: "del@iwms.local",
      capacity: 8000, status: "UNDER_MAINTENANCE",
    }}),
  ]);

  // Zones for WH1
  const [zoneA, zoneB, zoneC] = await Promise.all([
    prisma.warehouseZone.upsert({ where: { warehouseId_code: { warehouseId: wh1.id, code: "A" } }, update: {}, create: {
      warehouseId: wh1.id, name: "Zone A - Electronics", code: "A", description: "High-value electronics storage",
    }}),
    prisma.warehouseZone.upsert({ where: { warehouseId_code: { warehouseId: wh1.id, code: "B" } }, update: {}, create: {
      warehouseId: wh1.id, name: "Zone B - Furniture", code: "B", description: "Bulk furniture storage",
    }}),
    prisma.warehouseZone.upsert({ where: { warehouseId_code: { warehouseId: wh1.id, code: "C" } }, update: {}, create: {
      warehouseId: wh1.id, name: "Zone C - General", code: "C", description: "General merchandise",
    }}),
  ]);
  // Zones for WH2
  const [zoneD, zoneE] = await Promise.all([
    prisma.warehouseZone.upsert({ where: { warehouseId_code: { warehouseId: wh2.id, code: "D" } }, update: {}, create: {
      warehouseId: wh2.id, name: "Zone D - Cold Storage", code: "D", description: "Temperature controlled",
    }}),
    prisma.warehouseZone.upsert({ where: { warehouseId_code: { warehouseId: wh2.id, code: "E" } }, update: {}, create: {
      warehouseId: wh2.id, name: "Zone E - Apparel", code: "E", description: "Clothing and apparel",
    }}),
  ]);
  console.log("✅ Warehouses (3) + Zones (5) seeded");

  // ── 5. PRODUCTS ─────────────────────────────────────────────────────────────
  const productData = [
    // Electronics
    { sku: "EL-LAP-001", name: "Dell Inspiron 15 Laptop",     categoryId: catLaptops.id,     supplierId: suppliers[0].id, costPrice: 45000, sellingPrice: 55000, reorderPoint: 5,  reorderQuantity: 10, unitOfMeasure: "EACH",   weight: 2.1,  status: "ACTIVE"       as const },
    { sku: "EL-LAP-002", name: "HP Pavilion 14 Laptop",       categoryId: catLaptops.id,     supplierId: suppliers[0].id, costPrice: 38000, sellingPrice: 47000, reorderPoint: 5,  reorderQuantity: 10, unitOfMeasure: "EACH",   weight: 1.9,  status: "ACTIVE"       as const },
    { sku: "EL-MOB-001", name: "Samsung Galaxy A54",          categoryId: catMobiles.id,     supplierId: suppliers[0].id, costPrice: 18000, sellingPrice: 22000, reorderPoint: 10, reorderQuantity: 20, unitOfMeasure: "EACH",   weight: 0.2,  status: "ACTIVE"       as const },
    { sku: "EL-MOB-002", name: "Redmi Note 12 Pro",           categoryId: catMobiles.id,     supplierId: suppliers[0].id, costPrice: 14000, sellingPrice: 17500, reorderPoint: 10, reorderQuantity: 20, unitOfMeasure: "EACH",   weight: 0.19, status: "ACTIVE"       as const },
    { sku: "EL-MOB-003", name: "iPhone 14 (128GB)",           categoryId: catMobiles.id,     supplierId: suppliers[0].id, costPrice: 62000, sellingPrice: 74000, reorderPoint: 3,  reorderQuantity: 5,  unitOfMeasure: "EACH",   weight: 0.17, status: "ACTIVE"       as const },
    // Furniture
    { sku: "FU-CHR-001", name: "Ergonomic Office Chair",      categoryId: catFurniture.id,   supplierId: suppliers[1].id, costPrice: 8500,  sellingPrice: 12000, reorderPoint: 3,  reorderQuantity: 5,  unitOfMeasure: "EACH",   weight: 12.0, status: "ACTIVE"       as const },
    { sku: "FU-DSK-001", name: "Standing Desk 140cm",         categoryId: catFurniture.id,   supplierId: suppliers[1].id, costPrice: 15000, sellingPrice: 20000, reorderPoint: 2,  reorderQuantity: 5,  unitOfMeasure: "EACH",   weight: 35.0, status: "ACTIVE"       as const },
    { sku: "FU-CAB-001", name: "4-Drawer Filing Cabinet",     categoryId: catFurniture.id,   supplierId: suppliers[1].id, costPrice: 6000,  sellingPrice: 8500,  reorderPoint: 2,  reorderQuantity: 4,  unitOfMeasure: "EACH",   weight: 22.0, status: "ACTIVE"       as const },
    // Office Supplies
    { sku: "OF-PEN-001", name: "Ballpoint Pen Box (50pcs)",   categoryId: catOffice.id,      supplierId: suppliers[1].id, costPrice: 120,   sellingPrice: 200,   reorderPoint: 20, reorderQuantity: 50, unitOfMeasure: "BOX",    weight: 0.3,  status: "ACTIVE"       as const },
    { sku: "OF-PAP-001", name: "A4 Copier Paper (500 sheets)",categoryId: catOffice.id,      supplierId: suppliers[1].id, costPrice: 280,   sellingPrice: 400,   reorderPoint: 30, reorderQuantity: 100,unitOfMeasure: "REAM",   weight: 2.5,  status: "ACTIVE"       as const },
    { sku: "OF-STA-001", name: "Stapler Heavy Duty",          categoryId: catOffice.id,      supplierId: suppliers[1].id, costPrice: 350,   sellingPrice: 550,   reorderPoint: 10, reorderQuantity: 20, unitOfMeasure: "EACH",   weight: 0.5,  status: "ACTIVE"       as const },
    // Clothing
    { sku: "CL-TSH-001", name: "Cotton T-Shirt (Pack of 3)",  categoryId: catClothing.id,    supplierId: suppliers[2].id, costPrice: 450,   sellingPrice: 750,   reorderPoint: 15, reorderQuantity: 30, unitOfMeasure: "PACK",   weight: 0.4,  status: "ACTIVE"       as const },
    { sku: "CL-JNS-001", name: "Denim Jeans Regular Fit",     categoryId: catClothing.id,    supplierId: suppliers[2].id, costPrice: 800,   sellingPrice: 1400,  reorderPoint: 10, reorderQuantity: 20, unitOfMeasure: "EACH",   weight: 0.6,  status: "ACTIVE"       as const },
    { sku: "CL-JKT-001", name: "Waterproof Jacket",           categoryId: catClothing.id,    supplierId: suppliers[2].id, costPrice: 1200,  sellingPrice: 2000,  reorderPoint: 5,  reorderQuantity: 10, unitOfMeasure: "EACH",   weight: 0.8,  status: "DISCONTINUED" as const },
    // Food
    { sku: "FB-RIC-001", name: "Basmati Rice 5kg",            categoryId: catFood.id,        supplierId: suppliers[3].id, costPrice: 350,   sellingPrice: 520,   reorderPoint: 50, reorderQuantity: 100,unitOfMeasure: "BAG",    weight: 5.0,  status: "ACTIVE"       as const },
    { sku: "FB-OIL-001", name: "Sunflower Oil 1L",            categoryId: catFood.id,        supplierId: suppliers[3].id, costPrice: 110,   sellingPrice: 160,   reorderPoint: 40, reorderQuantity: 100,unitOfMeasure: "BOTTLE", weight: 1.0,  status: "ACTIVE"       as const },
    // Tools
    { sku: "TL-DRL-001", name: "Cordless Drill 18V",          categoryId: catTools.id,       supplierId: suppliers[4].id, costPrice: 3500,  sellingPrice: 5000,  reorderPoint: 3,  reorderQuantity: 5,  unitOfMeasure: "EACH",   weight: 1.8,  status: "INACTIVE"     as const },
    { sku: "TL-WRN-001", name: "Adjustable Wrench Set",       categoryId: catTools.id,       supplierId: suppliers[4].id, costPrice: 650,   sellingPrice: 950,   reorderPoint: 5,  reorderQuantity: 10, unitOfMeasure: "SET",    weight: 1.2,  status: "ACTIVE"       as const },
  ];

  const products = await Promise.all(
    productData.map((p) =>
      prisma.product.upsert({
        where: { sku: p.sku },
        update: {},
        create: {
          sku:             p.sku,
          name:            p.name,
          categoryId:      p.categoryId,
          supplierId:      p.supplierId,
          unitOfMeasure:   p.unitOfMeasure,
          costPrice:       p.costPrice,
          sellingPrice:    p.sellingPrice,
          reorderPoint:    p.reorderPoint,
          reorderQuantity: p.reorderQuantity,
          weight:          p.weight,
          status:          p.status,
        },
      })
    )
  );
  console.log(`✅ Products seeded (${products.length})`);

  // ── 6. INVENTORY STOCK ──────────────────────────────────────────────────────
  // Stock quantities per product per warehouse
  const stockData: { productIdx: number; warehouseId: string; zoneId: string | null; qty: number; reserved: number }[] = [
    // WH1 - Bangalore (Electronics zone A, Furniture zone B, General zone C)
    { productIdx: 0,  warehouseId: wh1.id, zoneId: zoneA.id, qty: 25,  reserved: 2 },
    { productIdx: 1,  warehouseId: wh1.id, zoneId: zoneA.id, qty: 18,  reserved: 1 },
    { productIdx: 2,  warehouseId: wh1.id, zoneId: zoneA.id, qty: 45,  reserved: 5 },
    { productIdx: 3,  warehouseId: wh1.id, zoneId: zoneA.id, qty: 60,  reserved: 3 },
    { productIdx: 4,  warehouseId: wh1.id, zoneId: zoneA.id, qty: 8,   reserved: 1 },
    { productIdx: 5,  warehouseId: wh1.id, zoneId: zoneB.id, qty: 12,  reserved: 0 },
    { productIdx: 6,  warehouseId: wh1.id, zoneId: zoneB.id, qty: 6,   reserved: 1 },
    { productIdx: 7,  warehouseId: wh1.id, zoneId: zoneB.id, qty: 4,   reserved: 0 },  // below reorder
    { productIdx: 8,  warehouseId: wh1.id, zoneId: zoneC.id, qty: 150, reserved: 10 },
    { productIdx: 9,  warehouseId: wh1.id, zoneId: zoneC.id, qty: 200, reserved: 15 },
    { productIdx: 10, warehouseId: wh1.id, zoneId: zoneC.id, qty: 35,  reserved: 2 },
    { productIdx: 11, warehouseId: wh1.id, zoneId: zoneC.id, qty: 80,  reserved: 5 },
    { productIdx: 12, warehouseId: wh1.id, zoneId: zoneC.id, qty: 3,   reserved: 0 },  // low stock
    { productIdx: 14, warehouseId: wh1.id, zoneId: zoneC.id, qty: 120, reserved: 8 },
    { productIdx: 15, warehouseId: wh1.id, zoneId: zoneC.id, qty: 90,  reserved: 6 },
    { productIdx: 17, warehouseId: wh1.id, zoneId: zoneC.id, qty: 15,  reserved: 1 },
    // WH2 - Mumbai (Cold Storage zone D, Apparel zone E)
    { productIdx: 2,  warehouseId: wh2.id, zoneId: zoneD.id, qty: 30,  reserved: 2 },
    { productIdx: 3,  warehouseId: wh2.id, zoneId: zoneD.id, qty: 55,  reserved: 4 },
    { productIdx: 4,  warehouseId: wh2.id, zoneId: zoneD.id, qty: 5,   reserved: 0 },
    { productIdx: 11, warehouseId: wh2.id, zoneId: zoneE.id, qty: 100, reserved: 7 },
    { productIdx: 12, warehouseId: wh2.id, zoneId: zoneE.id, qty: 2,   reserved: 0 },  // out of stock almost
    { productIdx: 14, warehouseId: wh2.id, zoneId: zoneD.id, qty: 0,   reserved: 0 },  // out of stock
    { productIdx: 15, warehouseId: wh2.id, zoneId: zoneD.id, qty: 45,  reserved: 3 },
    { productIdx: 0,  warehouseId: wh2.id, zoneId: null,     qty: 10,  reserved: 0 },
    { productIdx: 1,  warehouseId: wh2.id, zoneId: null,     qty: 8,   reserved: 0 },
  ];

  for (const s of stockData) {
    if (s.zoneId !== null) {
      await prisma.inventoryStock.upsert({
        where: {
          productId_warehouseId_zoneId: {
            productId:   products[s.productIdx]!.id,
            warehouseId: s.warehouseId,
            zoneId:      s.zoneId,
          },
        },
        update: { quantity: s.qty, reservedQty: s.reserved },
        create: {
          productId:   products[s.productIdx]!.id,
          warehouseId: s.warehouseId,
          zoneId:      s.zoneId,
          quantity:    s.qty,
          reservedQty: s.reserved,
        },
      });
    } else {
      // zoneId is null — upsert doesn't work with null in unique constraint
      const existing = await prisma.inventoryStock.findFirst({
        where: { productId: products[s.productIdx]!.id, warehouseId: s.warehouseId, zoneId: null },
      });
      if (existing) {
        await prisma.inventoryStock.update({
          where: { id: existing.id },
          data:  { quantity: s.qty, reservedQty: s.reserved },
        });
      } else {
        await prisma.inventoryStock.create({
          data: {
            productId:   products[s.productIdx]!.id,
            warehouseId: s.warehouseId,
            zoneId:      null,
            quantity:    s.qty,
            reservedQty: s.reserved,
          },
        });
      }
    }
  }
  console.log(`✅ Inventory stock seeded (${stockData.length} records)`);

  // ── 7. PURCHASE ORDERS ──────────────────────────────────────────────────────
  const poData = [
    {
      poNumber: "PO-2024-0001", supplierId: suppliers[0].id, warehouseId: wh1.id,
      status: "RECEIVED" as const, orderDate: daysAgo(90), expectedDate: daysAgo(75), receivedDate: daysAgo(70),
      items: [
        { productIdx: 0, orderedQty: 30, receivedQty: 30, unitCost: 45000 },
        { productIdx: 1, orderedQty: 20, receivedQty: 20, unitCost: 38000 },
        { productIdx: 2, orderedQty: 50, receivedQty: 50, unitCost: 18000 },
      ],
    },
    {
      poNumber: "PO-2024-0002", supplierId: suppliers[1].id, warehouseId: wh1.id,
      status: "RECEIVED" as const, orderDate: daysAgo(75), expectedDate: daysAgo(60), receivedDate: daysAgo(55),
      items: [
        { productIdx: 5,  orderedQty: 15, receivedQty: 15, unitCost: 8500  },
        { productIdx: 6,  orderedQty: 10, receivedQty: 10, unitCost: 15000 },
        { productIdx: 8,  orderedQty: 200,receivedQty: 200,unitCost: 120   },
        { productIdx: 9,  orderedQty: 300,receivedQty: 300,unitCost: 280   },
      ],
    },
    {
      poNumber: "PO-2024-0003", supplierId: suppliers[2].id, warehouseId: wh2.id,
      status: "APPROVED" as const, orderDate: daysAgo(30), expectedDate: daysAgo(10),
      items: [
        { productIdx: 11, orderedQty: 100, receivedQty: 0, unitCost: 450 },
        { productIdx: 12, orderedQty: 50,  receivedQty: 0, unitCost: 800 },
      ],
    },
    {
      poNumber: "PO-2024-0004", supplierId: suppliers[3].id, warehouseId: wh2.id,
      status: "PARTIALLY_RECEIVED" as const, orderDate: daysAgo(20), expectedDate: daysAgo(5),
      items: [
        { productIdx: 14, orderedQty: 200, receivedQty: 100, unitCost: 350 },
        { productIdx: 15, orderedQty: 150, receivedQty: 80,  unitCost: 110 },
      ],
    },
    {
      poNumber: "PO-2024-0005", supplierId: suppliers[0].id, warehouseId: wh2.id,
      status: "SUBMITTED" as const, orderDate: daysAgo(10), expectedDate: daysAgo(-15),
      items: [
        { productIdx: 3, orderedQty: 80, receivedQty: 0, unitCost: 14000 },
        { productIdx: 4, orderedQty: 10, receivedQty: 0, unitCost: 62000 },
      ],
    },
    {
      poNumber: "PO-2024-0006", supplierId: suppliers[1].id, warehouseId: wh1.id,
      status: "DRAFT" as const, orderDate: daysAgo(3),
      items: [
        { productIdx: 7,  orderedQty: 10, receivedQty: 0, unitCost: 6000 },
        { productIdx: 10, orderedQty: 50, receivedQty: 0, unitCost: 350  },
      ],
    },
    {
      poNumber: "PO-2024-0007", supplierId: suppliers[0].id, warehouseId: wh1.id,
      status: "CANCELLED" as const, orderDate: daysAgo(45), expectedDate: daysAgo(30),
      items: [
        { productIdx: 4, orderedQty: 5, receivedQty: 0, unitCost: 62000 },
      ],
    },
  ];

  const purchaseOrders: { id: string }[] = [];
  for (const po of poData) {
    const subtotal = po.items.reduce((s, i) => s + i.orderedQty * i.unitCost, 0);
    const taxAmount = Math.round(subtotal * 0.18);
    const totalAmount = subtotal + taxAmount;

    const created = await prisma.purchaseOrder.upsert({
      where: { poNumber: po.poNumber },
      update: {},
      create: {
        poNumber:    po.poNumber,
        supplierId:  po.supplierId,
        warehouseId: po.warehouseId,
        createdById: superAdmin.id,
        status:      po.status,
        orderDate:   po.orderDate,
        expectedDate:po.expectedDate ?? null,
        receivedDate:po.receivedDate ?? null,
        subtotal,
        taxAmount,
        totalAmount,
        items: {
          create: po.items.map((item) => ({
            productId:   products[item.productIdx]!.id,
            orderedQty:  item.orderedQty,
            receivedQty: item.receivedQty,
            unitCost:    item.unitCost,
            totalCost:   item.orderedQty * item.unitCost,
          })),
        },
      },
    });
    purchaseOrders.push(created);
  }
  console.log(`✅ Purchase orders seeded (${purchaseOrders.length})`);

  // ── 8. SALES ORDERS ─────────────────────────────────────────────────────────
  const soData = [
    {
      soNumber: "SO-2024-0001", warehouseId: wh1.id, customerName: "Infosys Ltd",
      customerEmail: "procurement@infosys.com", customerPhone: "+91-8023456789",
      shippingAddress: "Electronics City, Bangalore",
      status: "DELIVERED" as const,
      orderDate: daysAgo(60), requiredDate: daysAgo(50), shippedDate: daysAgo(52), deliveredDate: daysAgo(50),
      items: [
        { productIdx: 0, orderedQty: 5, shippedQty: 5, unitPrice: 55000, discountPct: 5 },
        { productIdx: 1, orderedQty: 3, shippedQty: 3, unitPrice: 47000, discountPct: 5 },
      ],
    },
    {
      soNumber: "SO-2024-0002", warehouseId: wh1.id, customerName: "TCS Mumbai Office",
      customerEmail: "admin@tcs.com", customerPhone: "+91-9876543222",
      shippingAddress: "BKC, Mumbai",
      status: "DELIVERED" as const,
      orderDate: daysAgo(45), requiredDate: daysAgo(35), shippedDate: daysAgo(38), deliveredDate: daysAgo(35),
      items: [
        { productIdx: 5,  orderedQty: 10, shippedQty: 10, unitPrice: 12000, discountPct: 10 },
        { productIdx: 6,  orderedQty: 5,  shippedQty: 5,  unitPrice: 20000, discountPct: 8  },
        { productIdx: 8,  orderedQty: 50, shippedQty: 50, unitPrice: 200,   discountPct: 0  },
      ],
    },
    {
      soNumber: "SO-2024-0003", warehouseId: wh2.id, customerName: "Reliance Retail",
      customerEmail: "orders@relianceretail.in", customerPhone: "+91-9765432100",
      shippingAddress: "Navi Mumbai Distribution",
      status: "SHIPPED" as const,
      orderDate: daysAgo(20), requiredDate: daysAgo(10), shippedDate: daysAgo(12),
      items: [
        { productIdx: 11, orderedQty: 30, shippedQty: 30, unitPrice: 750,   discountPct: 5 },
        { productIdx: 12, orderedQty: 20, shippedQty: 20, unitPrice: 1400,  discountPct: 5 },
        { productIdx: 15, orderedQty: 40, shippedQty: 40, unitPrice: 160,   discountPct: 0 },
      ],
    },
    {
      soNumber: "SO-2024-0004", warehouseId: wh1.id, customerName: "Amazon India",
      customerEmail: "vendor@amazon.in", customerPhone: "+91-9654321000",
      shippingAddress: "Fulfillment Center, Bangalore",
      status: "PROCESSING" as const,
      orderDate: daysAgo(10), requiredDate: daysAgo(-5),
      items: [
        { productIdx: 2, orderedQty: 20, shippedQty: 0, unitPrice: 22000, discountPct: 3 },
        { productIdx: 3, orderedQty: 15, shippedQty: 0, unitPrice: 17500, discountPct: 3 },
        { productIdx: 4, orderedQty: 3,  shippedQty: 0, unitPrice: 74000, discountPct: 2 },
      ],
    },
    {
      soNumber: "SO-2024-0005", warehouseId: wh1.id, customerName: "Flipkart Wholesale",
      customerEmail: "bulk@flipkart.com", customerPhone: "+91-9543210000",
      shippingAddress: "Whitefield, Bangalore",
      status: "CONFIRMED" as const,
      orderDate: daysAgo(5), requiredDate: daysAgo(-10),
      items: [
        { productIdx: 9,  orderedQty: 100, shippedQty: 0, unitPrice: 400,  discountPct: 0 },
        { productIdx: 14, orderedQty: 50,  shippedQty: 0, unitPrice: 520,  discountPct: 0 },
      ],
    },
    {
      soNumber: "SO-2024-0006", warehouseId: wh2.id, customerName: "D-Mart Retail",
      customerEmail: "purchase@dmart.in", customerPhone: "+91-9432100000",
      shippingAddress: "Thane, Mumbai",
      status: "DRAFT" as const,
      orderDate: daysAgo(2),
      items: [
        { productIdx: 14, orderedQty: 80, shippedQty: 0, unitPrice: 520,  discountPct: 5 },
        { productIdx: 15, orderedQty: 60, shippedQty: 0, unitPrice: 160,  discountPct: 3 },
      ],
    },
    {
      soNumber: "SO-2024-0007", warehouseId: wh1.id, customerName: "Meesho Supplies",
      customerEmail: "ops@meesho.com", customerPhone: "+91-9321000000",
      shippingAddress: "Koramangala, Bangalore",
      status: "CANCELLED" as const,
      orderDate: daysAgo(30), requiredDate: daysAgo(20),
      items: [
        { productIdx: 13, orderedQty: 25, shippedQty: 0, unitPrice: 2000, discountPct: 0 },
      ],
    },
    {
      soNumber: "SO-2024-0008", warehouseId: wh1.id, customerName: "HDFC Bank Office",
      customerEmail: "admin@hdfc.com", customerPhone: "+91-9210000000",
      shippingAddress: "Lower Parel, Mumbai",
      status: "DELIVERED" as const,
      orderDate: daysAgo(80), requiredDate: daysAgo(70), shippedDate: daysAgo(73), deliveredDate: daysAgo(70),
      items: [
        { productIdx: 5, orderedQty: 20, shippedQty: 20, unitPrice: 12000, discountPct: 12 },
        { productIdx: 7, orderedQty: 10, shippedQty: 10, unitPrice: 8500,  discountPct: 8  },
        { productIdx: 8, orderedQty: 100,shippedQty: 100,unitPrice: 200,   discountPct: 5  },
      ],
    },
  ];

  const salesOrders: { id: string }[] = [];
  for (const so of soData) {
    const subtotal = so.items.reduce((s, i) => {
      const disc = i.unitPrice * i.orderedQty * (i.discountPct / 100);
      return s + i.unitPrice * i.orderedQty - disc;
    }, 0);
    const discountAmount = so.items.reduce((s, i) => s + i.unitPrice * i.orderedQty * (i.discountPct / 100), 0);
    const taxAmount      = Math.round(subtotal * 0.18);
    const totalAmount    = subtotal + taxAmount;

    const created = await prisma.salesOrder.upsert({
      where: { soNumber: so.soNumber },
      update: {},
      create: {
        soNumber:        so.soNumber,
        warehouseId:     so.warehouseId,
        createdById:     admin.id,
        customerName:    so.customerName,
        customerEmail:   so.customerEmail,
        customerPhone:   so.customerPhone,
        shippingAddress: so.shippingAddress,
        status:          so.status,
        orderDate:       so.orderDate,
        requiredDate:    so.requiredDate   ?? null,
        shippedDate:     so.shippedDate    ?? null,
        deliveredDate:   so.deliveredDate  ?? null,
        subtotal:        Math.round(subtotal),
        taxAmount:       taxAmount,
        discountAmount:  Math.round(discountAmount),
        totalAmount:     Math.round(totalAmount),
        items: {
          create: so.items.map((item) => {
            const disc      = item.unitPrice * item.orderedQty * (item.discountPct / 100);
            const totalPrice= item.unitPrice * item.orderedQty - disc;
            return {
              productId:   products[item.productIdx]!.id,
              orderedQty:  item.orderedQty,
              shippedQty:  item.shippedQty,
              unitPrice:   item.unitPrice,
              discountPct: item.discountPct,
              totalPrice:  Math.round(totalPrice),
            };
          }),
        },
      },
    });
    salesOrders.push(created);
  }
  console.log(`✅ Sales orders seeded (${salesOrders.length})`);

  // ── 9. INVENTORY TRANSACTIONS ───────────────────────────────────────────────
  const txnData = [
    { productIdx: 0,  warehouseId: wh1.id, type: "PURCHASE_RECEIPT" as const,  qty: 30, before: 0,   after: 30,  daysBack: 70, poIdx: 0 },
    { productIdx: 1,  warehouseId: wh1.id, type: "PURCHASE_RECEIPT" as const,  qty: 20, before: 0,   after: 20,  daysBack: 70, poIdx: 0 },
    { productIdx: 2,  warehouseId: wh1.id, type: "PURCHASE_RECEIPT" as const,  qty: 50, before: 0,   after: 50,  daysBack: 70, poIdx: 0 },
    { productIdx: 5,  warehouseId: wh1.id, type: "PURCHASE_RECEIPT" as const,  qty: 15, before: 0,   after: 15,  daysBack: 55, poIdx: 1 },
    { productIdx: 0,  warehouseId: wh1.id, type: "SALES_ISSUE" as const,       qty: 5,  before: 30,  after: 25,  daysBack: 50, soIdx: 0 },
    { productIdx: 1,  warehouseId: wh1.id, type: "SALES_ISSUE" as const,       qty: 3,  before: 20,  after: 17,  daysBack: 50, soIdx: 0 },
    { productIdx: 5,  warehouseId: wh1.id, type: "SALES_ISSUE" as const,       qty: 10, before: 15,  after: 5,   daysBack: 38, soIdx: 1 },
    { productIdx: 2,  warehouseId: wh1.id, type: "ADJUSTMENT_IN" as const,     qty: 5,  before: 40,  after: 45,  daysBack: 30 },
    { productIdx: 9,  warehouseId: wh1.id, type: "ADJUSTMENT_OUT" as const,    qty: 10, before: 210, after: 200, daysBack: 25 },
    { productIdx: 14, warehouseId: wh2.id, type: "DAMAGE_WRITE_OFF" as const,  qty: 20, before: 20,  after: 0,   daysBack: 20 },
    { productIdx: 12, warehouseId: wh1.id, type: "SALES_ISSUE" as const,       qty: 27, before: 30,  after: 3,   daysBack: 15, soIdx: 2 },
    { productIdx: 11, warehouseId: wh2.id, type: "SALES_ISSUE" as const,       qty: 30, before: 130, after: 100, daysBack: 12, soIdx: 2 },
    { productIdx: 0,  warehouseId: wh2.id, type: "TRANSFER_IN" as const,       qty: 10, before: 0,   after: 10,  daysBack: 10 },
    { productIdx: 3,  warehouseId: wh1.id, type: "PURCHASE_RECEIPT" as const,  qty: 20, before: 40,  after: 60,  daysBack: 8  },
    { productIdx: 8,  warehouseId: wh1.id, type: "SALES_ISSUE" as const,       qty: 50, before: 200, after: 150, daysBack: 7,  soIdx: 1 },
    { productIdx: 15, warehouseId: wh1.id, type: "ADJUSTMENT_IN" as const,     qty: 10, before: 80,  after: 90,  daysBack: 5  },
    { productIdx: 2,  warehouseId: wh2.id, type: "PURCHASE_RECEIPT" as const,  qty: 30, before: 0,   after: 30,  daysBack: 3  },
    { productIdx: 17, warehouseId: wh1.id, type: "RETURN_IN" as const,         qty: 5,  before: 10,  after: 15,  daysBack: 2  },
  ];

  for (const txn of txnData) {
    const existing = await prisma.inventoryTransaction.findFirst({
      where: {
        productId: products[txn.productIdx]!.id,
        type:      txn.type,
        quantity:  txn.qty,
        quantityBefore: txn.before,
      },
    });
    if (!existing) {
      await prisma.inventoryTransaction.create({
        data: {
          productId:         products[txn.productIdx]!.id,
          destWarehouseId:   ["PURCHASE_RECEIPT","TRANSFER_IN","ADJUSTMENT_IN","RETURN_IN"].includes(txn.type) ? txn.warehouseId : null,
          sourceWarehouseId: ["SALES_ISSUE","TRANSFER_OUT","ADJUSTMENT_OUT","DAMAGE_WRITE_OFF"].includes(txn.type) ? txn.warehouseId : null,
          purchaseOrderId:   txn.poIdx !== undefined ? purchaseOrders[txn.poIdx]?.id ?? null : null,
          salesOrderId:      txn.soIdx !== undefined ? salesOrders[txn.soIdx]?.id ?? null : null,
          performedById:     invClerk.id,
          type:              txn.type,
          quantity:          txn.qty,
          quantityBefore:    txn.before,
          quantityAfter:     txn.after,
          createdAt:         daysAgo(txn.daysBack),
        },
      });
    }
  }
  console.log(`✅ Inventory transactions seeded (${txnData.length})`);

  // ── 10. STOCK ALERTS ────────────────────────────────────────────────────────
  const alertsData = [
    { productIdx: 12, warehouseId: wh1.id, type: "LOW_STOCK"    as const, status: "OPEN"         as const, threshold: 10, currentQty: 3,   msg: "Cotton T-Shirt stock is critically low at Bangalore Central" },
    { productIdx: 7,  warehouseId: wh1.id, type: "LOW_STOCK"    as const, status: "OPEN"         as const, threshold: 2,  currentQty: 4,   msg: "Filing Cabinet approaching reorder point" },
    { productIdx: 14, warehouseId: wh2.id, type: "OUT_OF_STOCK" as const, status: "OPEN"         as const, threshold: 0,  currentQty: 0,   msg: "Basmati Rice is out of stock at Mumbai Logistics Hub" },
    { productIdx: 12, warehouseId: wh2.id, type: "LOW_STOCK"    as const, status: "ACKNOWLEDGED" as const, threshold: 10, currentQty: 2,   msg: "Denim Jeans stock low at Mumbai warehouse" },
    { productIdx: 4,  warehouseId: wh1.id, type: "LOW_STOCK"    as const, status: "OPEN"         as const, threshold: 3,  currentQty: 8,   msg: "iPhone 14 stock below reorder point" },
    { productIdx: 9,  warehouseId: wh1.id, type: "OVERSTOCK"    as const, status: "RESOLVED"     as const, threshold: 500,currentQty: 200, msg: "A4 Paper overstock resolved after bulk sale" },
  ];

  for (const alert of alertsData) {
    const exists = await prisma.stockAlert.findFirst({
      where: { productId: products[alert.productIdx]!.id, type: alert.type, status: alert.status },
    });
    if (!exists) {
      await prisma.stockAlert.create({
        data: {
          productId:        products[alert.productIdx]!.id,
          warehouseId:      alert.warehouseId,
          type:             alert.type,
          status:           alert.status,
          threshold:        alert.threshold,
          currentQuantity:  alert.currentQty,
          message:          alert.msg,
          acknowledgedById: alert.status === "ACKNOWLEDGED" ? whManager.id : null,
          acknowledgedAt:   alert.status === "ACKNOWLEDGED" ? daysAgo(5)  : null,
          resolvedAt:       alert.status === "RESOLVED"     ? daysAgo(3)  : null,
          createdAt:        daysAgo(rand(1, 15)),
        },
      });
    }
  }
  console.log(`✅ Stock alerts seeded (${alertsData.length})`);

  // ── 11. AUDIT LOGS ──────────────────────────────────────────────────────────
  const auditEntries = [
    { userId: superAdmin.id, action: "LOGIN"  as const, resource: "User",          resourceId: superAdmin.id, daysBack: 1  },
    { userId: admin.id,      action: "LOGIN"  as const, resource: "User",          resourceId: admin.id,      daysBack: 2  },
    { userId: superAdmin.id, action: "CREATE" as const, resource: "Warehouse",     resourceId: wh1.id,        daysBack: 91, newValues: { name: "Bangalore Central", code: "WH-BLR" } },
    { userId: superAdmin.id, action: "CREATE" as const, resource: "Warehouse",     resourceId: wh2.id,        daysBack: 90, newValues: { name: "Mumbai Logistics Hub", code: "WH-MUM" } },
    { userId: admin.id,      action: "CREATE" as const, resource: "Supplier",      resourceId: suppliers[0].id, daysBack: 85, newValues: { name: "TechVision Pvt Ltd" } },
    { userId: admin.id,      action: "CREATE" as const, resource: "Supplier",      resourceId: suppliers[1].id, daysBack: 84, newValues: { name: "Global Office Solutions" } },
    { userId: admin.id,      action: "CREATE" as const, resource: "Product",       resourceId: products[0].id,  daysBack: 82, newValues: { sku: "EL-LAP-001", name: "Dell Inspiron 15 Laptop" } },
    { userId: admin.id,      action: "CREATE" as const, resource: "Product",       resourceId: products[2].id,  daysBack: 82, newValues: { sku: "EL-MOB-001", name: "Samsung Galaxy A54" } },
    { userId: superAdmin.id, action: "CREATE" as const, resource: "PurchaseOrder", resourceId: purchaseOrders[0]?.id, daysBack: 90, newValues: { poNumber: "PO-2024-0001" } },
    { userId: admin.id,      action: "UPDATE" as const, resource: "PurchaseOrder", resourceId: purchaseOrders[0]?.id, daysBack: 70, oldValues: { status: "SUBMITTED" }, newValues: { status: "RECEIVED" } },
    { userId: admin.id,      action: "CREATE" as const, resource: "SalesOrder",    resourceId: salesOrders[0]?.id,    daysBack: 60, newValues: { soNumber: "SO-2024-0001" } },
    { userId: admin.id,      action: "UPDATE" as const, resource: "SalesOrder",    resourceId: salesOrders[0]?.id,    daysBack: 50, oldValues: { status: "CONFIRMED" }, newValues: { status: "DELIVERED" } },
    { userId: whManager.id,  action: "UPDATE" as const, resource: "Product",       resourceId: products[13].id,       daysBack: 40, oldValues: { status: "ACTIVE" }, newValues: { status: "DISCONTINUED" } },
    { userId: invClerk.id,   action: "UPDATE" as const, resource: "InventoryStock",resourceId: products[2].id,        daysBack: 30, oldValues: { quantity: 40 }, newValues: { quantity: 45 } },
    { userId: admin.id,      action: "CREATE" as const, resource: "SalesOrder",    resourceId: salesOrders[3]?.id,    daysBack: 10, newValues: { soNumber: "SO-2024-0004" } },
    { userId: superAdmin.id, action: "UPDATE" as const, resource: "Supplier",      resourceId: suppliers[4].id,       daysBack: 8,  oldValues: { status: "ACTIVE" }, newValues: { status: "INACTIVE" } },
    { userId: admin.id,      action: "EXPORT" as const, resource: "Report",        daysBack: 5,  newValues: { report: "inventory", format: "CSV" } },
    { userId: superAdmin.id, action: "DELETE" as const, resource: "Category",      daysBack: 3,  oldValues: { name: "Old Category" } },
    { userId: whManager.id,  action: "LOGIN"  as const, resource: "User",          resourceId: whManager.id,   daysBack: 1 },
    { userId: invClerk.id,   action: "LOGOUT" as const, resource: "User",          resourceId: invClerk.id,    daysBack: 1 },
  ];

  for (const entry of auditEntries) {
    await prisma.auditLog.create({
      data: {
        userId:     entry.userId,
        action:     entry.action,
        resource:   entry.resource,
        resourceId: entry.resourceId ?? null,
        oldValues:  entry.oldValues ? (entry.oldValues as Prisma.InputJsonValue) : undefined,
        newValues:  entry.newValues ? (entry.newValues as Prisma.InputJsonValue) : undefined,
        ipAddress:  "192.168.1." + rand(1, 50),
        userAgent:  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0",
        createdAt:  daysAgo(entry.daysBack),
      },
    });
  }
  console.log(`✅ Audit logs seeded (${auditEntries.length})`);

  // ── SUMMARY ──────────────────────────────────────────────────────────────────
  console.log("\n🎉 All seed data created successfully!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Login Credentials (all use password: Admin@12345)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  SUPER_ADMIN       admin@iwms.local");
  console.log("  ADMIN             manager@iwms.local");
  console.log("  WAREHOUSE_MANAGER wh.manager@iwms.local");
  console.log("  INVENTORY_CLERK   clerk@iwms.local");
  console.log("  VIEWER            viewer@iwms.local");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
