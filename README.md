# Smart Inventory & Warehouse Management System

A modern enterprise-level Inventory & Warehouse Management System built using **Next.js 15**, **TypeScript**, **PostgreSQL**, **Prisma**, and **GraphQL**.

This application helps organizations efficiently manage products, warehouses, suppliers, purchase orders, sales orders, inventory transactions, stock alerts, and business analytics through a centralized dashboard.

---

## Project Overview

The Smart Inventory & Warehouse Management System is designed to streamline inventory operations and warehouse management processes.

The system provides real-time inventory visibility, supplier management, order processing, stock monitoring, reporting, and audit tracking, helping businesses improve operational efficiency and reduce inventory-related issues.

---

## Features

### Authentication & Authorization

* User Registration
* Secure Login & Logout
* JWT Authentication
* Password Hashing
* Role-Based Access Control

### Product Management

* Create Products
* Update Products
* Delete Products
* Product Categories
* SKU Management
* Product Search & Filtering

### Warehouse Management

* Multiple Warehouse Support
* Warehouse Capacity Management
* Product Allocation
* Warehouse Tracking

### Supplier Management

* Supplier Registration
* Supplier Information Management
* Purchase History Tracking

### Purchase Order Management

* Create Purchase Orders
* Approve Purchase Orders
* Receive Inventory
* Order Status Tracking

### Sales Order Management

* Create Sales Orders
* Customer Information Management
* Automatic Inventory Deduction
* Order Tracking

### Inventory Tracking

* Real-Time Inventory Monitoring
* Inventory Transactions
* Stock Movement History
* Incoming & Outgoing Stock Tracking

### Stock Alert System

* Low Stock Alerts
* Out-of-Stock Notifications
* Inventory Threshold Monitoring

### Dashboard & Analytics

* Total Products
* Total Warehouses
* Total Suppliers
* Total Orders
* Inventory Statistics
* Business Analytics

### Reports

* Inventory Reports
* Sales Reports
* Supplier Reports
* Warehouse Reports
* CSV Export
* Excel Export

### Audit Logs

* User Activity Tracking
* Inventory Change Logs
* Order Activity Logs
* System Audit Records

---

## Technology Stack

### Frontend

* Next.js 15
* TypeScript
* Tailwind CSS
* Apollo Client

### Backend

* GraphQL
* Next.js Route Handlers

### Database

* PostgreSQL
* Prisma ORM

### Authentication

* JWT Authentication
* bcrypt Password Hashing

---

## System Modules

1. Authentication & Authorization
2. Product Management
3. Warehouse Management
4. Supplier Management
5. Purchase Order Management
6. Sales Order Management
7. Inventory Tracking
8. Stock Alert System
9. Dashboard & Analytics
10. Reports Management
11. Audit Logs
12. User & Role Management

---

## Database Models

* Users
* Roles
* Products
* Categories
* Warehouses
* Suppliers
* Purchase Orders
* Purchase Order Items
* Sales Orders
* Sales Order Items
* Inventory Transactions
* Stock Alerts
* Audit Logs

---

## Key Business Workflow

Supplier
→ Purchase Order
→ Warehouse
→ Inventory
→ Sales Order
→ Customer

The system automatically updates inventory quantities and maintains transaction records throughout the workflow.

---

## Security Features

* JWT Authentication
* Role-Based Authorization
* Protected Routes
* Secure Password Storage
* Input Validation
* GraphQL Authorization Guards

---

## Project Goals

* Improve inventory visibility
* Reduce stock shortages
* Simplify warehouse operations
* Automate inventory workflows
* Generate business insights
* Maintain audit trails
* Support scalable business operations

---

## Installation

```bash
git clone <repository-url>

cd inventory-warehouse-management-system

npm install

npm run dev
```

### Environment Variables

Create a `.env` file:

```env
DATABASE_URL=
JWT_SECRET=
NEXTAUTH_SECRET=
```

---

## Future Enhancements

* Barcode Integration
* QR Code Tracking
* Email Notifications
* Multi-Warehouse Analytics
* AI-Based Demand Forecasting
* Mobile Application
* Real-Time Notifications

---

## Authors

Jagadeesh R ,Indra Priyadharshini V(Team Novatrix)

Full Stack Development

Built with Next.js, TypeScript, PostgreSQL, Prisma, and GraphQL.
