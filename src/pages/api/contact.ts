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
    const CONTACT_EMAIL = import.meta.env.CONTACT_EMAIL || 'aespinozaanco@gmail.com';

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
      html: [
        '<h2>Nuevo mensaje desde el sitio web</h2>',
        `<p><strong>Nombre:</strong> ${name}</p>`,
        `<p><strong>Email:</strong> ${email}</p>`,
        `<p><strong>Proyecto:</strong> ${project}</p>`,
        `<p><strong>Presupuesto:</strong> ${budget || 'No especificado'}</p>`,
        '<p><strong>Mensaje:</strong></p>',
        `<p>${message.replace(/\n/g, '<br>')}</p>`,
      ].join(''),
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend error:', errorText);
      return new Response(JSON.stringify({ error: 'Error enviando el email' }), {
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
