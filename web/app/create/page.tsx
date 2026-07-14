import Link from "next/link";
import { CreateEscrowForm } from "@/components/CreateEscrowForm";

export default function CreatePage() {
  return (
    <div>
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M15 18l-6-6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back to marketplace
      </Link>
      <CreateEscrowForm />
    </div>
  );
}
