import AuthForm from '@/app/components/AuthForm';

export const metadata = {
  title: 'BMS Portal Login',
};

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;

  return (
    <AuthForm
      paramError={params?.error || ''}
      nextPath={params?.next || ''}
    />
  );
}
