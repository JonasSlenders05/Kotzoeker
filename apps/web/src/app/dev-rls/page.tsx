"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RlsTestPage() {
  const [log, setLog] = useState<string[]>(["Bezig…"]);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const out: string[] = [];

      const { data: rows, error: selectError } = await supabase
        .from("profiles")
        .select("id, role");
      out.push(
        `Profielen lezen: ${selectError ? selectError.message : `${rows.length} rij(en)`}`,
      );

      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        const { error: roleError } = await supabase
          .from("profiles")
          .update({ role: "admin" })
          .eq("id", auth.user.id);
        out.push(
          `Rol wijzigen: ${roleError ? `geweigerd (${roleError.message})` : "GELUKT, dit is fout!"}`,
        );

        const { error: nameError } = await supabase
          .from("profiles")
          .update({ first_name: "RLS-test" })
          .eq("id", auth.user.id);
        out.push(
          `Voornaam wijzigen: ${nameError ? `fout (${nameError.message})` : "gelukt"}`,
        );
      }

      setLog(out);
    })();
  }, []);

  return <pre className="p-6">{log.join("\n")}</pre>;
}
