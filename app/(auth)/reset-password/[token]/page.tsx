import ResetPasswordForm from '../_components/ResetPasswordForm';

interface ResetPasswordPageProps {
  params: {
    token: string;
  };
  searchParams: {
    email?: string;
  };
}

export default async function ResetPasswordPage({ params, searchParams }: ResetPasswordPageProps) {
  const  tokenParam  =  await params;
  const  emailParam  = await searchParams;

  // The client component will handle validation and API calls
  return (
    <ResetPasswordForm
      token={tokenParam.token}
      email={emailParam.email || ''} // Provide a default empty string if email is not present
    />
  );
}