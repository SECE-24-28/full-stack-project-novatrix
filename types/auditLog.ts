export interface AuditUser {
  id:        string;
  firstName: string;
  lastName:  string;
  email:     string;
  role:      string;
}

export interface AuditLogEntry {
  id:         string;
  action:     "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "EXPORT";
  resource:   string;
  resourceId: string | null;
  oldValues:  Record<string, unknown> | null;
  newValues:  Record<string, unknown> | null;
  ipAddress:  string | null;
  userAgent:  string | null;
  createdAt:  string;
  user:       AuditUser | null;
}

export interface AuditLogStats {
  total:      number;
  byAction:   { label: string; count: number }[];
  byResource: { label: string; count: number }[];
}

export interface AuditLogFilter {
  search?:   string;
  action?:   string;
  resource?: string;
  userId?:   string;
  dateFrom?: string;
  dateTo?:   string;
}
