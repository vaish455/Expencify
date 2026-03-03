export const getRoleName = (role) => {
  if (typeof role === 'string') return role;
  if (role && typeof role === 'object') return role.name || '';
  return '';
};
