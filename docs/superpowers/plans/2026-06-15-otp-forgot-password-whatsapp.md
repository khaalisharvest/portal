# OTP Forgot Password — Email + WhatsApp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current reset-link flow with a 6-digit OTP sent via Brevo email (for users with email) or WhatsApp Cloud API (for phone-only users), plus a reusable WhatsApp notification service for order confirmations and status updates.

**Architecture:** The existing `resetToken`/`resetTokenExpiry` columns on the `users` table are reused to store the 6-digit OTP (no migration needed). `AuthService.forgotPassword()` generates the OTP and routes it to the right channel. `AuthService.resetPassword()` now accepts `{ otp, newPassword }`. A new `WhatsAppService` wraps the Meta Cloud API and is designed for reuse across order notifications.

**Tech Stack:** NestJS (backend), Next.js App Router (frontend/BFF), TypeORM (DB), nodemailer + Brevo SMTP (email), Meta WhatsApp Business Cloud API via `fetch` (WhatsApp)

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `apps/backend/src/modules/notifications/whatsapp.service.ts` | **Create** | Meta Cloud API wrapper — OTP, order confirmation, status update |
| `apps/backend/src/modules/notifications/notifications.module.ts` | **Modify** | Export WhatsAppService globally |
| `apps/backend/src/config/env.ts` | **Modify** | Add WHATSAPP_* optional env vars |
| `apps/backend/src/modules/auth/auth.service.ts` | **Modify** | forgotPassword → OTP; resetPassword → validate OTP |
| `apps/backend/src/modules/auth/dto/reset-password.dto.ts` | **Modify** | Replace `token` field with `otp` (6-digit string) |
| `apps/backend/src/modules/users/users.service.ts` | **Modify** | Add `findByOtp()` method |
| `.env` (root, symlinked to backend) | **Modify** | Add WHATSAPP_* credentials |
| `apps/web/src/app/auth/forgot-password/page.tsx` | **Modify** | Show OTP channel info + redirect to reset page |
| `apps/web/src/app/auth/reset-password/page.tsx` | **Modify** | OTP entry + new password in one screen |

---

## Task 1: Add WhatsApp Env Vars

**Files:**
- Modify: `apps/backend/src/config/env.ts`
- Modify: `.env`
- Modify: `.env.example`

- [ ] **Step 1: Add vars to env.ts**

In `apps/backend/src/config/env.ts`, add to the `env` export object after `SMTP_PASS`:

```typescript
  // WhatsApp Cloud API — optional, absent = log to console only
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
  WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
  WHATSAPP_OTP_TEMPLATE_NAME: process.env.WHATSAPP_OTP_TEMPLATE_NAME || 'khaalis_otp',
  WHATSAPP_ORDER_TEMPLATE_NAME: process.env.WHATSAPP_ORDER_TEMPLATE_NAME || 'khaalis_order_confirmation',
  WHATSAPP_STATUS_TEMPLATE_NAME: process.env.WHATSAPP_STATUS_TEMPLATE_NAME || 'khaalis_order_status',
```

Also add to the destructured export at the bottom:
```typescript
  WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN,
  WHATSAPP_OTP_TEMPLATE_NAME, WHATSAPP_ORDER_TEMPLATE_NAME, WHATSAPP_STATUS_TEMPLATE_NAME,
```

- [ ] **Step 2: Add vars to .env**

In `.env` (root file), after the SMTP block add:

```env
# ===========================================
# WHATSAPP — Meta Cloud API (optional — logs to console if absent)
# Register at developers.facebook.com → WhatsApp → API Setup
# ===========================================
WHATSAPP_PHONE_NUMBER_ID=1121899301017438
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_OTP_TEMPLATE_NAME=khaalis_otp
WHATSAPP_ORDER_TEMPLATE_NAME=khaalis_order_confirmation
WHATSAPP_STATUS_TEMPLATE_NAME=khaalis_order_status
```

