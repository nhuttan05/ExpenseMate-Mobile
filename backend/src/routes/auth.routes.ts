import { Router } from 'express';
import { z } from 'zod';
import { createTokens, getUserById, loginUser, registerUser, revokeRefreshToken, verifyRefreshToken } from '../auth';
import { ApiError } from '../errors';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
const credentialsSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
});
const registerSchema = credentialsSchema.extend({ name: z.string().trim().min(2).max(120) });
const refreshSchema = z.object({ refreshToken: z.string().min(1) });

const validationError = (result: { success: false; error: z.ZodError }) =>
  new ApiError(400, 'VALIDATION_ERROR', 'Dữ liệu đầu vào không hợp lệ.', result.error.flatten());

router.post('/register', async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed);
    const user = await registerUser(parsed.data.name, parsed.data.email, parsed.data.password);
    const tokens = await createTokens(user);
    res.status(201).json({ data: { user, ...tokens } });
  } catch (error) { next(error); }
});

router.post('/login', async (req, res, next) => {
  try {
    const parsed = credentialsSchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed);
    const user = await loginUser(parsed.data.email, parsed.data.password);
    const tokens = await createTokens(user);
    res.json({ data: { user, ...tokens } });
  } catch (error) { next(error); }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed);
    const user = await verifyRefreshToken(parsed.data.refreshToken);
    await revokeRefreshToken(parsed.data.refreshToken);
    const tokens = await createTokens(user);
    res.json({ data: tokens });
  } catch (error) { next(error); }
});

router.post('/logout', async (req, res, next) => {
  try {
    const parsed = refreshSchema.safeParse(req.body);
    if (parsed.success) await revokeRefreshToken(parsed.data.refreshToken);
    res.status(204).send();
  } catch (error) { next(error); }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await getUserById(req.user!.id);
    res.json({ data: user });
  } catch (error) { next(error); }
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const parsed = z.object({ email: z.string().trim().email() }).safeParse(req.body);
    if (!parsed.success) throw validationError(parsed);
    // Email delivery will be added later. Do not reveal whether an email exists.
    res.json({ data: { message: 'Nếu email tồn tại, hướng dẫn khôi phục sẽ được gửi đến hộp thư.' } });
  } catch (error) { next(error); }
});

export default router;
