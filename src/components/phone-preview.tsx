import {
  CellSignalFullIcon,
  BatteryFullIcon,
  ArrowUpRightIcon,
  CheckCircleIcon,
  HouseIcon,
  UsersThreeIcon,
  ReceiptIcon,
  CalendarDotsIcon,
  DotsThreeIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react/ssr";

export function PhonePreview() {
  return (
    <div className="phone" aria-label="Preview of the StokvelOS member dashboard">
      <div className="phone-screen">
        <div className="phone-status">
          <span>9:41</span>
          <span className="phone-island" />
          <span className="phone-connectivity" aria-hidden="true">
            <CellSignalFullIcon size={11} weight="fill" />
            <BatteryFullIcon size={12} weight="fill" />
          </span>
        </div>
        <div className="phone-greeting">
          <span className="avatar warm">NM</span>
          <div>
            <small>Welcome back</small>
            <strong>Naledi Molefe</strong>
          </div>
          <ShieldCheckIcon size={20} />
        </div>
        <div className="phone-balance">
          <span className="eyebrow">Ubuntu Savings Circle</span>
          <div className="phone-amount">
            R 4 300<span>.00</span>
          </div>
          <small>
            <span className="tiny-dot" /> Verified contributions this month
          </small>
          <div className="phone-progress">
            <span />
          </div>
          <div className="phone-progress-label">
            <span>October collection</span>
            <b>72%</b>
          </div>
        </div>
        <div className="phone-actions">
          {[
            { Icon: ArrowUpRightIcon, label: "Report payment" },
            { Icon: ReceiptIcon, label: "Statement" },
            { Icon: CalendarDotsIcon, label: "My rotation" },
          ].map(({ Icon, label }) => (
            <div key={label}>
              <span>
                <Icon size={20} />
              </span>
              <small>{label}</small>
            </div>
          ))}
        </div>
        <div className="phone-payout">
          <div className="flex-between">
            <span>Next scheduled payout</span>
            <ArrowUpRightIcon size={17} />
          </div>
          <strong>
            R 6 000<span>.00</span>
          </strong>
          <div className="flex-between">
            <div>
              <b>Thandi Nkosi</b>
              <small>25 October 2026</small>
            </div>
            <span className="avatar mint">TN</span>
          </div>
          <span className="phone-payout-note">Subject to funds & committee approval</span>
        </div>
        <div className="phone-list-title">
          Your contributions{" "}
          <span>
            View all <ArrowUpRightIcon size={9} />
          </span>
        </div>
        {["September", "August"].map((month) => (
          <div className="phone-receipt" key={month}>
            <span className="mini-icon">
              <CheckCircleIcon size={20} />
            </span>
            <div>
              <b>{month} contribution</b>
              <small>Verified against bank evidence</small>
            </div>
            <strong>R 500.00</strong>
          </div>
        ))}
        <div className="phone-nav">
          {[HouseIcon, UsersThreeIcon, ReceiptIcon, CalendarDotsIcon, DotsThreeIcon].map(
            (Icon, i) => (
              <span key={i} className={i === 0 ? "selected" : ""}>
                <Icon size={20} weight={i === 0 ? "fill" : "regular"} />
              </span>
            ),
          )}
        </div>
        <div className="phone-homebar" />
      </div>
    </div>
  );
}
