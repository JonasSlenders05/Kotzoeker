// apps/web/src/components/listings/listing-form.tsx
"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Controller, useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  EPC_LABELS,
  LEASE_TYPES,
  LISTING_TYPES,
  ListingDraft,
  ListingPublishable,
  type AmenityOptionDto,
  type ListingDraftInput,
  type ListingFormInput,
} from "@kotzoeker/shared";
import {
  createListing,
  publishListing,
  updateListing,
} from "@/app/dashboard/koten/actions";
import type { ActionResult } from "@/lib/action-result";
import { LEASE_TYPE_LABELS, LISTING_TYPE_LABELS } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AmenitiesField, type AmenityValue } from "./amenities-field";

type Props = {
  amenityOptions: AmenityOptionDto[];
  /** Leeg bij een nieuw kot. */
  listingId?: string;
  isPublished?: boolean;
  defaultValues?: ListingDraftInput;
};

const EMPTY: ListingFormInput = {
  type: "room",
  title: "",
  rentEuro: "",
  street: "",
  houseNumber: "",
  postalCode: "",
  city: "",
  costsIncluded: false,
  hasConformityCertificate: false,
  leaseType: "academic_year",
  amenities: [],
};

// Een leeg veld is "niet ingevuld", geen lege tekst of 0.
const blank = (value: unknown) => (value === "" ? undefined : value);

