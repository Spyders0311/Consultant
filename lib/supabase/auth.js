export function getUserRole(user) {
  return user?.app_metadata?.role || user?.user_metadata?.role || null;
}

export function getUserTenantId(user) {
  return user?.app_metadata?.tenant_id || user?.user_metadata?.tenant_id || null;
}

export function isConsultant(user) {
  const role = getUserRole(user);
  return typeof role === 'string' && role.toLowerCase() === 'consultant';
}
