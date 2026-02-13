/**
 * 邮件服务工具（开发环境模拟）
 * 生产环境可替换为真实的邮件服务（如 Nodemailer、SendGrid 等）
 */

/**
 * 发送邮箱验证邮件
 * @param email 收件人邮箱
 * @param token 验证令牌
 * @param appName 应用名称
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  appName: string = "AI Keyboard"
): Promise<void> {
  const verificationUrl = `${process.env.APP_URL || "http://localhost:3000"}/verify-email?token=${token}`;

  console.log(`
📧 邮箱验证邮件（开发环境模拟）
────────────────────────────────
收件人: ${email}
应用: ${appName}
验证链接: ${verificationUrl}
────────────────────────────────
生产环境请配置真实的邮件服务
`);

  // TODO: 生产环境集成真实邮件服务
  // 示例（使用 Nodemailer）:
  // await transporter.sendMail({
  //   from: process.env.EMAIL_FROM,
  //   to: email,
  //   subject: `[${appName}] 请验证您的邮箱`,
  //   html: verificationEmailTemplate(verificationUrl, appName),
  // });
}

/**
 * 发送密码重置邮件
 * @param email 收件人邮箱
 * @param token 重置令牌
 * @param appName 应用名称
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  appName: string = "AI Keyboard"
): Promise<void> {
  const resetUrl = `${process.env.APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;

  console.log(`
📧 密码重置邮件（开发环境模拟）
────────────────────────────────
收件人: ${email}
应用: ${appName}
重置链接: ${resetUrl}
链接有效时间: 1 小时
────────────────────────────────
生产环境请配置真实的邮件服务
`);

  // TODO: 生产环境集成真实邮件服务
}

/**
 * 邮件发送配置检查
 * 在应用启动时调用，提醒配置邮件服务
 */
export function checkEmailConfig(): void {
  if (!process.env.EMAIL_SERVICE && process.env.NODE_ENV === "production") {
    console.warn(`
⚠️  邮件服务未配置
────────────────────────────────
生产环境需要配置邮件服务以支持：
• 邮箱验证
• 密码重置
• 重要通知

请设置以下环境变量：
• EMAIL_SERVICE (如 "gmail", "sendgrid")
• EMAIL_USER / EMAIL_PASS
• EMAIL_FROM (发件人地址)
• APP_URL (应用基础URL)
────────────────────────────────
    `);
  }
}