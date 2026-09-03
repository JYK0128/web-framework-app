import debounce from 'lodash-es/debounce';
import { useEffect, useMemo, useState } from 'react';

import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from '#/.generated/shadcn/components/ui';
import { FormField } from '#/components/form/components';
import { useFieldContext } from '#/components/form/core/context';
import type { FormOption, FormProps } from '#/components/form/core/types';
import { useI18n } from '#/hooks';

type FormComboboxProps = Omit<FormProps<typeof ComboboxInput>, 'value'> & {
  options?: FormOption[]
  placeholder?: string
  onSearch?: (query: string) => void
  searchDebounceMs?: number
};

const koreanInitials = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';

function getKoreanInitials(value: string) {
  return [...value].map((character) => {
    const code = character.charCodeAt(0) - 0xAC00;
    if (code < 0 || code > 11171) return character;
    return koreanInitials[Math.floor(code / 588)];
  }).join('');
}

function getOptionLabelText(label: FormOption['label'] | undefined): string {
  return typeof label === 'string' || typeof label === 'number' || typeof label === 'bigint'
    ? String(label)
    : '';
}

export function FormCombobox({
  label,
  description,
  orientation,
  showError,
  labelWidth,
  required,
  options = [],
  placeholder,
  onSearch,
  searchDebounceMs = 300,
  ...props
}: FormComboboxProps) {
  const { t } = useI18n();
  const displayPlaceholder = placeholder ?? t('form.comboboxPlaceholder');
  const field = useFieldContext<string | null>();
  const [query, setQuery] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    if (!onSearch) return;

    const debouncedSearch = debounce(onSearch, searchDebounceMs);
    debouncedSearch(query);

    return () => debouncedSearch.cancel();
  }, [onSearch, query, searchDebounceMs]);

  const normalizedQuery = query.toLocaleLowerCase();
  const itemValues = useMemo(() => options.map((item) => item.value), [options]);
  const filteredItems = useMemo(() => {
    if (onSearch) return options;

    return options.filter((item) => {
      const label = getOptionLabelText(item.label);
      return label.toLocaleLowerCase().includes(normalizedQuery)
        || getKoreanInitials(label).includes(normalizedQuery);
    });
  }, [options, normalizedQuery, onSearch]);

  return (
    <FormField label={label} description={description} orientation={orientation} showError={showError} labelWidth={labelWidth} required={required}>
      <Combobox
        items={itemValues}
        value={field.state.value ?? ''}
        itemToStringLabel={(value) => getOptionLabelText(options.find((item) => item.value === value)?.label)}
        onInputValueChange={(value) => {
          if (!isComposing) setQuery(value);
        }}
        onValueChange={(value) => {
          setQuery(onSearch ? '' : getOptionLabelText(options.find((item) => item.value === value)?.label));
          field.handleChange(value || null);
          field.handleBlur();
        }}
      >
        <ComboboxInput
          {...props}
          id={field.name}
          placeholder={displayPlaceholder}
          aria-invalid={field.state.meta.errors.length > 0 || undefined}
          showClear
          onCompositionStart={(event) => {
            props.onCompositionStart?.(event);
            setIsComposing(true);
          }}
          onCompositionUpdate={(event) => {
            props.onCompositionUpdate?.(event);
            setQuery(event.currentTarget.value);
          }}
          onCompositionEnd={(event) => {
            props.onCompositionEnd?.(event);
            setIsComposing(false);
            setQuery(event.currentTarget.value);
          }}
          onInput={(event) => {
            props.onInput?.(event);
            setQuery(event.currentTarget.value);
          }}
        />
        <ComboboxContent>
          <ComboboxList>
            {filteredItems.map((item) => (
              <ComboboxItem
                key={item.value}
                value={item.value}
                disabled={item.disabled}
                className="w-full px-3"
              >
                {item.label}
              </ComboboxItem>
            ))}
            {filteredItems.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground" role="status">
                {t('form.comboboxNoResults')}
              </div>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </FormField>
  );
}
