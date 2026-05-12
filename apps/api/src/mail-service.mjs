import nodemailer from "nodemailer"

export function createMailService(config) {
  const provider = config.mail.provider

  if (provider === "console") {
    return {
      async sendVerificationEmail({ email, verifyUrl, locale }) {
        console.log(
          `[mail:console] verify ${locale} ${email} -> ${verifyUrl}`
        )
      },
    }
  }

  if (provider === "smtp") {
    const { host, port, secure, user, password } = config.mail.smtp

    if (!host || !user || !password) {
      throw new Error(
        "SMTP_HOST, SMTP_USER and SMTP_PASSWORD are required when LIFTBOOK_EMAIL_PROVIDER=smtp"
      )
    }

    const transport = nodemailer.createTransport({
      auth: {
        pass: password,
        user,
      },
      host,
      port,
      secure,
    })

    return {
      async sendVerificationEmail({ email, verifyUrl, locale }) {
        const subject =
          locale === "ru"
            ? "Подтвердите почту в Liftbook"
            : "Confirm your Liftbook email"
        const text =
          locale === "ru"
            ? `Подтвердите почту для Liftbook: ${verifyUrl}`
            : `Confirm your email for Liftbook: ${verifyUrl}`
        const html =
          locale === "ru"
            ? `<p>Подтвердите почту для Liftbook.</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`
            : `<p>Confirm your email for Liftbook.</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`

        await transport.sendMail({
          from: `${config.mail.fromName} <${config.mail.fromEmail}>`,
          html,
          subject,
          text,
          to: email,
        })
      },
    }
  }

  throw new Error(`Unsupported email provider: ${provider}`)
}
