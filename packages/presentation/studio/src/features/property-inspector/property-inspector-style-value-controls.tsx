"use client";

import type { TokenMeta } from "@repo/config-tailwind";
import type { StyleProperty, StylePropertyEntry } from "@repo/contracts-zod";
import { utilityValuesForStyleProperty } from "@repo/contracts-zod";
import { stylePropertyLabel } from "@repo/domains-composition";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.js";
import { PropertyControlLabel } from "./property-control-label.js";
import {
  DisplayStyleValueControl,
  FlexIconStyleValueControl,
} from "./property-inspector-layout-style-controls.js";
import {
  ColorOptionLabel,
  isColorStyleProperty,
  isFlexIconProperty,
  renderUtilityOptionLabel,
  stylePropertyDefaultOptionLabel,
  tokenSemanticLabel,
} from "./property-inspector-style-labels.js";
import {
  entrySelectValue,
  NONE_SELECT_VALUE,
  tokensForStyleProperty,
} from "./property-inspector-style-model.js";

function StylePropertyTokenUtilityPicker({
  currentValue,
  property,
  utilityValues,
  visibleTokens,
  onNodeStyleEntry,
}: {
  property: StyleProperty;
  utilityValues: readonly string[];
  visibleTokens: TokenMeta[];
  currentValue: string;
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
}) {
  return (
    <Select
      data-testid={`inspector-style-token-${property}`}
      onValueChange={(next) => {
        if (next === NONE_SELECT_VALUE) {
          onNodeStyleEntry(property, null);
          return;
        }
        if (next.startsWith("utility:")) {
          onNodeStyleEntry(property, {
            type: "utility",
            property,
            value: next.slice("utility:".length),
          });
          return;
        }
        if (next.startsWith("token:")) {
          onNodeStyleEntry(property, {
            type: "token",
            property,
            token: next.slice("token:".length),
          });
        }
      }}
      value={currentValue}
    >
      <SelectTrigger id={`style-${property}`}>
        <SelectValue placeholder={stylePropertyDefaultOptionLabel(property)} />
      </SelectTrigger>
      <SelectContent
        className={
          isColorStyleProperty(property)
            ? "**:data-[slot=select-item]:pl-2 [&_[data-slot=select-item]>span.absolute]:hidden"
            : undefined
        }
      >
        <SelectItem value={NONE_SELECT_VALUE}>
          {stylePropertyDefaultOptionLabel(property)}
        </SelectItem>
        {utilityValues.length > 0 ? (
          <SelectGroup>
            <SelectLabel>Tailwind values</SelectLabel>
            {utilityValues.map((value) => (
              <SelectItem key={value} value={`utility:${value}`}>
                {renderUtilityOptionLabel(property, value)}
              </SelectItem>
            ))}
          </SelectGroup>
        ) : null}
        {visibleTokens.length > 0 ? (
          <SelectGroup>
            <SelectLabel>Tokens</SelectLabel>
            {visibleTokens.map((token) => (
              <SelectItem key={token.key} value={`token:${token.key}`}>
                {isColorStyleProperty(property) ? (
                  <ColorOptionLabel
                    label={tokenSemanticLabel(token.key)}
                    style={{ backgroundColor: `var(${token.cssVar})` }}
                  />
                ) : (
                  tokenSemanticLabel(token.key)
                )}
              </SelectItem>
            ))}
          </SelectGroup>
        ) : null}
      </SelectContent>
    </Select>
  );
}

function stylePropertyValueEditor(args: {
  property: StyleProperty;
  valueEntry: StylePropertyEntry | undefined;
  utilityValues: readonly string[];
  visibleTokens: TokenMeta[];
  currentValue: string;
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
}) {
  const {
    property,
    valueEntry,
    onNodeStyleEntry,
    utilityValues,
    visibleTokens,
    currentValue,
  } = args;
  if (property === "display") {
    return (
      <DisplayStyleValueControl
        onNodeStyleEntry={onNodeStyleEntry}
        valueEntry={valueEntry}
      />
    );
  }
  if (isFlexIconProperty(property)) {
    return (
      <FlexIconStyleValueControl
        onNodeStyleEntry={onNodeStyleEntry}
        property={property}
        valueEntry={valueEntry}
      />
    );
  }
  return (
    <StylePropertyTokenUtilityPicker
      currentValue={currentValue}
      onNodeStyleEntry={onNodeStyleEntry}
      property={property}
      utilityValues={utilityValues}
      visibleTokens={visibleTokens}
    />
  );
}

export function StyleValueSelect({
  property,
  valueEntry,
  tokenMetadata,
  onNodeStyleEntry,
}: {
  property: StyleProperty;
  valueEntry: StylePropertyEntry | undefined;
  tokenMetadata: TokenMeta[];
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
}) {
  const selectedToken = valueEntry?.type === "token" ? valueEntry.token : null;
  const visibleTokens = tokensForStyleProperty(
    tokenMetadata,
    property,
    selectedToken,
  );
  const utilityValues = utilityValuesForStyleProperty(property);
  const currentValue = entrySelectValue(valueEntry);
  const showModified = Boolean(valueEntry);
  return (
    <div className="block space-y-2" key={property}>
      <PropertyControlLabel
        htmlFor={`style-${property}`}
        label={stylePropertyLabel(property)}
        onReset={
          showModified
            ? () => {
                onNodeStyleEntry(property, null);
              }
            : undefined
        }
        showModified={showModified}
      />
      {stylePropertyValueEditor({
        currentValue,
        onNodeStyleEntry,
        property,
        utilityValues,
        valueEntry,
        visibleTokens,
      })}
    </div>
  );
}