Leave `WHATSAPP_ACCESS_TOKEN` blank for now (permanent token not generated yet).

- [ ] **Step 3: Document in .env.example**

After the SMTP block in `.env.example`:

```env
# WhatsApp Cloud API — optional, messages logged to console when absent
# developers.facebook.com → your app → WhatsApp → API Setup
WHATSAPP_PHONE_NUMBER_ID=           # OPTIONAL — Phone Number ID from Meta dashboard
WHATSAPP_ACCESS_TOKEN=              # OPTIONAL — System User permanent token
WHATSAPP_OTP_TEMPLATE_NAME=khaalis_otp
WHATSAPP_ORDER_TEMPLATE_NAME=khaalis_order_confirmation
WHATSAPP_STATUS_TEMPLATE_NAME=khaalis_order_status
```

- [ ] **Step 4: Verify backend starts without errors**

```bash
cd apps/backend && npx tsc --noEmit 2>&1 | head -20
```

Expected: no output (clean).

---

## Task 2: Create WhatsApp Service

**Files:**
- Create: `apps/backend/src/modules/notifications/whatsapp.service.ts`

- [ ] **Step 1: Create the service**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { env } from '../../config/env';

interface WaTextParam { type: 'text'; text: string }
interface WaComponent { type: 'body' | 'button'; sub_type?: string; index?: string; parameters: WaTextParam[] }

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly apiBase = 'https://graph.facebook.com/v20.0';

  private get configured(): boolean {
    return !!(env.WHATSAPP_PHONE_NUMBER_ID && env.WHATSAPP_ACCESS_TOKEN);
  }

  private formatPhone(phone: string): string {
    // Strip + prefix — Meta requires E.164 without +
    return phone.replace(/^\+/, '');
  }

  private maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7) return phone;
    return `+${digits.slice(0, 4)}***${digits.slice(-4)}`;
  }

  async sendTemplate(
    phone: string,
    templateName: string,
    languageCode: string,
    components: WaComponent[],
  ): Promise<boolean> {
    const recipient = this.formatPhone(phone);

    if (!this.configured) {
      this.logger.log(
        `[WA DEV] To: ${this.maskPhone(phone)} | Template: ${templateName} | Params: ${JSON.stringify(components)}`,
      );
      return true;
    }

    try {
      const res = await fetch(
        `${this.apiBase}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: recipient,
            type: 'template',
            template: { name: templateName, language: { code: languageCode }, components },
          }),
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        this.logger.error(`WA send failed → ${this.maskPhone(phone)}: ${JSON.stringify(err)}`);
        return false;
      }

      this.logger.log(`WA sent → ${this.maskPhone(phone)} [${templateName}]`);
      return true;
    } catch (err: any) {
      this.logger.error(`WA network error → ${this.maskPhone(phone)}: ${err.message}`);
      return false;
    }
  }

  async sendOtp(phone: string, otp: string): Promise<boolean> {
    return this.sendTemplate(phone, env.WHATSAPP_OTP_TEMPLATE_NAME, 'en', [
      {
        type: 'body',
        parameters: [{ type: 'text', text: otp }],
      },
      {
        type: 'button',
        sub_type: 'url',
        index: '0',
        parameters: [{ type: 'text', text: otp }],
      },
    ]);
  }

  async sendOrderConfirmation(
    phone: string,
    orderNumber: string,
    total: number,
    paymentMethod: string,
  ): Promise<boolean> {
    const totalFormatted = `PKR ${Number(total).toLocaleString('en-PK')}`;
    const paymentLabel =
      paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' :
      paymentMethod === 'bank_transfer'    ? 'Bank Transfer'    : paymentMethod;

    return this.sendTemplate(phone, env.WHATSAPP_ORDER_TEMPLATE_NAME, 'en', [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: orderNumber },
          { type: 'text', text: totalFormatted },
          { type: 'text', text: paymentLabel },
        ],
      },
    ]);
  }

  async sendOrderStatusUpdate(
    phone: string,
    orderNumber: string,
    status: string,
  ): Promise<boolean> {
    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
    return this.sendTemplate(phone, env.WHATSAPP_STATUS_TEMPLATE_NAME, 'en', [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: orderNumber },
          { type: 'text', text: statusLabel },
        ],
      },
    ]);
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/backend && npx tsc --noEmit 2>&1 | head -20
```

Expected: no output.

---

## Task 3: Export WhatsAppService from NotificationsModule

**Files:**
- Modify: `apps/backend/src/modules/notifications/notifications.module.ts`

- [ ] **Step 1: Update module**

Replace the entire file content:

```typescript
import { Module, Global } from '@nestjs/common';
import { EmailService } from './email.service';
import { WhatsAppService } from './whatsapp.service';

@Global()
@Module({
  providers: [EmailService, WhatsAppService],
  exports: [EmailService, WhatsAppService],
})
export class NotificationsModule {}
```

- [ ] **Step 2: Verify**

```bash
cd apps/backend && npx tsc --noEmit 2>&1 | head -20
```

Expected: no output.

---

## Task 4: Add findByOtp to UsersService

**Files:**
- Modify: `apps/backend/src/modules/users/users.service.ts`

- [ ] **Step 1: Add method after `findByResetToken`**

After the existing `findByResetToken` method (line ~256), add:

```typescript
  async findByOtp(otp: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.resetToken')
      .addSelect('user.resetTokenExpiry')
      .where('user.resetToken = :otp', { otp })
      .getOne();
  }
```

- [ ] **Step 2: Verify**

```bash
cd apps/backend && npx tsc --noEmit 2>&1 | head -20
```

Expected: no output.

---

## Task 5: Update ResetPasswordDto

**Files:**
- Modify: `apps/backend/src/modules/auth/dto/reset-password.dto.ts`

- [ ] **Step 1: Replace token with otp**

Replace the entire file:

```typescript
import { IsString, MinLength, Matches, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: '847291', description: '6-digit OTP sent via email or WhatsApp' })
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP must be 6 numeric digits' })
  otp: string;

  @ApiProperty({ example: 'NewSecurePass1' })
  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  newPassword: string;
}
```

- [ ] **Step 2: Verify**

```bash
cd apps/backend && npx tsc --noEmit 2>&1 | head -20
```

Expected: no output.

---

## Task 6: Update AuthService — forgotPassword + resetPassword

**Files:**
- Modify: `apps/backend/src/modules/auth/auth.service.ts`

- [ ] **Step 1: Inject WhatsAppService**

At the top of the file, add import:

```typescript
import { WhatsAppService } from '../notifications/whatsapp.service';
```

Update the constructor:

```typescript
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private whatsAppService: WhatsAppService,
  ) {}
```

- [ ] **Step 2: Replace forgotPassword method**

Replace the entire `forgotPassword` method:

```typescript
  async forgotPassword(identifier: string): Promise<{ message: string; channel?: string; maskedContact?: string }> {
    const normalizedId = identifier.includes('@')
      ? identifier.trim().toLowerCase()
      : normalizePhoneForDatabase(identifier);

    const user = identifier.includes('@')
      ? await this.usersService.findByEmail(normalizedId)
      : await this.usersService.findByPhone(normalizedId);

    if (!user) {
      // Security: don't reveal whether the account exists
      return { message: 'If an account exists, a reset code has been sent.' };
    }

    // Generate 6-digit numeric OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await this.usersService.setResetToken(user.id, otp, expiry);

    let channel: 'email' | 'whatsapp' = 'email';
    let maskedContact = '';

    if (user.email) {
      // Send OTP via email
      channel = 'email';
      maskedContact = user.email.replace(/(.{2})[^@]*(@.*)/, '$1***$2');

      const html = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
        <div style="background:#3d7a2e;padding:24px 28px">
          <h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:700">Khaalis Harvest</h1>
          <p style="color:#a8d5a2;margin:4px 0 0;font-size:13px">The Pure Embrace of Nature</p>
        </div>
        <div style="padding:32px 28px">
          <h2 style="color:#111827;margin:0 0 8px;font-size:22px;font-weight:700">Password Reset Code</h2>
          <p style="color:#6b7280;margin:0 0 24px;font-size:15px;line-height:1.6">Use the code below to reset your password. It expires in <strong>15 minutes</strong>.</p>
          <div style="background:#f0fdf4;border:2px solid #3d7a2e;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
            <p style="margin:0 0 4px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:1px">Your reset code</p>
            <p style="margin:0;font-size:40px;font-weight:800;color:#3d7a2e;letter-spacing:8px">${otp}</p>
          </div>
          <p style="color:#9ca3af;font-size:13px;margin:0;line-height:1.6">If you didn't request this, you can safely ignore this email.</p>
        </div>
        <div style="background:#f9fafb;padding:16px 28px;border-top:1px solid #e5e7eb">
          <p style="color:#9ca3af;font-size:12px;margin:0">Khaalis Harvest · Pakistan's organic marketplace</p>
        </div>
      </div>`;

      await this.emailService.send(user.email, 'Your Khaalis Harvest Reset Code', html);
    } else {
      // Phone-only user — send OTP via WhatsApp
      channel = 'whatsapp';
      const digits = user.phone.replace(/\D/g, '');
      maskedContact = `+${digits.slice(0, 4)}***${digits.slice(-4)}`;

      await this.whatsAppService.sendOtp(user.phone, otp);
    }

    this.logger.log(`Password reset OTP sent via ${channel} to ${maskedContact}`);
    return { message: 'If an account exists, a reset code has been sent.', channel, maskedContact };
  }
```

- [ ] **Step 3: Replace resetPassword method**

Find the existing `resetPassword` method and replace it:

```typescript
  async resetPassword(otp: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.usersService.findByOtp(otp);

    if (!user || !user.resetToken || !user.resetTokenExpiry) {
      throw new UnauthorizedException('Invalid or expired reset code.');
    }

    if (new Date() > user.resetTokenExpiry) {
      await this.usersService.setResetToken(user.id, null, null);
      throw new UnauthorizedException('Reset code has expired. Please request a new one.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(user.id, hashedPassword);

    return { message: 'Password reset successfully.' };
  }
```

- [ ] **Step 4: Verify**

```bash
cd apps/backend && npx tsc --noEmit 2>&1 | head -20
```

Expected: no output.

---

## Task 7: Update Auth Controller (resetPassword call signature)

**Files:**
- Modify: `apps/backend/src/modules/auth/auth.controller.ts`

- [ ] **Step 1: Check and update resetPassword handler**

Read the current resetPassword handler. It will pass `dto.token` to `authService.resetPassword()`. Change it to pass `dto.otp`:

Find the `resetPassword` handler. It likely looks like:
```typescript
@Post('reset-password')
async resetPassword(@Body() dto: ResetPasswordDto) {
  return this.authService.resetPassword(dto.token, dto.newPassword);
}
```

Change `dto.token` → `dto.otp`:
```typescript
@Post('reset-password')
@Throttle({ default: { limit: 5, ttl: 300000 } })
async resetPassword(@Body() dto: ResetPasswordDto) {
  return this.authService.resetPassword(dto.otp, dto.newPassword);
}
```

- [ ] **Step 2: Verify**

```bash
cd apps/backend && npx tsc --noEmit 2>&1 | head -20
```

Expected: no output.

---

## Task 8: Update Forgot Password Frontend Page

**Files:**
- Modify: `apps/web/src/app/auth/forgot-password/page.tsx`

- [ ] **Step 1: Replace the page**

Replace the entire file:

```tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      const data = await res.json();
      if (res.status >= 500) {
        toast.error('Server error. Please try again later.');
        return;
      }
      // Navigate to reset page with channel info (always navigate even if account not found — security)
      const params = new URLSearchParams();
      if (data.channel)       params.set('channel', data.channel);
      if (data.maskedContact) params.set('contact', data.maskedContact);
      router.push(`/auth/reset-password?${params.toString()}`);
    } catch {
      toast.error('Connection error. Please check your internet and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-neutral-50 min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-neutral-100 p-8">
        <div className="mb-7">
          <div className="flex items-center gap-4 mb-1.5">
            <div className="w-14 h-14 relative flex-shrink-0">
              <Image src="/images/logo.png" alt="Khaalis Harvest" fill className="object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">Forgot Password</h1>
          </div>
          <p className="text-neutral-500 text-sm">Enter your phone number or email — we'll send you a reset code</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Phone or Email</label>
            <input
              type="text"
              placeholder="03001234567 or your@email.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="input-field"
            />
          </div>
          <button type="submit" disabled={isLoading} className="w-full btn-primary disabled:opacity-50">
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Sending code…
              </span>
            ) : 'Send Reset Code'}
          </button>
        </form>
        <p className="text-center mt-5 text-sm text-neutral-400">
          Remembered it?{' '}
          <Link href="/auth/login" className="text-primary-600 font-medium hover:text-primary-700 transition-colors">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -20
```

Expected: no output.

---

## Task 9: Update Reset Password Frontend Page

**Files:**
- Modify: `apps/web/src/app/auth/reset-password/page.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
'use client';
import { useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import ProductLoader from '@/components/ui/ProductLoader';

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const channel = searchParams.get('channel') || 'email';
  const maskedContact = searchParams.get('contact') || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const otpValue = otp.join('');
  const passwordMismatch = confirm.length > 0 && confirm !== password;

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const next = [...otp];
    next[index] = value.slice(-1); // one digit per box
    setOtp(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
      e.preventDefault();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.length !== 6) { toast.error('Please enter the full 6-digit code'); return; }
    if (password.length < 8)   { toast.error('Password must be at least 8 characters'); return; }
    if (password !== confirm)  { toast.error('Passwords do not match'); return; }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otpValue, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Reset failed');
      toast.success('Password reset successfully! Please sign in.');
      router.push('/auth/login');
    } catch (err: any) {
      toast.error(err.message || 'Code may have expired. Request a new one.');
    } finally {
      setIsLoading(false);
    }
  };

  const channelIcon = channel === 'whatsapp'
    ? 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347'
    : 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z';

  return (
    <div className="bg-neutral-50 min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-neutral-100 p-8">
        <div className="mb-7">
          <div className="flex items-center gap-4 mb-1.5">
            <div className="w-14 h-14 relative flex-shrink-0">
              <Image src="/images/logo.png" alt="Khaalis Harvest" fill className="object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">Reset Password</h1>
          </div>

          {maskedContact ? (
            <div className="flex items-center gap-2 mt-2 p-3 bg-primary-50 border border-primary-100 rounded-xl">
              <svg className="w-4 h-4 text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d={channelIcon} />
              </svg>
              <p className="text-sm text-primary-700">
                Code sent to <span className="font-semibold">{maskedContact}</span> via {channel === 'whatsapp' ? 'WhatsApp' : 'email'}
              </p>
            </div>
          ) : (
            <p className="text-neutral-500 text-sm mt-1">Enter the 6-digit code and your new password</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* OTP boxes */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">6-Digit Reset Code</label>
            <div className="flex gap-2 justify-between" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  className={`w-12 h-12 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all
                    ${digit ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-neutral-200 text-neutral-900'}
                    focus:border-primary-500 focus:ring-2 focus:ring-primary-100`}
                />
              ))}
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">New Password</label>
            <input
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              className="input-field"
            />
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Confirm Password</label>
            <input
              type="password"
              placeholder="Repeat new password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              className={`input-field ${passwordMismatch ? 'input-error' : ''}`}
            />
            {passwordMismatch && (
              <p className="mt-1 text-xs text-error-600">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || otpValue.length !== 6 || passwordMismatch}
            className="w-full btn-primary disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Resetting…
              </span>
            ) : 'Reset Password'}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm">
          <Link href="/auth/forgot-password" className="text-neutral-400 hover:text-neutral-600 transition-colors">
            Didn't receive a code?
          </Link>
          <Link href="/auth/login" className="text-primary-600 font-medium hover:text-primary-700 transition-colors">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <ProductLoader size="md" />
      </div>
    }>
      <ResetForm />
    </Suspense>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -20
