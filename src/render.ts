import type { I18nPresets, I18nValues, Template, TemplateMessage, I18nFormatTagFunc } from './types';
import { TemplateType } from './types';
import { formatDateTime, formatNumber } from './format';
import { getPreset, isDate, isValueFunc, isNumber, isPlural, isString } from './utils';

function format(
  locale: string,
  presets: Readonly<I18nPresets>,
  message: string | Template,
  props: I18nValues = {},
  formatTag?: I18nFormatTagFunc,
): (readonly string[]) | string | null {
  if (typeof message === 'string') return message;

  const [id, type, options] = message;
  const value = props[id];

  if (isNumber(value) && (!type || type === TemplateType.number))
    return formatNumber(value, locale, getPreset(presets.number, options));

  else if (isDate(value) || ((isString(value) || isNumber(value)) && type === TemplateType.date))
    return formatDateTime(new Date(value), locale, getPreset(presets.dateTime, options));

  else if (type === TemplateType.tag) {
    const child = isString(options) || Array.isArray(options)
      ? render(locale, presets, options, props, formatTag)
      : undefined;

    if (isValueFunc(value)) return value(child as any) as any;

    if (formatTag) {
      const tag = isString(value) ? value : id;
      return formatTag(tag, child);
    }

    return '';
  }

  else if (type === TemplateType.plural && isNumber(value) && isPlural(options)) {
    if (value === 0 && options['=0']) return options['=0'] as any;

    const rule = new Intl.PluralRules(locale).select(value);
    const template = options[rule] || options.other || '';
    return render(locale, presets, template, props, formatTag);
  }

  else return String(value);
}

export function render(
  locale: string,
  presets: Readonly<I18nPresets>,
  message: TemplateMessage,
  props: I18nValues = {},
  formatTag?: I18nFormatTagFunc,
): (readonly string[]) | string {
  if (Array.isArray(message)) {
    const result = message.map((msg: string | Template) => (
      format(locale, presets, msg, props, formatTag)
    ));

    return result.every(isString) ? result.join('') : result as any;
  }

  return message as any;
}
