import { WhatsAppService } from './whatsapp.service.js';

describe('WhatsAppService sin baseUrl (deshabilitado)', () => {
  it('no hace fetch ni lanza: token null y send false', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const svc = new WhatsAppService(
      { for: () => ({ whatsappBaseUrl: undefined }) } as never,
      { operation: () => undefined } as never,
    );
    expect(await svc.generateToken({} as never, 'p')).toBeNull();
    expect(
      await svc.send({} as never, 't', {
        phone: '593991234567',
        pdfBase64: 'x',
      }),
    ).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

describe('WhatsAppService.normalizePhone', () => {
  it.each([
    ['0991234567', '593991234567'],
    ['991234567', '593991234567'],
    ['+593 99 123 4567', '593991234567'],
    ['593991234567', '593991234567'],
    ['022345678 / 0991234567', '593991234567'],
  ])('%s -> %s', (raw, esperado) => {
    expect(WhatsAppService.normalizePhone(raw)).toBe(esperado);
  });
  it.each([null, undefined, '', '022345678', '099123456', 'abc'])(
    '%s -> null',
    (raw) => {
      expect(WhatsAppService.normalizePhone(raw as never)).toBeNull();
    },
  );
});

const UUID = '3993ac2b-eb26-49c8-8c3c-7c157cff3767';

describe('WhatsAppService.deliver con token expirado', () => {
  const mk = () => {
    const logger = { operation: vi.fn() };
    const svc = new WhatsAppService(
      { for: () => ({ whatsappBaseUrl: 'http://wa' }) } as never,
      logger as never,
    );
    return { svc, logger };
  };
  const opts = { phone: '593991234567', pdfBase64: 'x' };
  afterEach(() => vi.unstubAllGlobals());

  it('401 -> renueva token y reintenta una vez (201)', async () => {
    const { svc } = mk();
    let envios = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/phones/token/'))
          return {
            ok: true,
            status: 201,
            text: async () => JSON.stringify({ token: 't' + envios }),
          };
        envios++;
        return envios === 1
          ? {
              ok: false,
              status: 401,
              json: async () => ({ message: 'Token expirado' }),
            }
          : { ok: true, status: 201, json: async () => ({}) };
      }),
    );
    expect(await svc.deliver({} as never, UUID, opts)).toEqual({ ok: true });
    expect(envios).toBe(2);
  });

  it('401 persistente -> token_expired, sin lanzar y con log de error', async () => {
    const { svc, logger } = mk();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.includes('/phones/token/')
          ? {
              ok: true,
              status: 201,
              text: async () => JSON.stringify({ token: 't' }),
            }
          : {
              ok: false,
              status: 401,
              json: async () => ({ message: 'Token expirado' }),
            },
      ),
    );
    const res = await svc.deliver({} as never, UUID, opts);
    expect(res).toMatchObject({ ok: false, reason: 'token_expired' });
    expect(logger.operation).toHaveBeenCalledWith(
      expect.anything(),
      'whatsapp.enviar',
      'error',
      expect.objectContaining({ status: 401, detalle: 'Token expirado' }),
    );
  });
});

describe('WhatsAppService.requestToken', () => {
  const mk = (base = 'http://wa') => {
    const logger = { operation: vi.fn() };
    const svc = new WhatsAppService(
      { for: () => ({ whatsappBaseUrl: base }) } as never,
      logger as never,
    );
    return { svc, logger };
  };
  const reply = (status: number, text: string) =>
    vi.fn(async () => ({
      ok: status >= 200 && status < 300,
      status,
      text: async () => text,
    }));
  afterEach(() => vi.unstubAllGlobals());

  it('201 JSON con token -> ok (trim del id y baseUrl con / final)', async () => {
    const { svc } = mk('http://wa:5822/');
    const f = reply(201, JSON.stringify({ id: 1, token: 'eyJabc' }));
    vi.stubGlobal('fetch', f);
    expect(await svc.requestToken({} as never, `  ${UUID}\n`)).toEqual({
      ok: true,
      token: 'eyJabc',
    });
    expect(f).toHaveBeenCalledWith(`http://wa:5822/phones/token/${UUID}`, {
      method: 'POST',
    });
  });

  it('201 con body false -> phone_not_found, con id enmascarado y sin token en el log', async () => {
    const { svc, logger } = mk();
    vi.stubGlobal('fetch', reply(201, 'false'));
    const r = await svc.requestToken({} as never, UUID.slice(0, -1) + '8');
    expect(r).toMatchObject({ ok: false, reason: 'phone_not_found' });
    expect((r as { message: string }).message).toContain('http://wa');
    expect((r as { message: string }).message).not.toContain(UUID.slice(0, -1));
    expect(logger.operation).toHaveBeenCalledWith(
      expect.anything(),
      'whatsapp.token',
      'error',
      expect.objectContaining({
        reason: 'phone_not_found',
        baseUrl: 'http://wa',
      }),
    );
  });

  it('id truncado (35 caracteres) -> phone_id_invalid sin llamar al servidor', async () => {
    const { svc } = mk();
    const f = reply(201, 'false');
    vi.stubGlobal('fetch', f);
    const r = await svc.requestToken({} as never, UUID.slice(0, -1));
    expect(r).toMatchObject({ ok: false, reason: 'phone_id_invalid' });
    expect(f).not.toHaveBeenCalled();
  });

  it('404 -> phone_not_found; 401 -> token; 500 -> unavailable', async () => {
    const { svc } = mk();
    vi.stubGlobal('fetch', reply(404, '{}'));
    expect(await svc.requestToken({} as never, UUID)).toMatchObject({
      reason: 'phone_not_found',
    });
    vi.stubGlobal('fetch', reply(401, '{}'));
    expect(await svc.requestToken({} as never, UUID)).toMatchObject({
      reason: 'token',
    });
    vi.stubGlobal('fetch', reply(500, 'boom'));
    expect(await svc.requestToken({} as never, UUID)).toMatchObject({
      reason: 'unavailable',
    });
  });

  it('red caida -> unavailable; 2xx sin token (HTML) -> token; access_token tambien vale', async () => {
    const { svc } = mk();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNREFUSED');
      }),
    );
    expect(await svc.requestToken({} as never, UUID)).toMatchObject({
      reason: 'unavailable',
    });
    vi.stubGlobal('fetch', reply(201, '<html></html>'));
    expect(await svc.requestToken({} as never, UUID)).toMatchObject({
      reason: 'token',
    });
    vi.stubGlobal('fetch', reply(201, '{"access_token":"zzz"}'));
    expect(await svc.generateToken({} as never, UUID)).toBe('zzz');
  });

  it('deliver propaga el motivo real del token', async () => {
    const { svc } = mk();
    vi.stubGlobal('fetch', reply(201, 'false'));
    expect(
      await svc.deliver({} as never, UUID, {
        phone: '593991234567',
        pdfBase64: 'x',
      }),
    ).toMatchObject({ ok: false, reason: 'phone_not_found' });
  });
});
