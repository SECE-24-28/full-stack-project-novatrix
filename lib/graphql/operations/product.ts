import { gql } from "@apollo/client";

// ─── Fragments ────────────────────────────────────────────────────────────────

export const CATEGORY_FIELDS = gql`
  fragment CategoryFields on Category {
    id name description parentId productCount createdAt updatedAt
    parent { id name }
  }
`;

export const PRODUCT_FIELDS = gql`
  fragment ProductFields on Product {
    id sku name description
    unitOfMeasure costPrice sellingPrice
    reorderPoint reorderQuantity
    weight barcode imageUrl status
    createdAt updatedAt
    category { id name description }
    supplier  { id name code }
    stockSummary { totalQuantity reservedQty availableQty }
  }
`;

// ─── Category queries ─────────────────────────────────────────────────────────

export const GET_CATEGORIES = gql`
  ${CATEGORY_FIELDS}
  query GetCategories($parentId: ID, $pagination: PaginationInput) {
    categories(parentId: $parentId, pagination: $pagination) {
      nodes    { ...CategoryFields children { id name } }
      pageInfo { totalCount totalPages currentPage hasNextPage hasPreviousPage }
    }
  }
`;

export const GET_CATEGORY = gql`
  ${CATEGORY_FIELDS}
  query GetCategory($id: ID!) {
    category(id: $id) { ...CategoryFields children { id name } }
  }
`;

// ─── Product queries ──────────────────────────────────────────────────────────

export const GET_PRODUCTS = gql`
  ${PRODUCT_FIELDS}
  query GetProducts($filter: ProductsFilterInput, $pagination: PaginationInput) {
    products(filter: $filter, pagination: $pagination) {
      nodes    { ...ProductFields }
      pageInfo { totalCount totalPages currentPage hasNextPage hasPreviousPage }
    }
  }
`;

export const GET_PRODUCT = gql`
  ${PRODUCT_FIELDS}
  query GetProduct($id: ID!) {
    product(id: $id) { ...ProductFields }
  }
`;

export const GET_PRODUCT_BY_SKU = gql`
  ${PRODUCT_FIELDS}
  query GetProductBySku($sku: String!) {
    productBySku(sku: $sku) { ...ProductFields }
  }
`;

// ─── Product mutations ────────────────────────────────────────────────────────

export const CREATE_PRODUCT = gql`
  ${PRODUCT_FIELDS}
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) { ...ProductFields }
  }
`;

export const UPDATE_PRODUCT = gql`
  ${PRODUCT_FIELDS}
  mutation UpdateProduct($input: UpdateProductInput!) {
    updateProduct(input: $input) { ...ProductFields }
  }
`;

export const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
  }
`;

// ─── Category mutations ───────────────────────────────────────────────────────

export const CREATE_CATEGORY = gql`
  ${CATEGORY_FIELDS}
  mutation CreateCategory($input: CreateCategoryInput!) {
    createCategory(input: $input) { ...CategoryFields }
  }
`;

export const UPDATE_CATEGORY = gql`
  ${CATEGORY_FIELDS}
  mutation UpdateCategory($input: UpdateCategoryInput!) {
    updateCategory(input: $input) { ...CategoryFields }
  }
`;

export const DELETE_CATEGORY = gql`
  mutation DeleteCategory($id: ID!) {
    deleteCategory(id: $id)
  }
`;
