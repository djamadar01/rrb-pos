import { authenticator } from "otplib";
import qrcode from "qrcode";
import { prisma } from "./prisma";

/**
 * Validates a TOTP token against a user's secret
 */
export async function verifyTOTP(userId: string, token: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpSecret: true }
  });

  if (!user || !user.totpSecret) return false;
  
  return authenticator.verify({ token, secret: user.totpSecret });
}

export async function generateSecret(email: string) {
  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(email, "RRB Fast Food", secret);
  const qrCodeUrl = await qrcode.toDataURL(otpauth);
  
  return { secret, qrCodeUrl };
}
