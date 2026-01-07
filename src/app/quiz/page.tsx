import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/app-header";

export default function QuizPage() {
  return (
    <>
      <AppHeader />
      <main className="container mx-auto mt-10 flex flex-col items-center gap-6">
        <div className="text-center">
            <h1 className="text-4xl font-bold">Quiz Page</h1>
            <p className="text-muted-foreground">This is a placeholder for the quiz feature.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/watch">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back to Video
          </Link>
        </Button>
      </main>
    </>
  );
}
