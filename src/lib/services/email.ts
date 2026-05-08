import nodemailer from "nodemailer";

export interface SendPriceAlertOptions {
  to: string;
  productTitle: string;
  currentPrice: number;
  targetPrice: number;
  sourceUrl: string | null;
}

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  label: string;
}

const jpyNumberFormatter = new Intl.NumberFormat("ja-JP");
const smtpTimeoutMs = 8000;

function getSmtpConfigs(): SmtpConfig[] | null {
  const host = process.env.SMTP_HOST;
  const defaultPort = host && isGmailHost(host) ? 465 : 587;
  const port = parseInt(process.env.SMTP_PORT ?? String(defaultPort), 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !Number.isFinite(port) || !user || !pass) {
    return null;
  }

  const primary = createSmtpConfig(host, port, user, pass);
  const configs = [primary];

  if (isGmailHost(host) && port === 587) {
    configs.push(createSmtpConfig(host, 465, user, pass));
  }

  return configs;
}

function createSmtpConfig(host: string, port: number, user: string, pass: string): SmtpConfig {
  return {
    host,
    port,
    secure: port === 465,
    user,
    pass,
    label: `${host}:${port}`,
  };
}

function createTransporter(config: SmtpConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: !config.secure,
    connectionTimeout: smtpTimeoutMs,
    greetingTimeout: smtpTimeoutMs,
    socketTimeout: smtpTimeoutMs,
    tls: {
      servername: config.host,
    },
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

function isGmailHost(host: string) {
  return host.toLowerCase() === "smtp.gmail.com";
}

function formatJPY(value: number) {
  return `JPY ${jpyNumberFormatter.format(value)}`;
}

function buildEmailSubject(options: SendPriceAlertOptions) {
  return `【到價通知】${options.productTitle} 現在 ${formatJPY(options.currentPrice)}`;
}

function buildEmailHtml(options: SendPriceAlertOptions) {
  const productLink = options.sourceUrl
    ? `<a href="${options.sourceUrl}"
           style="display:inline-block;margin-top:20px;background:#b91c1c;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600">
          前往 Mercari 查看商品
        </a>`
    : `<p style="margin-top:20px;font-size:13px;color:#71717a">此商品目前沒有可用的 Mercari 連結。</p>`;

  return `
    <div style="font-family:sans-serif;max-width:520px;margin:auto;border:1px solid #e4e4e7;border-radius:8px;overflow:hidden">
      <div style="background:#b91c1c;padding:16px 24px">
        <h1 style="color:#fff;margin:0;font-size:18px">Mercari_price_tracker 到價通知</h1>
      </div>
      <div style="padding:24px">
        <p style="margin:0 0 12px;font-size:15px;color:#09090b">
          您追蹤的商品已達到目標價格：
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;color:#3f3f46">
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #f4f4f5;color:#71717a;width:120px">商品名稱</td>
            <td style="padding:8px 0;border-bottom:1px solid #f4f4f5;font-weight:600;color:#09090b">${options.productTitle}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #f4f4f5;color:#71717a">目前價格</td>
            <td style="padding:8px 0;border-bottom:1px solid #f4f4f5;font-weight:700;color:#b91c1c;font-size:18px">${formatJPY(options.currentPrice)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#71717a">您的目標價</td>
            <td style="padding:8px 0;color:#09090b">${formatJPY(options.targetPrice)}</td>
          </tr>
        </table>
        ${productLink}
        <p style="margin-top:24px;font-size:12px;color:#a1a1aa">
          此通知由 Mercari_price_tracker 自動發送，請勿直接回覆此信件。
        </p>
      </div>
    </div>
  `;
}

async function sendViaResend(
  options: SendPriceAlertOptions,
  subject: string,
  html: string,
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY!;
  const from = process.env.RESEND_FROM?.trim() || "onboarding@resend.dev";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Mercari Price Tracker <${from}>`,
        to: [options.to],
        subject,
        html,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { message?: string };
      return { sent: false, error: `Resend API 錯誤 ${res.status}：${body.message ?? res.statusText}` };
    }

    return { sent: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { sent: false, error: `Resend 連線失敗：${message}` };
  }
}

export async function sendPriceAlert(options: SendPriceAlertOptions): Promise<{ sent: boolean; error?: string }> {
  const subject = buildEmailSubject(options);
  const html = buildEmailHtml(options);

  if (process.env.RESEND_API_KEY) {
    return sendViaResend(options, subject, html);
  }

  const configs = getSmtpConfigs();

  if (!configs) {
    return {
      sent: false,
      error: "Email 未設定：請在 .env.local 填入 RESEND_API_KEY（推薦，不受防火牆影響）或完整 SMTP 設定（SMTP_HOST / SMTP_USER / SMTP_PASS）。",
    };
  }

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "no-reply@example.com";
  const errors: string[] = [];

  for (const config of configs) {
    const transporter = createTransporter(config);

    try {
      await transporter.sendMail({
        from: `"Mercari Price Tracker" <${from}>`,
        to: options.to,
        subject,
        html,
      });
      return { sent: true };
    } catch (err: unknown) {
      const message = normalizeSmtpError(err, config);
      errors.push(message);

      if (!shouldTryNextSmtpConfig(err, config, configs)) {
        return { sent: false, error: message };
      }
    }
  }

  return { sent: false, error: errors.join("；") };
}

function shouldTryNextSmtpConfig(err: unknown, config: SmtpConfig, configs: SmtpConfig[]) {
  return configs.length > 1 && config.port === 587 && isConnectionTimeout(err);
}

function isConnectionTimeout(err: unknown) {
  if (!err || typeof err !== "object") return false;
  const candidate = err as { code?: string; command?: string };
  return candidate.code === "ETIMEDOUT" || candidate.code === "ECONNECTION" || candidate.code === "ESOCKET";
}

function normalizeSmtpError(err: unknown, config: SmtpConfig) {
  const message = err instanceof Error ? err.message : String(err);

  if (isConnectionTimeout(err)) {
    return `${config.label} 連線逾時（SMTP 被防火牆封鎖）。建議改用 Resend：在 .env.local 設定 RESEND_API_KEY，免費申請：https://resend.com。原始錯誤：${message}`;
  }

  return `${config.label} 寄信失敗：${message}`;
}
