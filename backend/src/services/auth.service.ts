import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '@/models/user.model.js';
import { env } from '@/config.js';
import { createId } from '@/utils/id.js';
import { HttpError } from '@/utils/httpError.js';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function signAccessToken(payload: TokenPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function signRefreshToken(payload: TokenPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}

export class AuthService {
  async register(name: string, email: string, password: string, school = '') {
    const existing = await UserModel.findOne({ email });
    if (existing) throw new HttpError(409, 'Email already in use');

    const passwordHash = await bcrypt.hash(password, 12);
    const externalId = createId('usr');

    const user = await UserModel.create({ externalId, name, email, passwordHash, school });
    const payload: TokenPayload = { userId: user.externalId, email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    user.refreshToken = refreshToken;
    await user.save();

    return { user: this.sanitize(user), accessToken, refreshToken };
  }

  async login(email: string, password: string) {
    const user = await UserModel.findOne({ email });
    if (!user) throw new HttpError(401, 'Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new HttpError(401, 'Invalid credentials');

    const payload: TokenPayload = { userId: user.externalId, email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    user.refreshToken = refreshToken;
    await user.save();

    return { user: this.sanitize(user), accessToken, refreshToken };
  }

  async refresh(token: string) {
    let payload: TokenPayload;
    try {
      payload = verifyToken(token);
    } catch {
      throw new HttpError(401, 'Invalid refresh token');
    }

    const user = await UserModel.findOne({ externalId: payload.userId, refreshToken: token });
    if (!user) throw new HttpError(401, 'Refresh token revoked');

    const newPayload: TokenPayload = { userId: user.externalId, email: user.email, role: user.role };
    const accessToken = signAccessToken(newPayload);
    return { accessToken };
  }

  async logout(userId: string) {
    await UserModel.findOneAndUpdate({ externalId: userId }, { refreshToken: '' });
  }

  async getMe(userId: string) {
    const user = await UserModel.findOne({ externalId: userId });
    if (!user) throw new HttpError(404, 'User not found');
    return this.sanitize(user);
  }

  private sanitize(user: InstanceType<typeof UserModel>) {
    const obj = user.toObject();
    const { passwordHash: _ph, refreshToken: _rt, ...safe } = obj as Record<string, unknown>;
    return safe;
  }
}

export const authService = new AuthService();
