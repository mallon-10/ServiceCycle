import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirme seu e-mail</CardTitle>
        <CardDescription>
          Enviamos um link de confirmação
          {email ? (
            <>
              {" "}
              para <span className="font-medium">{email}</span>
            </>
          ) : (
            " para o e-mail informado"
          )}
          . Clique no link para ativar sua conta e depois faça login.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/login" className="text-sm underline underline-offset-4">
          Já confirmei — ir para o login
        </Link>
      </CardContent>
    </Card>
  );
}
