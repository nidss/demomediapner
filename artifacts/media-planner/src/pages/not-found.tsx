import { Link } from "wouter";
import { RiArrowLeftLine } from "react-icons/ri";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="text-8xl font-black text-primary/20 mb-4">404</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Page not found</h1>
        <p className="text-muted-foreground mb-6">The page you're looking for doesn't exist.</p>
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
          <RiArrowLeftLine /> Back to Calendar
        </Link>
      </div>
    </div>
  );
}
