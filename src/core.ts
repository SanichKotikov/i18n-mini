import type {
  DateTimeOptions,
  I18n,
  I18nLocales,
  I18nMessage,
  I18nPresets,
  I18nValues,
  NumberOptions,
  SubscribeFunc,
  I18nFormatTagFunc,
} from './types';
import { formatDateTime, formatNumber } from './format';
import { render } from './render';
import { parser } from './parser';
import { getPreset, isString } from './utils';

export interface I18nOptions {
  language: string;
  locales?: Readonly<Record<string, I18nLocales>>;
  presets?: Readonly<I18nPresets>;
  formatTag?: I18nFormatTagFunc;
}

export interface I18nReturn<T = string> {
  i18n: Readonly<I18n<T>>,
  subscribe: SubscribeFunc,
}

export function createI18n<T = string>(options: I18nOptions): Readonly<I18nReturn<T>> {
  const subscribers = new Set<() => void>();

  function onUpdate() {
    [...subscribers.values()].forEach(func => func());
  }

  const i18n: I18n<T> = {
    language: options.language,
    locales: { ...options.locales },
    presets: { ...options.presets },

    setLanguage: (value: string) => {
      i18n.language = value;
      onUpdate();
    },
    setLocales: (value: Readonly<I18nLocales>) => {
      i18n.locales = {
        ...i18n.locales,
        [i18n.language]: { ...i18n.locales[i18n.language], ...value },
      };
      onUpdate();
    },

    t: (msg: string | Readonly<I18nMessage>, props?: Readonly<I18nValues>) => {
      const id = isString(msg) ? undefined : msg.id;
      const message = isString(msg) ? msg : msg.message;

      return render(
        i18n.language,
        i18n.presets,
        parser(i18n.locales[i18n.language]?.[id || message] || message),
        props,
        options.formatTag,
      ) as unknown as T | T[];
    },
    formatNumber: (value: number, options?: string | Readonly<NumberOptions>) => {
      const optionsValue: Readonly<NumberOptions> | undefined =
        (!options || isString(options))
          ? getPreset(i18n.presets.number, options)
          : options;
      return formatNumber(value, i18n.language, optionsValue);
    },
    formatDateTime: (date: number | string | Date, options?: string | Readonly<DateTimeOptions>) => {
      const dateValue = typeof date === 'string' ? new Date(date) : date;
      const optionsValue: Readonly<DateTimeOptions> | undefined =
        (!options || isString(options))
          ? getPreset(i18n.presets.dateTime, options)
          : options;
      return formatDateTime(dateValue, i18n.language, optionsValue);
    },
  };

  function subscribe(callback: () => void) {
    subscribers.add(callback);

    return (): void => {
      subscribers.delete(callback);
    };
  }

  return { i18n, subscribe };
}
