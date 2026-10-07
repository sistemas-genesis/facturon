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
          return { ok: true, json: async () => ({ token: 't' + envios }) };
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
    expect(await svc.deliver({} as never, 'p', opts)).toEqual({ ok: true });
    expect(envios).toBe(2);
  });

  it('401 persistente -> token_expired, sin lanzar y con log de error', async () => {
    const { svc, logger } = mk();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.includes('/phones/token/')
          ? { ok: true, json: async () => ({ token: 't' }) }
          : {
              ok: false,
              status: 401,
              json: async () => ({ message: 'Token expirado' }),
            },
      ),
    );
    const res = await svc.deliver({} as never, 'p', opts);
    expect(res).toMatchObject({ ok: false, reason: 'token_expired' });
    expect(logger.operation).toHaveBeenCalledWith(
      expect.anything(),
      'whatsapp.enviar',
      'error',
      expect.objectContaining({ status: 401, detalle: 'Token expirado' }),
    );
  });
});
