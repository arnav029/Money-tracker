// Supabase "Send SMS" auth hook — relays the OTP Supabase generates through MSG91
// instead of a built-in provider. Deploy with: supabase functions deploy send-sms-hook
// Configure the hook URL + this function's signing secret under
// Authentication -> Hooks -> Send SMS hook in the Supabase dashboard.
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'

const authKey = Deno.env.get('MSG91_AUTHKEY')
const templateId = Deno.env.get('MSG91_TEMPLATE_ID')
// Must match the variable name used in your DLT-approved template, e.g. ##OTP##.
const otpVariable = Deno.env.get('MSG91_OTP_VARIABLE') ?? 'OTP'

type HookPayload = {
  user: { phone: string }
  sms: { otp: string }
}

async function sendOtpSms(phone: string, otp: string): Promise<{ type: string; message?: string }> {
  if (!authKey || !templateId) {
    throw new Error('MSG91_AUTHKEY or MSG91_TEMPLATE_ID is not set')
  }

  const response = await fetch('https://control.msg91.com/api/v5/flow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authkey: authKey
    },
    body: JSON.stringify({
      template_id: templateId,
      short_url: '0',
      recipients: [
        {
          mobiles: phone,
          [otpVariable]: otp
        }
      ]
    })
  })

  return response.json()
}

Deno.serve(async (req) => {
  try {
    const payload = await req.text()
    const secret = Deno.env.get('SEND_SMS_HOOK_SECRET')!.replace('v1,whsec_', '')
    const headers = Object.fromEntries(req.headers)
    const wh = new Webhook(secret)

    const { user, sms } = wh.verify(payload, headers) as HookPayload

    const result = await sendOtpSms(user.phone, sms.otp)

    if (result.type !== 'success') {
      return new Response(JSON.stringify({ error: result.message ?? 'MSG91 send failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
