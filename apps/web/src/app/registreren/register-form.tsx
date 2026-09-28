"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterSchema, type RegisterInput } from "@kotzoeker/shared";
import { registerWithPassword } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      passwordConfirm: "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await registerWithPassword(values);
      if (result) setServerError(result.message);
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
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
        <Label htmlFor="email">E-mailadres</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Wachtwoord</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
        />
        <p className="text-xs text-muted-foreground">
          Minstens 8 tekens, met een letter en een cijfer.
        </p>
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="passwordConfirm">Herhaal wachtwoord</Label>
        <Input
          id="passwordConfirm"
          type="password"
          autoComplete="new-password"
          {...register("passwordConfirm")}
        />
        {errors.passwordConfirm && (
          <p className="text-sm text-destructive">
            {errors.passwordConfirm.message}
          </p>
        )}
      </div>

      {serverError && (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Bezig…" : "Account aanmaken"}
      </Button>
    </form>
  );
}