```

Expected: no output.

---

## Task 10: End-to-End Smoke Test

- [ ] **Step 1: Start the backend**

```bash
cd apps/backend && npm run start:dev
```

Expected: `Email service ready with SMTP` and no errors.

- [ ] **Step 2: Test forgot-password with email account**

```bash
curl -s -X POST http://localhost:3000/api/v1/auth/forgot-password \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"your-registered-email@gmail.com"}' | jq .
```

Expected response:
```json
{
  "message": "If an account exists, a reset code has been sent.",
  "channel": "email",
  "maskedContact": "yo***@gmail.com"
}
```
Check your inbox — a code email should arrive.

- [ ] **Step 3: Test forgot-password with phone-only account**

```bash
curl -s -X POST http://localhost:3000/api/v1/auth/forgot-password \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"03001234567"}' | jq .
```

Expected: `"channel": "whatsapp"` in response. Backend console shows `[WA DEV]` log with the OTP (since token not set yet).

- [ ] **Step 4: Test reset-password with OTP**

Take the OTP from the email or backend console log and:

```bash
curl -s -X POST http://localhost:3000/api/v1/auth/reset-password \
  -H 'Content-Type: application/json' \
  -d '{"otp":"847291","newPassword":"NewPass123"}' | jq .
```

Expected:
```json
{ "message": "Password reset successfully." }
```

- [ ] **Step 5: Test with wrong OTP**

```bash
curl -s -X POST http://localhost:3000/api/v1/auth/reset-password \
  -H 'Content-Type: application/json' \
  -d '{"otp":"000000","newPassword":"NewPass123"}' | jq .
