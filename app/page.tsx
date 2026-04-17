import { LoginPage } from "@/src/features/auth/pages/LoginPage";

type HomePageProps = {
  searchParams: Promise<{
    auth?: string;
    email?: string;
  }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <LoginPage
      authStatus={resolvedSearchParams.auth}
      pendingVerificationEmail={resolvedSearchParams.email}
    />
  );
}
