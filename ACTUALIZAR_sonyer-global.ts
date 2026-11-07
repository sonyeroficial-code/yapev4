/**
 * SONYER GLOBAL - API de autocompletado y guardado.
 * El HTML envía el Firebase Auth ID Token de login-48d79 o loginv3-a7e62.
 * Esta función comprueba su firma, emisor, audiencia y aprobación del usuario
 * antes de consultar o escribir con la clave secreta del SERVIDOR.
 *
 * Requiere configurar el secreto SONYER_SUPABASE_SECRET_KEY (nuevo, no el filtrado).
 * Deploy con verify_jwt=false: esta función verifica el JWT de Firebase por sí misma.
 */
import { createRemoteJWKSet, jwtVerify } from 'jsr:@panva/jose@6'

// Dos aplicaciones Firebase, sin abrir las tablas al público.
const FIREBASE_PROJECTS = ['login-48d79', 'loginv3-a7e62'] as const
const allowedProjects = new Set<string>(FIREBASE_PROJECTS)
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://zsbtgznbqsbkqbpfnume.supabase.co'
const SUPABASE_SECRET = Deno.env.get('SONYER_SUPABASE_SECRET_KEY') || ''
const GOOGLE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
)
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store',
}
const cachedApproval = new Map<string, { time: number; allowed: boolean }>()

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' },
  })
}

function scalar(value: unknown): unknown {
  if (typeof value !== 'object' || value === null) return null
  const obj = value as Record<string, unknown>
  if (Object.hasOwn(obj, 'booleanValue')) return obj.booleanValue
  if (Object.hasOwn(obj, 'stringValue')) return obj.stringValue
  if (Object.hasOwn(obj, 'integerValue')) return Number(obj.integerValue)
  return null
}

function field(fields: Record<string, unknown>, name: string): unknown {
  return scalar(fields[name])
}

function isApproved(fields: Record<string, unknown>): boolean {
  const approved = field(fields, 'approved')
  const autorizado = field(fields, 'autorizado')
  const approvalStatus = String(field(fields, 'approvalStatus') || '').toLowerCase()
  const status = String(field(fields, 'status') || '').toLowerCase()
  const active = field(fields, 'active')
  if (active === false || status === 'blocked' || approvalStatus === 'blocked' ||
      approvalStatus === 'rejected' || approvalStatus === 'pending') return false
  if (approved === true || autorizado === true || approvalStatus === 'approved') return true
  if (approved !== null) return false
  return status === 'active'
}

async function approvedUser(
  uid: string, firebaseToken: string, project: string, authTime: number,
): Promise<boolean> {
  const cacheKey = project + ':' + uid + ':' + authTime
  const cached = cachedApproval.get(cacheKey)
  if (cached && Date.now() - cached.time < 60_000) return cached.allowed

  const url = 'https://firestore.googleapis.com/v1/projects/' + project +
    '/databases/(default)/documents/users/' + encodeURIComponent(uid)
  const res = await fetch(url, { headers: { Authorization: 'Bearer ' + firebaseToken } })
  if (!res.ok) return false // Fail closed; never expose contacts anonymously.
  const doc = await res.json()
  const fields = doc.fields || {}
  let allowed = false
  if (project === 'loginv3-a7e62') {
    // Cliente Yape V3: usuario autenticado, activo, no baneado,
    // con vendedor asociado y sesión Firebase vigente.
    const active = field(fields, 'active') === true
    const banned = field(fields, 'banned') === true
    const vendor = String(field(fields, 'vendorId') || '').trim()
    const storedAuthTime = Number(field(fields, 'authTime') || 0)
    allowed = active && !banned && vendor.length >= 2 &&
      storedAuthTime > 0 && storedAuthTime === authTime
  } else {
    // Conservar exactamente la aprobación que utiliza la app anterior.
    allowed = isApproved(fields)
  }
  cachedApproval.set(cacheKey, { time: Date.now(), allowed })
  if (cachedApproval.size > 1000) cachedApproval.clear()
  return allowed
}

async function database(path: string, method = 'GET', data?: unknown): Promise<unknown> {
  if (!SUPABASE_SECRET) throw new Error('Falta SONYER_SUPABASE_SECRET_KEY en Edge Function Secrets.')
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    method,
    headers: {
      apikey: SUPABASE_SECRET,
      'Content-Type': 'application/json',
      Prefer: method === 'POST'
        ? (path.startsWith('rpc/') ? 'return=representation' : 'resolution=merge-duplicates,return=minimal')
        : 'return=representation',
    },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  })
  if (!res.ok) throw new Error('Error de base de datos (' + res.status + ')')
  if (res.status === 204 || res.headers.get('content-length') === '0') return null
  return await res.json().catch(() => null)
}

async function allowedByQuota(uid: string, operation: string, limit: number): Promise<boolean> {
  // RPC atómico con clave de servicio; la función SQL no es ejecutable por el cliente.
  const result = await database('rpc/sonyer_take_quota', 'POST', {
    p_uid: uid,
    p_kind: operation,
    p_max: limit,
  })
  return result === true
}

