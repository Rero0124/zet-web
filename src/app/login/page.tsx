import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-sm flex-col justify-center px-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Zet 로그인</h1>
        <p className="mt-2 text-sm text-muted">제품 트렌드를 만나보세요</p>
      </div>
      <LoginForm />
    </div>
  );
}
