// apps/web/src/components/listings/amenities-field.tsx
"use client";

import type { AmenityCategory, AmenityOptionDto } from "@kotzoeker/shared";
import { CATEGORY_LABELS } from "@/lib/labels";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export type AmenityValue = {
  key: string;
  isShared: boolean;
  sharedWith?: number;
};

type Props = {
  options: AmenityOptionDto[];
  value: AmenityValue[];
  onChange: (value: AmenityValue[]) => void;
};

const CATEGORY_ORDER: AmenityCategory[] = [
  "sanitary",
  "kitchen",
  "comfort",
  "building",
];

export function AmenitiesField({ options, value, onChange }: Props) {
  const chosen = new Map(value.map((a) => [a.key, a]));

  const toggle = (key: string, on: boolean) =>
    onChange(
      on
        ? [...value, { key, isShared: false }]
        : value.filter((a) => a.key !== key),
    );

  const patch = (key: string, changes: Partial<AmenityValue>) =>
    onChange(value.map((a) => (a.key === key ? { ...a, ...changes } : a)));

  return (
    <div className="space-y-6">
      {CATEGORY_ORDER.map((category) => {
        const items = options.filter((o) => o.category === category);
        if (items.length === 0) return null;

        return (
          <fieldset key={category} className="space-y-2">
            <legend className="mb-2 text-sm font-medium">
              {CATEGORY_LABELS[category]}
            </legend>
            {items.map((option) => {
              const current = chosen.get(option.key);
              const id = `amenity-${option.key}`;

              return (
                <div
                  key={option.key}
                  className="space-y-3 rounded-md border p-3"
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={id}
                      checked={current !== undefined}
                      onCheckedChange={(checked) =>
                        toggle(option.key, checked === true)
                      }
                    />
                    <Label htmlFor={id}>{option.label}</Label>
                  </div>

                  {/* Privé of gedeeld enkel voor voorzieningen die gedeeld kunnen zijn. */}
                  {current && option.shareable && (
                    <div className="flex flex-wrap items-center gap-3 pl-6">
                      <Switch
                        id={`${id}-shared`}
                        checked={current.isShared}
                        onCheckedChange={(isShared) =>
                          patch(option.key, {
                            isShared,
                            sharedWith: isShared
                              ? current.sharedWith
                              : undefined,
                          })
                        }
                      />
                      <Label htmlFor={`${id}-shared`}>
                        {current.isShared ? "Gedeeld" : "Privé"}
                      </Label>

                      {current.isShared && (
                        <>
                          <Label htmlFor={`${id}-with`} className="sr-only">
                            Gedeeld met hoeveel personen
                          </Label>
                          <Input
                            id={`${id}-with`}
                            type="number"
                            inputMode="numeric"
                            min={2}
                            max={30}
                            placeholder="met x personen"
                            className="w-40"
                            value={current.sharedWith ?? ""}
                            onChange={(e) =>
                              patch(option.key, {
                                sharedWith:
                                  e.target.value === ""
                                    ? undefined
                                    : Number(e.target.value),
                              })
                            }
                          />
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </fieldset>
        );
      })}
    </div>
  );
}
