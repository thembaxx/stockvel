import Link from "next/link";
import { ArrowUpRightIcon } from "@phosphor-icons/react/ssr";
import { Brand } from "@/components/brand";
import { publicPageMetadata } from "@/lib/site";
export const metadata = publicPageMetadata("/privacy");
export default function Privacy() {
  return (
    <main className="policy-page" id="main-content">
      <Brand />
      <h1>Prototype privacy</h1>
      <p>
        This StokvelOS prototype uses fictional society, member and financial records. Changes are
        held in browser memory and reset when you refresh. Do not enter real identity, banking,
        death-related or financial information.
      </p>
      <p>
        The prototype does not offer account registration, store documents, transmit payments or
        send automated messages. Downloaded reports contain sample data. WhatsApp sharing opens an
        aggregate preview; you choose whether to send it in WhatsApp.
      </p>
      <p>
        Fonts and the demonstration photograph are served locally. No analytics or advertising
        trackers are included. Your hosting provider may retain standard request logs. A production
        POPIA privacy notice, processing terms and retention policy must be completed before real
        societies are onboarded.
      </p>
      <Link className="button button-primary" href="/demo">
        Back to the demo <ArrowUpRightIcon size={17} />
      </Link>
    </main>
  );
}
