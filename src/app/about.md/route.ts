import { markdownResponse, productMarkdown } from "@/lib/public-content";

export const dynamic = "force-static";

export function GET() {
  return markdownResponse(productMarkdown());
}
