declare module 'nodemailer' {
  export interface TransporterOptions {
    host?: string
    port?: number
    secure?: boolean
    auth?: { user?: string; pass?: string }
    [key: string]: any
  }

  export interface SendMailOptions {
    from?: string
    to?: string
    subject?: string
    html?: string
    text?: string
    [key: string]: any
  }

  export interface SentMessageInfo {
    messageId?: string
    [key: string]: any
  }

  export class Transporter {
    sendMail(mailOptions: SendMailOptions): Promise<SentMessageInfo>
    close(): Promise<void>
    [key: string]: any
  }

  export function createTransport(options: TransporterOptions | string): Transporter
  export default { createTransport }
}
