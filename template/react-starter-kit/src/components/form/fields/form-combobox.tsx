import debounce from 'lodash-es/debounce';
import { useEffect, useMemo, useState } from 'react';

import { Combobox, ComboboxChip, ComboboxChips, ComboboxChipsInput, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList, useComboboxAnchor } from '#/.generated/shadcn/components/ui';
import { FormField } from '#/components/form/components';
import { useFieldContext } from '#/components/form/core/context';
import type { FormOption, FormProps } from '#/components/form/core/types';
import { useI18n } from '#/hooks';

type FormComboboxProps = Omit<FormProps<typeof ComboboxInput>, 'value'> & {
  options?: FormOption[]
  placeholder?: string
  onSearch?: (query: string) => void
  searchDebounceMs?: number
  multiple?: boolean
  allowCustomValues?: boolean
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
  multiple = false,
  allowCustomValues = false,
  ...props
}: FormComboboxProps) {
  const { t } = useI18n();
  const inputPlaceholder = placeholder ?? (allowCustomValues ? t('core.form.comboboxCustomValuePlaceholder') : t('core.form.comboboxPlaceholder'));
  const field = useFieldContext<string | string[] | null>();
  const anchor = useComboboxAnchor();
  const [query, setQuery] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    if (!onSearch) return;

    const debouncedSearch = debounce(onSearch, searchDebounceMs);
    debouncedSearch(query);

    return () => debouncedSearch.cancel();
  }, [onSearch, query, searchDebounceMs]);

  const normalizedQuery = query.toLocaleLowerCase();
  const selectedValues = ([] as string[]).concat(field.state.value ?? []);
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
        multiple={multiple}
        items={itemValues}
        value={multiple ? selectedValues : selectedValues[0]}
        itemToStringLabel={(value) => getOptionLabelText(options.find((item) => item.value === value)?.label)}
        onInputValueChange={(value) => {
          if (!isComposing) setQuery(value);
        }}
        onValueChange={(value) => {
          if (multiple) {
            const nextValue = Array.isArray(value) ? value : [];
            field.handleChange(nextValue);
          }
          else {
            setQuery(onSearch ? '' : getOptionLabelText(options.find((item) => item.value === value)?.label));
            field.handleChange(value || null);
          }
          field.handleBlur();
        }}
      >
        {multiple
          ? (
            <ComboboxChips ref={anchor}>
              {selectedValues.map((value) => <ComboboxChip key={value}>{getOptionLabelText(options.find((item) => item.value === value)?.label) || value}</ComboboxChip>)}
              <ComboboxChipsInput
                placeholder={inputPlaceholder}
                onKeyDown={(event) => {
                  if (!allowCustomValues || event.key !== 'Enter') return;
                  const customValue = event.currentTarget.value.trim();
                  event.preventDefault();
                  event.stopPropagation();
                  if (!customValue || selectedValues.includes(customValue)) return;
                  field.handleChange([...selectedValues, customValue]);
                  field.handleBlur();
                  setQuery('');
                }}
              />
            </ComboboxChips>
          )
          : (
            <ComboboxInput
              {...props}
              id={field.name}
              placeholder={inputPlaceholder}
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
              onKeyDown={(event) => {
                props.onKeyDown?.(event);
                if (event.defaultPrevented || !allowCustomValues || event.key !== 'Enter') return;
                const customValue = event.currentTarget.value.trim();
                if (!customValue) return;
                event.preventDefault();
                field.handleChange(customValue);
                field.handleBlur();
              }}
              onInput={(event) => {
                props.onInput?.(event);
                setQuery(event.currentTarget.value);
              }}
            />
          )}
        <ComboboxContent anchor={multiple ? anchor : undefined}>
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
            {filteredItems.length === 0 && <ComboboxEmpty>{t('core.form.comboboxNoResults')}</ComboboxEmpty>}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </FormField>
  );
}
