import { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../errors';
import { requireAuth } from '../middleware/auth.middleware';
import { answerAiQuestion, getMonthlyAiInsights, parseNaturalLanguageTransaction } from '../services/ai.service';

const router = Router();
router.use(requireAuth);

const textSchema = z.object({ text: z.string().trim().min(1).max(2000) });
const validationError = (result: { success: false; error: z.ZodError }) =>
  new ApiError(400, 'VALIDATION_ERROR', 'Nội dung AI không hợp lệ.', result.error.flatten());

router.post('/parse-transaction', async (req, res, next) => {
  try {
    const parsed = textSchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed);
    const transaction = await parseNaturalLanguageTransaction(req.user!.id, parsed.data.text);
    res.json({ data: transaction });
  } catch (error) { next(error); }
});

router.post('/chat', async (req, res, next) => {
  try {
    const parsed = textSchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed);
    res.json({ data: await answerAiQuestion(req.user!.id, parsed.data.text) });
  } catch (error) { next(error); }
});

router.get('/insights', async (req, res, next) => {
  try {
    const month = typeof req.query.month === 'string' ? req.query.month : undefined;
    try {
      res.json({ data: await getMonthlyAiInsights(req.user!.id, month) });
    } catch (error: any) {
      if (error?.message === 'INVALID_MONTH') throw new ApiError(400, 'INVALID_MONTH', 'Tháng phải có định dạng YYYY-MM.');
      throw error;
    }
  } catch (error) { next(error); }
});

export default router;
