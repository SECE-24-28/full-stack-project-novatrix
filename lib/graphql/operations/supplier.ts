import { gql } from "@apollo/client";

export const SUPPLIER_FIELDS = gql`
  fragment SupplierFields on Supplier {
    id code name contactName email phone address city country
    gstNumber status paymentTerms notes productCount createdAt updatedAt
  }
`;

export const SUPPLIER_WITH_HISTORY = gql`
  ${SUPPLIER_FIELDS}
  fragment SupplierWithHistory on Supplier {
    ...SupplierFields
    purchaseHistory {
      id poNumber status totalAmount orderDate
    }
  }
`;

export const GET_SUPPLIERS = gql`
  ${SUPPLIER_FIELDS}
  query GetSuppliers($filter: SuppliersFilterInput, $pagination: PaginationInput) {
    suppliers(filter: $filter, pagination: $pagination) {
      nodes    { ...SupplierFields }
      pageInfo { totalCount totalPages currentPage hasNextPage hasPreviousPage }
    }
  }
`;

export const GET_SUPPLIER = gql`
  ${SUPPLIER_WITH_HISTORY}
  query GetSupplier($id: ID!) {
    supplier(id: $id) { ...SupplierWithHistory }
  }
`;

export const CREATE_SUPPLIER = gql`
  ${SUPPLIER_FIELDS}
  mutation CreateSupplier($input: CreateSupplierInput!) {
    createSupplier(input: $input) { ...SupplierFields }
  }
`;

export const UPDATE_SUPPLIER = gql`
  ${SUPPLIER_FIELDS}
  mutation UpdateSupplier($input: UpdateSupplierInput!) {
    updateSupplier(input: $input) { ...SupplierFields }
  }
`;

export const DELETE_SUPPLIER = gql`
  mutation DeleteSupplier($id: ID!) {
    deleteSupplier(id: $id)
  }
`;
