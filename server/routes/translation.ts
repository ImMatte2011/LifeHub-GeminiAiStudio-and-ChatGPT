import { Router, Response } from 'express';
import { translationCacheService } from '../services/translationCache.js';
import { AuthenticatedRequest, requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// POST /api/translate
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { texts, text, targetLang = 'it', sourceLang } = req.body;

    if (Array.isArray(texts)) {
      const results = await translationCacheService.translateBatch(texts, targetLang);
      return res.json({ success: true, results, targetLang });
    }

    if (typeof text === 'string') {
      const result = await translationCacheService.translateText(text, targetLang, sourceLang);
      return res.json({
        success: true,
        original: text,
        translated: result.text,
        cached: result.cached,
        targetLang,
      });
    }

    return res.status(400).json({ error: 'Provide text (string) or texts (array of strings)' });
  } catch (err: any) {
    console.error('Translation route error:', err);
    return res.status(500).json({ error: err.message || 'Internal translation error' });
  }
});

// GET /api/translate/stats
router.get('/stats', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = translationCacheService.getCacheStats();
    return res.json({ success: true, stats });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/translate/cache (Admin)
router.delete('/cache', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    translationCacheService.clearCache();
    return res.json({ success: true, message: 'Translation temporary cache file cleared' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
