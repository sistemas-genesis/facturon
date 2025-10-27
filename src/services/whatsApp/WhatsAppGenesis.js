class WhatsAppGenesis {
  static token = "";
  static async generateToken(phoneNumerId) {
    const res = await fetch(
      `${process.env.WHATSAPP_BASE_URL}/phones/token/${phoneNumerId}`,
      {
        method: "POST",
      }
    );
    if (res.ok) {
      const json = await res.json();

      WhatsAppGenesis.token = json.token;
      return json.token;
    }

    WhatsAppGenesis.token = null;
    return null;
  }
  static async send(
    options = {
      phone: "",
      file: undefined,
      message: {
        text: "",
        mentions: [],
      },
    }
  ) {
    if (!options.message) {
      options.message = {
        text: `Hola 👋\n\nTe compartimos tu factura puedes revisarla en el siguiente pdf. Si tienes alguna duda, estamos a tu disposición.\n\n¡Gracias por tu confianza!`,
        mentions: [],
      };
    }
    const { phone, file, ...restOptions } = options;

    const pdfBase64 = file.toString("base64");

    if (!phone) throw "Falta el numero celular";

    const finalOptions = {
      jid: `${phone}@s.whatsapp.net`,
      type: "number",
      file: {
        base64: pdfBase64,
        name: "Factura",
      },
      ...restOptions,
    };

    const headers = {
      Authorization: `Bearer ${WhatsAppGenesis.token}`,
      "Content-Type": "application/json",
    };

    const res = await fetch(`${process.env.WHATSAPP_BASE_URL}/messages/send`, {
      method: "POST",
      headers,
      body: JSON.stringify(finalOptions),
    });

    if (!res.ok) {
      console.error(await res.json());
    }
  }
}

module.exports = WhatsAppGenesis;
