import https from 'node:https';

import axios, { type AxiosInstance } from 'axios';
import { load } from 'cheerio';

import type { CalendarPageState, HiddenFieldMap } from '../types.js';

function extractHiddenFields(html: string): HiddenFieldMap {
  const $ = load(html);
  const hiddenFields: HiddenFieldMap = {};

  $('form input[type="hidden"][name]').each((_, element) => {
    const name = $(element).attr('name');
    if (!name) {
      return;
    }

    hiddenFields[name] = $(element).attr('value') ?? '';
  });

  return hiddenFields;
}

function serializeCookies(cookieJar: Map<string, string>): string | undefined {
  if (cookieJar.size === 0) {
    return undefined;
  }

  return [...cookieJar.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
}

function updateCookies(
  cookieJar: Map<string, string>,
  headers: Record<string, unknown>,
): void {
  const setCookie = headers['set-cookie'];
  const cookies = Array.isArray(setCookie)
    ? setCookie.filter((value): value is string => typeof value === 'string')
    : typeof setCookie === 'string'
      ? [setCookie]
      : [];

  for (const cookie of cookies) {
    const [pair] = cookie.split(';', 1);
    if (!pair) {
      continue;
    }

    const [name, ...rest] = pair.split('=');
    if (!name || rest.length === 0) {
      continue;
    }

    cookieJar.set(name, rest.join('='));
  }
}

export class AspNetCalendarClient {
  private readonly cookieJar = new Map<string, string>();

  private readonly httpClient: AxiosInstance;

  public constructor(
    private readonly calendarUrl: string,
    private readonly userAgent: string,
    allowInsecureTls: boolean,
  ) {
    this.httpClient = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: !allowInsecureTls,
      }),
      maxRedirects: 5,
      responseType: 'text',
    });
  }

  public async loadInitialPage(): Promise<CalendarPageState> {
    return this.requestPage('GET');
  }

  public async postBack(page: CalendarPageState, eventTarget: string, eventArgument = ''): Promise<CalendarPageState> {
    const payload = new URLSearchParams(page.hiddenFields);
    payload.set('__EVENTTARGET', eventTarget);
    payload.set('__EVENTARGUMENT', eventArgument);

    return this.requestPage('POST', payload);
  }

  private async requestPage(method: 'GET' | 'POST', payload?: URLSearchParams): Promise<CalendarPageState> {
    const cookieHeader = serializeCookies(this.cookieJar);

    const response = await this.httpClient.request<string>({
      data: payload?.toString(),
      headers: {
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        ...(payload ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
        'User-Agent': this.userAgent,
      },
      method,
      url: this.calendarUrl,
      validateStatus: (status) => status >= 200 && status < 400,
    });

    updateCookies(this.cookieJar, response.headers as Record<string, unknown>);

    return {
      hiddenFields: extractHiddenFields(response.data),
      html: response.data,
    };
  }
}