export function ListingForm({
  amenityOptions,
  listingId,
  isPublished = false,
  defaultValues,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  const form = useForm<ListingFormInput, unknown, ListingDraftInput>({
    resolver: zodResolver(ListingDraft),
    defaultValues: defaultValues ?? EMPTY,
  });
  const { register, control, formState } = form;
  const error = (name: keyof ListingFormInput) =>
    formState.errors[name]?.message;

  // Fouten in de lijst voorzieningen zitten per rij (bv. amenities.0.sharedWith), niet op de lijst zelf.
  const amenitiesError = (() => {
    const e = formState.errors.amenities;
    if (!e) return undefined;
    if (e.message) return e.message;
    if (Array.isArray(e)) {
      for (const item of e) {
        const message = item?.sharedWith?.message ?? item?.key?.message;
        if (message) return message;
      }
    }
    return "Controleer de voorzieningen.";
  })();

  // Draft-validatie faalt: toon ook bovenaan de knoppen dat er iets mis is.
  const onInvalid = () =>
    setMessage({ ok: false, text: "Controleer de gemarkeerde velden." });

  function showFieldErrors(fieldErrors?: Record<string, string[] | undefined>) {
    for (const [name, messages] of Object.entries(fieldErrors ?? {})) {
      if (messages?.[0])
        form.setError(name as FieldPath<ListingFormInput>, {
          message: messages[0],
        });
    }
  }

  function showResult(result: ActionResult, success: string) {
    if (result.ok) {
      setMessage({ ok: true, text: success });
      return true;
    }
    showFieldErrors(result.fieldErrors);
    setMessage({ ok: false, text: result.message });
    return false;
  }

  /** Dezelfde regels als de server, zodat de kotbaas meteen ziet wat nog ontbreekt. */
  function isPublishable(values: ListingDraftInput) {
    const check = ListingPublishable.safeParse(values);
    if (check.success) return true;
    showFieldErrors(z.flattenError(check.error).fieldErrors);
    setMessage({ ok: false, text: "Vul eerst alle verplichte velden in." });
    return false;
  }

  const save = form.handleSubmit((values) => {
    setMessage(null);
    if (isPublished && !isPublishable(values)) return;
    startTransition(async () => {
      if (!listingId) {
        // Bij succes stuurt de action je door naar de bewerkpagina.
        showResult(await createListing(values), "");
        return;
      }
      if (showResult(await updateListing(listingId, values), "Opgeslagen."))
        form.reset(values);
    });
  }, onInvalid);

  const publish = form.handleSubmit((values) => {
    setMessage(null);
    if (!listingId || !isPublishable(values)) return;
    startTransition(async () => {
      if (!showResult(await updateListing(listingId, values), "")) return;
      showResult(await publishListing(listingId), "Je kot staat online.");
    });
  }, onInvalid);

  return (
    <form onSubmit={save} className="space-y-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Basis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field id="type" label="Type" error={error("type")}>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue placeholder="Kies een type" />
                  </SelectTrigger>
                  <SelectContent>
                    {LISTING_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {LISTING_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field id="title" label="Titel" error={error("title")}>
            <Input id="title" {...register("title")} />
          </Field>
          <Field
            id="description"
            label="Beschrijving"
            error={error("description")}
            hint="Minstens 50 tekens."
          >
            <Textarea
              id="description"
              rows={6}
              {...register("description", { setValueAs: blank })}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prijs</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field
            id="rentEuro"
            label="Huur per maand (€)"
            error={error("rentEuro")}
          >
            <Input
              id="rentEuro"
              type="number"
              inputMode="decimal"
              step="0.01"
              {...register("rentEuro")}
            />
          </Field>
          <Field
            id="costsEuro"
            label="Kosten per maand (€)"
            error={error("costsEuro")}
          >
            <Input
              id="costsEuro"
              type="number"
              inputMode="decimal"
              step="0.01"
              {...register("costsEuro", { setValueAs: blank })}
            />
          </Field>
          <Field
            id="depositEuro"
            label="Waarborg (€)"
            error={error("depositEuro")}
          >
            <Input
              id="depositEuro"
              type="number"
              inputMode="decimal"
              step="0.01"
              {...register("depositEuro", { setValueAs: blank })}
            />
          </Field>
          <div className="flex items-center gap-3 sm:self-end sm:pb-2">
            <Controller
              control={control}
              name="costsIncluded"
              render={({ field }) => (
                <Switch
                  id="costsIncluded"
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="costsIncluded">Kosten inbegrepen in de huur</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adres</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-6">
          <div className="sm:col-span-4">
            <Field id="street" label="Straat" error={error("street")}>
              <Input
                id="street"
                autoComplete="address-line1"
                {...register("street")}
              />
            </Field>
          </div>
          <div className="sm:col-span-1">
            <Field
              id="houseNumber"
              label="Huisnummer"
              error={error("houseNumber")}
            >
              <Input id="houseNumber" {...register("houseNumber")} />
            </Field>
          </div>
          <div className="sm:col-span-1">
            <Field id="box" label="Bus" error={error("box")}>
              <Input id="box" {...register("box", { setValueAs: blank })} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field id="postalCode" label="Postcode" error={error("postalCode")}>
              <Input
                id="postalCode"
                inputMode="numeric"
                autoComplete="postal-code"
                {...register("postalCode")}
              />
            </Field>
          </div>
          <div className="sm:col-span-4">
            <Field id="city" label="Gemeente" error={error("city")}>
              <Input
                id="city"
                autoComplete="address-level2"
                {...register("city")}
              />
            </Field>
          </div>
          <p className="text-sm text-muted-foreground sm:col-span-6">
            Studenten zien enkel straat en gemeente, niet je huisnummer.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Huurvoorwaarden en kenmerken</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field
            id="availableFrom"
            label="Beschikbaar vanaf"
            error={error("availableFrom")}
          >
            <Input
              id="availableFrom"
              type="date"
              {...register("availableFrom", { setValueAs: blank })}
            />
          </Field>
          <Field id="leaseType" label="Huurtype" error={error("leaseType")}>
            <Controller
              control={control}
              name="leaseType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="leaseType" className="w-full">
                    <SelectValue placeholder="Kies een huurtype" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEASE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {LEASE_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field
            id="minLeaseMonths"
            label="Minimale huurduur (maanden)"
            error={error("minLeaseMonths")}
          >
            <Input
              id="minLeaseMonths"
              type="number"
              inputMode="numeric"
              {...register("minLeaseMonths", { setValueAs: blank })}
            />
          </Field>
          <Field id="sizeM2" label="Oppervlakte (m²)" error={error("sizeM2")}>
            <Input
              id="sizeM2"
              type="number"
              inputMode="numeric"
              {...register("sizeM2", { setValueAs: blank })}
            />
          </Field>
          <Field id="epcLabel" label="EPC-label" error={error("epcLabel")}>
            <Controller
              control={control}
              name="epcLabel"
              render={({ field }) => (
                // Radix Select kent geen lege waarde, dus "none" staat voor "niet opgegeven".
                <Select
                  value={field.value ?? "none"}
                  onValueChange={(v) =>
                    field.onChange(v === "none" ? undefined : v)
                  }
                >
                  <SelectTrigger id="epcLabel" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Niet opgegeven</SelectItem>
                    {EPC_LABELS.map((label) => (
                      <SelectItem key={label} value={label}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <div className="flex items-center gap-3 sm:self-end sm:pb-2">
            <Controller
              control={control}
              name="hasConformityCertificate"
              render={({ field }) => (
                <Switch
                  id="hasConformityCertificate"
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="hasConformityCertificate">
              Conformiteitsattest aanwezig
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Voorzieningen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Controller
            control={control}
            name="amenities"
            render={({ field }) => (
              <AmenitiesField
                options={amenityOptions}
                value={(field.value ?? []) as AmenityValue[]}
                onChange={field.onChange}
              />
            )}
          />
          {amenitiesError && (
            <p className="text-sm text-destructive">{amenitiesError}</p>
          )}
        </CardContent>
      </Card>

      {message && message.text && (
        <p
          role={message.ok ? "status" : "alert"}
          className={message.ok ? "text-sm" : "text-sm text-destructive"}
        >
          {message.text}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          variant={listingId && !isPublished ? "outline" : "default"}
          disabled={pending}
        >
          {pending
            ? "Bezig…"
            : isPublished
              ? "Wijzigingen opslaan"
              : "Opslaan als draft"}
        </Button>
        {listingId && !isPublished && (
          <Button type="button" onClick={publish} disabled={pending}>
            Publiceren
          </Button>
        )}
      </div>
    </form>
  );
}

function Field(props: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id}>{props.label}</Label>
      {props.children}
      {props.hint && !props.error && (
        <p className="text-sm text-muted-foreground">{props.hint}</p>
      )}
      {props.error && <p className="text-sm text-destructive">{props.error}</p>}
    </div>
  );
}
