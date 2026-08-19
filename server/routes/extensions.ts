import { Router } from 'express';
import { ExtensionManager } from '../services/extensionManager.js';
import { AuthenticatedRequest, requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// List all registered technical extensions
router.get('/', requireAuth, (req: AuthenticatedRequest, res) => {
  return res.json(ExtensionManager.listExtensions());
});

// Full Diagnostic Report
router.get('/diagnostics', requireAuth, (req: AuthenticatedRequest, res) => {
  return res.json(ExtensionManager.getDiagnosticReport());
});

// Toggle an extension (Admin)
router.post('/:code/toggle', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { enabled } = req.body;
  const userId = req.userId || 'user_admin';
  try {
    const updated = ExtensionManager.toggleExtension(
      req.params.code,
      Boolean(enabled),
      userId
    );
    return res.json({
      success: true,
      extension: updated,
      diagnostic: ExtensionManager.getDiagnosticReport(),
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;
