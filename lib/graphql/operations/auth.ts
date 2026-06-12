import { gql } from "@apollo/client";

// ─── Fragments ────────────────────────────────────────────────────────────────

export const USER_FIELDS = gql`
  fragment UserFields on User {
    id
    email
    firstName
    lastName
    fullName
    role
    isActive
    createdAt
    updatedAt
  }
`;

export const AUTH_TOKENS_FIELDS = gql`
  fragment AuthTokensFields on AuthTokens {
    accessToken
    refreshToken
  }
`;

// ─── Queries ──────────────────────────────────────────────────────────────────

export const ME_QUERY = gql`
  ${USER_FIELDS}
  query Me {
    me { ...UserFields }
  }
`;

export const GET_USER = gql`
  ${USER_FIELDS}
  query GetUser($id: ID!) {
    user(id: $id) { ...UserFields }
  }
`;

export const GET_USERS = gql`
  ${USER_FIELDS}
  query GetUsers($filter: UsersFilterInput, $pagination: PaginationInput) {
    users(filter: $filter, pagination: $pagination) {
      nodes { ...UserFields }
      pageInfo {
        totalCount
        totalPages
        currentPage
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

// ─── Mutations ────────────────────────────────────────────────────────────────

export const LOGIN_MUTATION = gql`
  ${USER_FIELDS}
  ${AUTH_TOKENS_FIELDS}
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      user   { ...UserFields }
      tokens { ...AuthTokensFields }
    }
  }
`;

export const REGISTER_MUTATION = gql`
  ${USER_FIELDS}
  ${AUTH_TOKENS_FIELDS}
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      user   { ...UserFields }
      tokens { ...AuthTokensFields }
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout($refreshToken: String!) {
    logout(refreshToken: $refreshToken)
  }
`;

export const REFRESH_TOKEN_MUTATION = gql`
  ${AUTH_TOKENS_FIELDS}
  mutation RefreshToken($token: String!) {
    refreshToken(token: $token) { ...AuthTokensFields }
  }
`;

export const UPDATE_PROFILE_MUTATION = gql`
  ${USER_FIELDS}
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) { ...UserFields }
  }
`;

export const CHANGE_PASSWORD_MUTATION = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input)
  }
`;

export const REVOKE_ALL_SESSIONS_MUTATION = gql`
  mutation RevokeAllSessions {
    revokeAllSessions
  }
`;

export const UPDATE_USER_ROLE_MUTATION = gql`
  ${USER_FIELDS}
  mutation UpdateUserRole($input: UpdateUserRoleInput!) {
    updateUserRole(input: $input) { ...UserFields }
  }
`;

export const DEACTIVATE_USER_MUTATION = gql`
  ${USER_FIELDS}
  mutation DeactivateUser($userId: ID!) {
    deactivateUser(userId: $userId) { ...UserFields }
  }
`;

export const ACTIVATE_USER_MUTATION = gql`
  ${USER_FIELDS}
  mutation ActivateUser($userId: ID!) {
    activateUser(userId: $userId) { ...UserFields }
  }
`;
