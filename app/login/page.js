import AuthForm from '@/app/components/AuthForm';

export const metadata = {
  title: 'Sign In | BMS Portal',
  description: 'Consultant sign in for the BMS Intelligent Portal secure decision engine.',
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
