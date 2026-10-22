export type Partner = { id: string; email: string; created_at: string };

async function call<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json" },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Request failed");
  return body;
}

export async function listPartners(): Promise<Partner[]> {
  const { partners } = await call<{ partners: Partner[] }>("/api/partners");
  return partners;
}

export async function addPartner(
  email: string,
  password: string,
): Promise<Partner> {
  const { partner } = await call<{ partner: Partner }>("/api/partners", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return partner;
}