```

Expected: `401 Unauthorized` with `"Invalid or expired reset code."`

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: OTP-based forgot password via email (Brevo) + WhatsApp Cloud API

- 6-digit OTP replaces token link flow (reuses resetToken/resetTokenExpiry columns)
- Email channel: branded HTML email via Brevo SMTP
- WhatsApp channel: Meta Cloud API for phone-only users, logs to console when unconfigured
- Reusable WhatsAppService with sendOtp(), sendOrderConfirmation(), sendOrderStatusUpdate()
- 6-box OTP input UI with paste support and auto-advance
- Frontend shows which channel was used and masked contact"
```

---

## After Meta Approves Your Account

1. Create the `khaalis_otp` Authentication template in Meta dashboard (WhatsApp → Message Templates)
2. Generate a permanent System User token (business.facebook.com → Settings → Users → System Users)
3. Add to `.env`:
   ```env
   WHATSAPP_ACCESS_TOKEN=<permanent-system-user-token>
   ```
4. Restart backend — WhatsApp OTP will now send automatically to phone-only users

## For Order Confirmation Notifications (Future)

In `OrdersService`, inject `WhatsAppService` and call:

```typescript
await this.whatsAppService.sendOrderConfirmation(
  user.phone,
  order.orderNumber,
  order.totalAmount,
  order.paymentMethod,
);
```

Create a `khaalis_order_confirmation` utility template in Meta dashboard first (also fast-approved).
