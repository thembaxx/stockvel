import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRightIcon,
  ArrowRightIcon,
  CheckIcon,
  ShieldCheckIcon,
  UsersThreeIcon,
  HeartIcon,
  ReceiptIcon,
  BankIcon,
  WhatsappLogoIcon,
  ListChecksIcon,
  LockKeyIcon,
} from "@phosphor-icons/react/ssr";
import { Brand } from "@/components/brand";
import { PhonePreview } from "@/components/phone-preview";
import { Intro, HeroPhone, SectionReveal } from "@/components/motion";

const features = [
  {
    Icon: ReceiptIcon,
    number: "01",
    title: "Every contribution.\nA clear record.",
    body: "Keep reported, verified and outstanding payments in view. Less guesswork. More confidence.",
    className: "feature-mint",
    visual: "ledger",
  },
  {
    Icon: ListChecksIcon,
    number: "02",
    title: "Shared decisions.\nStronger trust.",
    body: "Give your committee a clear approval process, with a record of who decided what and why.",
    className: "feature-ivory",
    visual: "approval",
  },
  {
    Icon: WhatsappLogoIcon,
    number: "03",
    title: "Keep your people\nin the picture.",
    body: "Share a group-safe update on WhatsApp. Give each member a private view of their own contributions.",
    className: "feature-green",
    visual: "share",
  },
];