function cleanPhone(value: unknown): string {
  let digits = String(value || '').replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('51')) digits = digits.slice(2)
  return /^9\d{8}$/.test(digits) ? digits : ''
}

function bounded(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max)
}

async function verifiedFirebaseUser(req: Request): Promise<{
  uid: string; token: string; project: string; authTime: number
} | null> {
  const header = req.headers.get('Authorization') || ''
  if (!header.startsWith('Bearer ')) return null
  const token = header.slice(7).trim()
  if (token.length > 6000 || !token) return null
  // La firma RS256 se valida ANTES de confiar en aud/iss.
  const { payload } = await jwtVerify(token, GOOGLE_JWKS, {
    algorithms: ['RS256'], clockTolerance: 30,
  })
  const project = typeof payload.aud === 'string' ? payload.aud : ''
  if (!allowedProjects.has(project) ||
      payload.iss !== 'https://securetoken.google.com/' + project) return null
  const now = Math.floor(Date.now() / 1000)
  if (!payload.sub || typeof payload.iat !== 'number' ||
      payload.iat > now + 30 || typeof payload.auth_time !== 'number' ||
      payload.auth_time > now + 30) return null
  return { uid: payload.sub, token, project, authTime: payload.auth_time }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (req.method !== 'POST') return json({ ok: false, error: 'Método no permitido' }, 405)
  const length = Number(req.headers.get('content-length') || 0)
  if (length > 250_000) return json({ ok: false, error: 'Solicitud demasiado grande' }, 413)

  try {
    const user = await verifiedFirebaseUser(req)
    if (!user) return json({ ok: false, error: 'Inicia sesión en la aplicación.' }, 401)
    if (!(await approvedUser(user.uid, user.token, user.project, user.authTime))) {
      return json({ ok: false, error: 'Tu cuenta todavía no está aprobada.' }, 403)
    }

    const raw = await req.text()
    if (raw.length > 250_000) return json({ ok: false, error: 'Solicitud demasiado grande' }, 413)
    let body: Record<string, unknown>
    try { body = JSON.parse(raw) } catch { return json({ ok: false, error: 'JSON inválido' }, 400) }
    const action = bounded(body.action, 30)
    const phone = cleanPhone(body.phone)

    if (action === 'lookup') {
      if (!phone) return json({ ok: false, error: 'Número inválido' }, 400)
      if (!(await allowedByQuota(user.project + ':' + user.uid, 'lookup', 750))) {
        return json({ ok: false, error: 'Límite diario de consultas alcanzado' }, 429)
      }
      const params = new URLSearchParams({ select: 'phone,name,destino', phone: 'eq.' + phone, limit: '1' })
      const result = await database('contacts?' + params) as Array<Record<string, string>> | null
      return json({ ok: true, contact: result?.[0] || null })
    }

    if (action === 'save-contact') {
      if (!phone) return json({ ok: false, error: 'Número inválido' }, 400)
      const name = bounded(body.name, 160)
      if (!name) return json({ ok: false, error: 'Nombre vacío' }, 400)
      if (!(await allowedByQuota(user.project + ':' + user.uid, 'save-contact', 200))) {
        return json({ ok: false, error: 'Límite diario de contactos alcanzado' }, 429)
      }
      const destino = bounded(body.destino, 80) || 'Yape'
      await database('contacts?on_conflict=phone', 'POST', [{ phone, name, destino }])
      return json({ ok: true, saved: 'contact', phone })
    }

    if (action === 'save-qr') {
      const qr = bounded(body.qr, 200_000)
      const firebaseId = bounded(body.firebase_id, 180)
      if (!qr || !/^qr_[a-z0-9_-]{1,90}$/i.test(firebaseId)) {
        return json({ ok: false, error: 'Código QR o identificador inválido' }, 400)
      }
      if (!(await allowedByQuota(user.project + ':' + user.uid, 'save-qr', 100))) {
        return json({ ok: false, error: 'Límite diario de QR alcanzado' }, 429)
      }
      await database('qrs?on_conflict=firebase_id', 'POST', [{
        firebase_id: firebaseId,
        qr,
        phone,
        name: bounded(body.name, 160),
        destino: bounded(body.destino, 80) || 'Yape',
        firebase_data: { source: 'sonyer-bcp', qr, phone },
      }])
      return json({ ok: true, saved: 'qr', firebase_id: firebaseId })
    }

    return json({ ok: false, error: 'Acción desconocida' }, 400)
  } catch (error) {
    const msg = String(error instanceof Error ? error.message : error)
    if (/JWT|signature|expir|token|keyset|claim|issuer|audience/i.test(msg)) {
      return json({ ok: false, error: 'Sesión inválida o vencida.' }, 401)
    }
    // Evitar revelar información sobre claves o consultas internas al cliente.
    console.error('SONYER GLOBAL API request failed', msg.replace(/sb_secret_\S+/g, '[redacted]'))
    return json({ ok: false, error: 'No se pudo completar la operación en el servidor.' }, 503)
  }
})
