import { PageLayout } from "@/components/layout/PageLayout";

export default function GlobalNotFound() {
  return (
    <PageLayout country="us">
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground">Page not found</p>
      </div>
    </PageLayout>
  );
}
