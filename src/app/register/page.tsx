import { RegisterForm } from "@/components/register-form";

export default function RegisterPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-sm flex-col justify-center px-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Zet 회원가입</h1>
        <p className="mt-2 text-sm text-muted">새로운 제품 트렌드를 발견하세요</p>
      </div>
      <RegisterForm />
    </div>
  );
}
