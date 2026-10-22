import type { Metadata } from "next";
import { PartnersList } from "@/components/partners-list";

export const metadata: Metadata = { title: "Partners" };

export default function PartnersPage() {
  return <PartnersList />;
}
