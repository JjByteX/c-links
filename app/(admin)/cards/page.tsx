import type { Metadata } from "next";
import { CardsList } from "@/components/cards-list";

export const metadata: Metadata = { title: "Cards" };

export default function CardsPage() {
  return <CardsList />;
}
