"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OnboardingSchema, type OnboardingInput } from "@kotzoeker/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeOnboarding } from "./actions";

type Props = { defaultFirstName: string; defaultLastName: string };

export function OnboardingForm({ defaultFirstName, defaultLastName }: Props) {
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(OnboardingSchema),
    defaultValues: {
      firstName: defaultFirstName,
      lastName: defaultLastName,
      phone: "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      // Bij succes stuurt de action je door; je krijgt enkel iets terug bij een fout.
      const result = await completeOnboarding(values);
      if (result && !result.ok) setServerError(result.message);
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <fieldset className="space-y-2">
        <legend className="font-medium">Ik ben</legend>
        <label className="flex items-center gap-2">
          <input type="radio" value="student" {...register("role")} />
          Student en op zoek naar een kot
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" value="landlord" {...register("role")} />
          Kotbaas met een kot te huur
        </label>
        {errors.role && (
          <p className="text-sm text-destructive">{errors.role.message}</p>
        )}
      </fieldset>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Voornaam</Label>
          <Input
            id="firstName"
            autoComplete="given-name"
            {...register("firstName")}
          />
          {errors.firstName && (
            <p className="text-sm text-destructive">
              {errors.firstName.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Achternaam</Label>
          <Input
            id="lastName"
            autoComplete="family-name"
            {...register("lastName")}
          />
          {errors.lastName && (
            <p className="text-sm text-destructive">
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefoon (optioneel)</Label>
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          {...register("phone")}
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone.message}</p>
        )}
      </div>

      {serverError && (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Bezig…" : "Verder"}
      </Button>
    </form>
  );
}