export default function Home() {
  return (
    <main className="marketing" id="main-content">
      <section className="hero" id="top">
        <nav className="marketing-nav">
          <Brand />
          <div className="nav-links">
            <a href="#features">The platform</a>
            <a href="#societies">Your society</a>
            <a href="#pricing">Pricing</a>
          </div>
          <Link className="button button-light" href="/demo">
            Explore the demo <ArrowUpRightIcon size={17} />
          </Link>
        </nav>
        <div className="hero-grid">
          <Intro className="hero-copy">
            <span className="pill">
              <span className="tiny-dot" /> Built for South African communities
            </span>
            <h1>
              Good things
              <br />
              grow <em>together.</em>
            </h1>
            <p>
              Your people. Your contributions. One clear picture.
              <br className="desktop-break" /> A calmer way to manage your stokvel or burial
              society.
            </p>
            <div className="hero-buttons">
              <Link href="/demo" className="button button-primary">
                Meet your new dashboard <ArrowUpRightIcon size={19} />
              </Link>
              <a href="#how" className="text-link">
                See how it works <ArrowRightIcon size={17} />
              </a>
            </div>
            <div className="hero-proof">
              <div className="avatar-stack">
                <span className="avatar warm">NM</span>
                <span className="avatar sage">SD</span>
                <span className="avatar cream">TN</span>
              </div>
              <span>
                Designed for the people
                <br />
                <b>who keep their communities moving.</b>
              </span>
            </div>
          </Intro>
          <div className="hero-art">
            <div className="hero-orbit orbit-one" />
            <div className="hero-orbit orbit-two" />
            <div className="float-card float-verified">
              <span className="float-icon">
                <ShieldCheckIcon size={22} />
              </span>
              <div>
                <small>Clarity at every step</small>
                <b>Reported. Verified. Recorded.</b>
              </div>
              <CheckIcon size={17} />
            </div>
            <HeroPhone>
              <PhonePreview />
            </HeroPhone>
            <div className="float-card float-collected">
              <div className="flex-between">
                <span className="eyebrow">October contributions</span>
                <ArrowUpRightIcon size={16} />
              </div>
              <strong>
                R 4 300<span>.00</span>
              </strong>
              <div className="mini-chart">
                {[35, 52, 43, 70, 60, 90, 77].map((h, i) => (
                  <span style={{ height: `${h}%` }} key={i} />
                ))}
              </div>
              <small>Verified records. A shared view.</small>
            </div>
            <span className="hero-art-caption">A little less admin. A lot more together.</span>
          </div>
        </div>
        <div className="hero-strip">
          <span>One platform. A shared foundation of trust.</span>
          <div>
            <UsersThreeIcon size={20} /> Rotating stokvels
          </div>
          <div>
            <HeartIcon size={20} /> Burial societies
          </div>
          <div>
            <BankIcon size={20} /> Your existing bank account
          </div>
        </div>
      </section>
      <section id="features" className="marketing-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">COMMUNITY MONEY, MADE CLEAR</span>
            <h2>
              Less chasing.
              <br />
              <em>More peace of mind.</em>
            </h2>
          </div>
          <p>
            Everything your committee needs to keep good records, make shared decisions and bring
            members along.
          </p>
        </div>
        <SectionReveal>
          <div className="feature-grid">
            {features.map(({ Icon, number, title, body, className, visual }) => (
              <article key={number} className={`feature-card ${className}`}>
                <div className="flex-between">
                  <Icon size={30} weight="light" />
                  <span className="feature-number">{number}</span>
                </div>
                <h3>
                  {title.split("\n").map((line, i) => (
                    <span key={line}>
                      {i > 0 && <br />}
                      {line}
                    </span>
                  ))}
                </h3>
                <p>{body}</p>
                <div className={`feature-visual ${visual}`}>
                  {visual === "ledger" ? (
                    <>
                      <div className="visual-row">
                        <span className="avatar mint">TN</span>
                        <div>
                          <b>Thandi Nkosi</b>
                          <small>October contribution</small>
                        </div>
                        <span className="status verified">Verified</span>
                      </div>
                      <div className="visual-row">
                        <span className="avatar cream">LM</span>
                        <div>
                          <b>Lerato Mokoena</b>
                          <small>Awaiting bank evidence</small>
                        </div>
                        <span className="status reported">Reported</span>
                      </div>
                    </>
                  ) : visual === "approval" ? (
                    <>
                      <span className="eyebrow">NEXT PAYOUT · 25 OCT</span>
                      <div className="visual-amount">R 6 000.00</div>
                      <div className="approval-line">
                        <span className="avatar sage">SD</span>
                        <span>Committee review</span>
                        <span className="status reported">1 of 2</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="message-label">
                        <WhatsappLogoIcon size={17} /> Society update
                      </span>
                      <p>
                        <span className="message-society">
                          <UsersThreeIcon size={12} /> Ubuntu Savings Circle
                        </span>
                        <br />
                        October contributions: R 4 300 verified.
                        <br />
                        Next payout: scheduled for 25 October.
                      </p>
                      <small>Aggregate summary · No private member details</small>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        </SectionReveal>
      </section>
      <section id="societies" className="society-section">
        <div className="section-center">
          <span className="eyebrow">ONE COMMUNITY. MANY WAYS TO CARE.</span>
          <h2>
            However you come together,
            <br />
            <em>we’re here for your society.</em>
          </h2>
          <p>One shared foundation. Workflows that fit the way your group works.</p>
        </div>
        <div className="society-cards">
          <article>
            <span className="society-icon">
              <UsersThreeIcon size={30} weight="light" />
            </span>
            <span className="eyebrow">ROTATING SAVINGS</span>
            <h3>
              A shared goal.
              <br />
              Everyone’s turn.
            </h3>
            <p>
              Track monthly contributions, keep the agreed rotation in view and prepare each payout
              for committee approval.
            </p>
            <Link href="/demo/payouts" className="text-link">
              Explore rotating stokvels <ArrowUpRightIcon size={18} />
            </Link>
            <div className="rotation-mini">
              <span className="avatar warm">NM</span>
              <span className="rotation-dash" />
              <span className="avatar mint active">TN</span>
              <span className="rotation-dash" />
              <span className="avatar cream">LM</span>
              <span className="rotation-dash" />
              <span className="avatar sage">SD</span>
            </div>
          </article>
          <article>
            <span className="society-icon">
              <HeartIcon size={30} weight="light" />
            </span>
            <span className="eyebrow">BURIAL SOCIETIES</span>
            <h3>
              Care for your people.
              <br />
              Clarity for your committee.
            </h3>
            <p>
              Manage covered persons, review waiting periods and administer benefit requests under
              your society’s rules.
            </p>
            <Link href="/demo/benefits" className="text-link">
              Explore burial societies <ArrowUpRightIcon size={18} />
            </Link>
            <div className="benefit-mini">
              <ShieldCheckIcon size={23} />
              <div>
                <b>A thoughtful review, at every step.</b>
                <small>Your rules. Your committee’s decision.</small>
              </div>
            </div>
          </article>
        </div>
      </section>
      <section id="how" className="marketing-section how-section">
        <div className="how-photo">
          <Image
            src="/community-phone.png"
            alt="Illustrative South African lifestyle portrait of a woman using her phone in the city"
            fill
            sizes="(max-width: 760px) 100vw, 50vw"
          />
          <div className="photo-caption">
            <span className="eyebrow">BUILT AROUND COMMUNITY</span>
            <h3>
              More time for
              <br />
              <em>what brings you together.</em>
            </h3>
          </div>
        </div>
        <div className="how-copy">
          <span className="eyebrow">A FAMILIAR WAY FORWARD</span>
          <h2>
            Your society.
            <br />
            <em>A clearer next chapter.</em>
          </h2>
          <p>
            Keep your bank account. Keep your constitution. Give your records a home that everyone
            can understand.
          </p>
          {[
            {
              n: "01",
              t: "Bring your society together",
              d: "Choose your society type, add your committee and set your contribution rules.",
            },
            {
              n: "02",
              t: "Start with what you have",
              d: "Bring in members and review opening balances. Historical imports stay clearly labelled.",
            },
            {
              n: "03",
              t: "Make the next cycle clearer",
              d: "Record payments, verify bank evidence and prepare a transparent monthly report.",
            },
          ].map(({ n, t, d }) => (
            <div className="how-step" key={n}>
              <span>{n}</span>
              <div>
                <h4>{t}</h4>
                <p>{d}</p>
              </div>
            </div>
          ))}
          <Link href="/demo" className="button button-primary">
            Take a look inside <ArrowUpRightIcon size={18} />
          </Link>
        </div>
      </section>
      <section className="trust-strip">
        <ShieldCheckIcon size={30} weight="light" />
        <div>
          <h3>Trust starts with a clear record.</h3>
          <p>Your society holds its money. StokvelOS helps you administer it.</p>
        </div>
        <span>
          <LockKeyIcon size={17} /> No wallets. No automatic transfers.
        </span>
      </section>
      <section id="pricing" className="marketing-section pricing-section">
        <div className="section-center">
          <span className="eyebrow">ROOM FOR EVERY COMMUNITY</span>
          <h2>
            Simple plans.
            <br />
            <em>Stronger societies.</em>
          </h2>
          <p>Proposed pilot pricing. Subscriptions are not yet open for purchase.</p>
        </div>
        <div className="pricing-grid">
          {[
            {
              n: "Community",
              p: "Free",
              d: "A simple place to start.",
              items: ["Up to 10 members", "One society", "Manual contribution tracking"],
              hot: false,
            },
            {
              n: "Plus",
              p: "R 79",
              d: "For groups growing together.",
              items: [
                "Up to 40 members",
                "Contribution ledger & reports",
                "Rotating payout schedules",
              ],
              hot: true,
            },
            {
              n: "Society",
              p: "R 199",
              d: "More support. More clarity.",
              items: [
                "Up to 150 members",
                "Burial benefit workflows",
                "Committee approvals & records",
              ],
              hot: false,
            },
          ].map((plan) => (
            <article key={plan.n} className={`price-card ${plan.hot ? "price-featured" : ""}`}>
              <div className="flex-between">
                <h3>{plan.n}</h3>
                {plan.hot && <span className="price-tag">For your next chapter</span>}
              </div>
              <p>{plan.d}</p>
              <div className="price">
                {plan.p}
                <span>{plan.p !== "Free" ? " / month" : " forever"}</span>
              </div>
              <Link
                className={`button ${plan.hot ? "button-light" : "button-outline"}`}
                href="/demo"
              >
                Explore the demo <ArrowUpRightIcon size={17} />
              </Link>
              <ul>
                {plan.items.map((item) => (
                  <li key={item}>
                    <CheckIcon size={16} />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="pricing-note">
          Manage several societies? Proposed Administrator plan from R499/month. Automated messaging
          priced separately.
        </p>
      </section>
      <section className="campaign-section" aria-label="A clearer everyday society experience">
        <article className="campaign-brand">
          <Brand light />
          <h3>
            Less managing.
            <br />
            <em>More together.</em>
          </h3>
          <p>Good records leave more room for the people who matter.</p>
          <Link href="/demo" className="button button-light">
            Explore your workspace <ArrowUpRightIcon size={17} />
          </Link>
          <span>stokvelos · built around your community</span>
        </article>
        <article className="campaign-photo">
          <Image
            src="/community-phone.png"
            alt="A woman in a blue cardigan checking her phone outdoors"
            fill
            sizes="(max-width: 760px) 100vw, 45vw"
          />
          <div className="campaign-photo-label">
            <Brand />
            <span>
              Your society.
              <br />
              Always in the picture.
            </span>
          </div>
        </article>
        <article className="campaign-record">
          <span className="campaign-orb">
            <ShieldCheckIcon size={33} weight="light" />
          </span>
          <h3>
            Good records.
            <br />
            <em>Shared confidence.</em>
          </h3>
          <p>Every contribution, every decision, clearly recorded.</p>
          <Link href="/demo/contributions" className="text-link">
            Take a closer look <ArrowUpRightIcon size={17} />
          </Link>
        </article>
      </section>
      <section className="final-cta">
        <span className="eyebrow">BETTER RECORDS. BETTER TOGETHER.</span>
        <h2>
          Built for your people.
          <br />
          <em>Ready for your next chapter.</em>
        </h2>
        <Link href="/demo" className="button button-primary">
          Explore StokvelOS <ArrowUpRightIcon size={19} />
        </Link>
        <p>Interactive prototype · Sample data · No live financial transactions</p>
      </section>
      <footer className="marketing-footer">
        <Brand />
        <span>Community money. Clearly recorded.</span>
        <div>
          <Link href="/privacy">Privacy</Link>
          <Link href="/demo">
            Try the demo <ArrowUpRightIcon size={12} />
          </Link>
          <span>2026 StokvelOS</span>
        </div>
      </footer>
    </main>
  );
}
