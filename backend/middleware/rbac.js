/**
 * Role-Based Access Control middleware.
 *
 * Roles supported (string match on req.user.role):
 *   admin     — full access
 *   nurse     — clinical PHI: full read/write on medical data
 *   caregiver — assigned-patient read/write on care/activities/notes
 *   family    — read-only access scoped to family-linked patient(s)
 *
 * Usage:
 *   router.post('/x', auth, requireRole('admin', 'nurse'), handler)
 *   router.get('/x', auth, requireRole('any'), handler)
 */

const ROLE_HIERARCHY = {
  admin: 4,
  nurse: 3,
  caregiver: 2,
  family: 1
};

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user?.role || 'caregiver';
    if (allowedRoles.includes('any')) return next();
    if (allowedRoles.includes(userRole)) return next();
    return res.status(403).json({
      error: 'Insufficient permissions',
      required: allowedRoles,
      actual: userRole
    });
  };
}

/**
 * Read-only enforcement for family role: blocks POST/PUT/PATCH/DELETE on PHI routes.
 */
function familyReadOnly(req, res, next) {
  const role = req.user?.role;
  if (role === 'family' && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return res.status(403).json({ error: 'Family role is read-only' });
  }
  next();
}

/**
 * Returns true if userRole has at least the privilege of minRole.
 */
function hasMinRole(userRole, minRole) {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[minRole] || 0);
}

module.exports = { requireRole, familyReadOnly, hasMinRole, ROLE_HIERARCHY };
