import ValidPrivacyPage, {
  metadata as privacyMetadata,
} from "@/app/(en)/(root)/privacy/page";
import { isValidCountryCode } from "@/lib/countries";
import { generateCountryParams } from "@/lib/static-params";
import { notFound, redirect } from "next/navigation";

export async function generateStaticParams() {
  const params = generateCountryParams();
  return params.filter((p) => p.country !== "de");
}

interface Props {
  params: Promise<{ country: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { country } = await params;
  if (!isValidCountryCode(country)) {
    return { title: "Page Not Found" };
  }
  return privacyMetadata;
}

export default async function LocalizedPrivacyPage({ params }: Props) {
  const { country } = await params;

  if (country === "de") {
    redirect("/de/datenschutz");
  }

  if (!isValidCountryCode(country)) {
    notFound();
  }

  return <ValidPrivacyPage />;
}
