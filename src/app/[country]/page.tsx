import HomeContent from "@/components/HomeContent";

export default async function CountryHomePage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  return <HomeContent country={(country || 'us').toLowerCase()} />;
}
