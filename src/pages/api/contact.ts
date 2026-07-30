import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { name, email, project, budget, message } = data;

    if (!name || !email || !project || !message) {
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const RESEND_API_KEY = import.meta.env.RESEND_API_KEY;
    const RESEND_FROM_EMAIL = import.meta.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const CONTACT_EMAIL = import.meta.env.CONTACT_EMAIL || 'aespinozaanco38@gmail.com';

    if (!RESEND_API_KEY) {
      // Modo de desarrollo: loguea el mensaje y responde OK
      console.log('Contact form submission (Resend no configurado):', {
        name,
        email,
        project,
        budget,
        message,
      });

      return new Response(JSON.stringify({ success: true, mode: 'debug' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const resendPayload = {
      from: `DevAE Contacto <${RESEND_FROM_EMAIL}>`,
      to: [CONTACT_EMAIL],
      reply_to: email,
      subject: `Nuevo mensaje de ${name} - ${project}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0b0e; color: #f8fafc; margin: 0; padding: 20px; }
            .card { max-width: 600px; margin: 0 auto; background-color: #12141f; border: 1px solid #1e2235; border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            .header { border-bottom: 1px solid #2a2f45; padding-bottom: 20px; margin-bottom: 24px; }
            .brand { font-size: 20px; font-weight: bold; color: #ffffff; }
            .accent { color: #00f2fe; }
            .badge { display: inline-block; padding: 4px 12px; background: rgba(0,242,254,0.1); border: 1px solid rgba(0,242,254,0.3); color: #00f2fe; border-radius: 20px; font-size: 11px; font-family: monospace; }
            .field { margin-bottom: 16px; }
            .label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; font-family: monospace; display: block; margin-bottom: 4px; }
            .value { font-size: 15px; color: #f1f5f9; font-weight: 500; }
            .message-box { background: rgba(255,255,255,0.03); border: 1px solid #2a2f45; border-radius: 12px; padding: 16px; margin-top: 20px; color: #e2e8f0; line-height: 1.6; }
            .footer { margin-top: 32px; pt-20px; border-top: 1px solid #1e2235; font-size: 12px; color: #64748b; text-align: center; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <span class="badge">NUEVA SOLICITUD DE COTIZACIÓN</span>
              <div class="brand" style="margin-top: 12px;">Dev<span class="accent">AE</span> Studio</div>
            </div>

            <div class="field">
              <span class="label">Cliente / Empresa</span>
              <div class="value">${name}</div>
            </div>

            <div class="field">
              <span class="label">Correo Electrónico</span>
              <div class="value"><a href="mailto:${email}" style="color: #00f2fe; text-decoration: none;">${email}</a></div>
            </div>

            <div class="field">
              <span class="label">Tipo de Proyecto</span>
              <div class="value">${project}</div>
            </div>

            <div class="field">
              <span class="label">Presupuesto Estimado</span>
              <div class="value">${budget || 'No especificado'}</div>
            </div>

            <span class="label">Detalles del Mensaje</span>
            <div class="message-box">
              ${message.replace(/\n/g, '<br>')}
            </div>

            <div class="footer">
              DevAE Studio · Notificación Automática de Cotización Web
            </div>
          </div>
        </body>
        </html>
      `,
    };

    let response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendPayload),
    });

    // Si falla por restricción de modo pruebas de Resend (enviar a un mail no registrado), reintenta con aespinozaanco@gmail.com
    if (!response.ok && CONTACT_EMAIL !== 'aespinozaanco@gmail.com') {
      console.warn('Reintentando envío a la cuenta registrada de Resend (aespinozaanco@gmail.com)...');
      const fallbackPayload = {
        ...resendPayload,
        to: ['aespinozaanco@gmail.com'],
      };
      response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fallbackPayload),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend error final:', errorText);
      return new Response(JSON.stringify({ error: 'Error enviando el email', details: errorText }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Contact API error:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
