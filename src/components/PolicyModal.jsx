import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';

// ─── Reusable building blocks ─────────────────────────────────────────────────

function PolicySection({ number, title, children }) {
  return (
    <div className="mb-10">
      {number && (
        <h3 className="text-base font-black font-sora text-brand-dark mb-3 flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-brand-green text-white text-xs font-black flex items-center justify-center shrink-0">
            {number}
          </span>
          {title}
        </h3>
      )}
      {!number && (
        <h3 className="text-base font-black font-sora text-brand-dark mb-3">{title}</h3>
      )}
      <div className="text-sm text-slate-600 leading-relaxed space-y-2 pl-0">{children}</div>
    </div>
  );
}

function BulletList({ items }) {
  return (
    <ul className="space-y-2 mt-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <ChevronRight className="w-3.5 h-3.5 text-brand-green shrink-0 mt-0.5" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Divider() {
  return <div className="w-full h-px bg-slate-100 my-8" />;
}

// ─── Policy Content Components ────────────────────────────────────────────────

function CouponWalletContent() {
  return (
    <div>
      <PolicySection title="Coupon Wallet">
        <p>Each membership category may receive a Promotional Coupon Wallet as per the applicable membership benefits.</p>
      </PolicySection>

      <Divider />

      <PolicySection title="Coupon Usage Rules">
        <BulletList items={[
          'Coupons can be used for up to 30% of the total order value.',
          'The remaining order amount must be paid using approved payment methods.',
          'Coupons cannot be exchanged for cash.',
          'Coupons cannot be withdrawn or transferred.',
          'Coupons are valid only on eligible products and services available on the platform.',
        ]} />
      </PolicySection>

      <Divider />

      <PolicySection title="Eligible Products">
        <p>The Company may specify selected products, services, subscriptions, charging services, digital products, partner offers or marketplace items that qualify for coupon redemption.</p>
        <p className="mt-2">Certain products, promotional offers, discounted items, special campaigns or third-party products may be excluded from coupon usage.</p>
      </PolicySection>

      <Divider />

      <PolicySection title="Coupon Validity">
        <p>Coupon Wallet validity shall be:</p>
        <BulletList items={[
          'Foundation Member: 24 Months',
          'Growth Member: 36 Months',
          'Pioneer Member: 60 Months',
        ]} />
        <p className="mt-2">Unused coupons shall automatically expire after the validity period.</p>
      </PolicySection>

      <Divider />

      <PolicySection title="Fair Usage Policy">
        <p>The Company reserves the right to limit, suspend, modify or discontinue coupon usage in cases of:</p>
        <BulletList items={[
          'Fraudulent activity',
          'Abuse of promotional benefits',
          'Multiple unauthorized accounts',
          'Policy violations',
          'Technical misuse',
        ]} />
      </PolicySection>

      <Divider />

      <PolicySection title="Modification Rights">
        <p>The Company may update coupon eligibility, redemption limits, validity periods and promotional policies from time to time.</p>
      </PolicySection>
    </div>
  );
}

function TermsContent() {
  return (
    <div>
      <PolicySection number="1" title="Acceptance of Terms">
        <p>By accessing, registering or participating in the STOSHI EV Ecosystem Membership Program, you acknowledge that you have read, understood and agreed to these Terms & Conditions and all related Company policies.</p>
      </PolicySection>
      <Divider />

      <PolicySection number="2" title="Membership Eligibility">
        <p>Membership is available to individuals who provide accurate registration information and comply with applicable Company policies.</p>
        <p className="mt-2">The Company reserves the right to approve, reject, suspend or terminate any membership application at its sole discretion.</p>
        <p className="mt-2">Membership is personal in nature and may not be transferred without prior approval from the Company. Each approved member shall be assigned a unique Member ID.</p>
      </PolicySection>
      <Divider />

      <PolicySection number="3" title="Membership Benefits">
        <p>Membership provides access to ecosystem services, promotional programs, community initiatives, utility rewards and other benefits as determined by the Company. Members may receive access to:</p>
        <BulletList items={[
          'Platform services',
          'Community programs',
          'Promotional campaigns',
          'Utility rewards & loyalty benefits',
          'Project-related information',
          'Other ecosystem benefits',
        ]} />
        <p className="mt-2">Benefits may vary according to membership category and may be modified, suspended or discontinued at any time.</p>
      </PolicySection>
      <Divider />

      <PolicySection number="4" title="Promotional Coupon Wallet">
        <p>Members may receive promotional coupon benefits subject to Company policies.</p>
        <BulletList items={[
          'Coupons are promotional incentives only.',
          'Coupons are not cash or cash equivalents.',
          'Coupons cannot be withdrawn, transferred or exchanged for money.',
          'Coupon redemption is subject to product eligibility and applicable redemption limits.',
        ]} />
      </PolicySection>
      <Divider />

      <PolicySection number="5" title="Utility Rewards">
        <p>The Company may, at its sole discretion, provide utility rewards, loyalty incentives, promotional credits or ecosystem benefits from time to time.</p>
        <p className="mt-2">The Company does not guarantee the availability, frequency, quantity or value of any reward. Such rewards are discretionary and subject to Company policies.</p>
      </PolicySection>
      <Divider />

      <PolicySection number="6" title="No Guaranteed Returns">
        <p>The Company does not guarantee:</p>
        <BulletList items={[
          'Fixed income',
          'Assured returns',
          'Monthly earnings or profit sharing',
          'Capital appreciation',
          'Future reward value',
        ]} />
        <p className="mt-2">Membership should not be interpreted as a deposit, investment product, guaranteed return scheme or financial instrument. Members acknowledge that participation does not create any entitlement to guaranteed financial benefits.</p>
      </PolicySection>
      <Divider />

      <PolicySection number="7" title="Member Responsibilities">
        <p>Members agree to:</p>
        <BulletList items={[
          'Provide accurate information.',
          'Maintain the confidentiality of account credentials.',
          'Comply with platform rules, policies and all applicable laws.',
          'Refrain from fraudulent, misleading or abusive activities.',
          'Not create fraudulent or duplicate accounts.',
        ]} />
      </PolicySection>
      <Divider />

      <PolicySection number="8" title="Account Suspension & Termination">
        <p>The Company may suspend, restrict or terminate membership for:</p>
        <BulletList items={[
          'False information or misrepresentation',
          'Fraudulent activities',
          'Policy violations',
          'Abuse of promotional programs',
          'Unauthorized account creation',
          'Activities harmful to the platform or community',
        ]} />
      </PolicySection>
      <Divider />

      <PolicySection number="9" title="Platform Modifications">
        <p>The Company reserves the right to modify, revise, suspend, discontinue or replace any membership feature, reward program, coupon policy, service, campaign or benefit without prior notice, subject to applicable legal requirements.</p>
      </PolicySection>
      <Divider />

      <PolicySection number="10" title="Limitation of Liability">
        <p>To the maximum extent permitted by applicable law, the Company, its directors, officers, employees, agents and affiliates shall not be liable for any indirect, incidental, consequential or speculative losses arising from membership participation or use of the platform.</p>
      </PolicySection>
      <Divider />

      <PolicySection number="11" title="Privacy">
        <p>Member information shall be collected, processed and protected in accordance with the Company's Privacy Policy.</p>
      </PolicySection>
      <Divider />

      <PolicySection number="12" title="Governing Law">
        <p>These Terms & Conditions shall be governed by the laws of India. Any dispute arising out of or relating to the platform shall be subject to the jurisdiction of the competent courts having authority under applicable law.</p>
      </PolicySection>
      <Divider />

      <PolicySection number="13" title="Member Declaration">
        <p>By registering as a member, you confirm that:</p>
        <BulletList items={[
          'You have read and understood these Terms & Conditions.',
          'You agree to abide by all Company policies.',
          'You acknowledge that membership benefits may change from time to time.',
          'You understand that the Company does not guarantee any fixed income, profit or financial return.',
        ]} />
      </PolicySection>
      <Divider />

      <PolicySection number="14" title="Contact Information">
        <p>For support, policy-related queries or membership assistance, members may contact the Company through the official contact channels published on the platform.</p>
      </PolicySection>
    </div>
  );
}

function RefundContent() {
  return (
    <div>
      <PolicySection number="1" title="Introduction">
        <p>This Refund & Cancellation Policy governs membership registrations, promotional benefits, coupon wallets and services offered through the STOSHI EV Ecosystem platform.</p>
        <p className="mt-2">By purchasing any membership, the member agrees to this Policy.</p>
      </PolicySection>
      <Divider />

      <PolicySection number="2" title="Membership Activation">
        <p>Membership shall be considered activated once:</p>
        <BulletList items={[
          'Registration is completed;',
          'Payment is successfully received; and',
          'Membership credentials or benefits are issued by the Company.',
        ]} />
      </PolicySection>
      <Divider />

      <PolicySection number="3" title="Cancellation Requests">
        <p>A member may request cancellation of a membership before activation and issuance of membership benefits.</p>
        <p className="mt-2">The Company reserves the right to review each cancellation request on a case-by-case basis.</p>
      </PolicySection>
      <Divider />

      <PolicySection number="4" title="Refund Eligibility">
        <p>Refunds may be considered only under the following circumstances:</p>
        <BulletList items={[
          'Duplicate payment due to technical error;',
          'Incorrect transaction amount caused by system malfunction;',
          'Payment successfully debited but membership not issued due to verified technical failure;',
          'Any other circumstance specifically approved by the Company.',
        ]} />
      </PolicySection>
      <Divider />

      <PolicySection number="5" title="Non-Refundable Situations">
        <p>Membership fees shall ordinarily be non-refundable once any of the following has occurred:</p>
        <BulletList items={[
          'Membership activation;',
          'Issuance of Member ID;',
          'Access to the member dashboard;',
          'Allocation of promotional coupons, utility rewards or membership benefits;',
          'Use of any platform service or membership benefit.',
        ]} />
      </PolicySection>
      <Divider />

      <PolicySection number="6" title="Promotional Coupon Wallet">
        <p>Promotional Coupon Wallets:</p>
        <BulletList items={[
          'Are promotional benefits only;',
          'Have no cash value;',
          'Cannot be redeemed for cash;',
          'Cannot be refunded, transferred or exchanged;',
          'May expire according to the applicable validity period.',
        ]} />
      </PolicySection>
      <Divider />

      <PolicySection number="7" title="Processing Time">
        <p>Approved refunds, where applicable, may be processed within a reasonable period through the original payment method used by the member, subject to banking and payment gateway timelines.</p>
      </PolicySection>
      <Divider />

      <PolicySection number="8" title="Company Rights">
        <p>The Company reserves the right to:</p>
        <BulletList items={[
          'Approve or reject refund requests;',
          'Verify transaction details;',
          'Request supporting documentation;',
          'Investigate misuse, fraud or policy violations.',
        ]} />
      </PolicySection>
      <Divider />

      <PolicySection number="9" title="Fraudulent Claims">
        <p>Any refund request found to involve misrepresentation, abuse of policies, fraudulent activity or unauthorized transactions may be rejected and may result in suspension or termination of membership.</p>
      </PolicySection>
      <Divider />

      <PolicySection number="10" title="Modification of Policy">
        <p>The Company reserves the right to amend, revise, suspend or replace this Refund & Cancellation Policy at any time, subject to applicable legal requirements.</p>
      </PolicySection>
      <Divider />

      <PolicySection number="11" title="Contact for Refund Requests">
        <p>Members may submit refund-related requests through the official support channels provided on the platform.</p>
        <p className="mt-2">All requests shall be reviewed in accordance with Company policies and applicable laws.</p>
      </PolicySection>
    </div>
  );
}

// ─── Policy configs ───────────────────────────────────────────────────────────

const POLICIES = {
  coupon: {
    badge: 'Policy',
    title: 'Promotional Coupon Wallet Policy',
    subtitle: 'Understanding your coupon wallet, redemption rules, and validity terms.',
    Content: CouponWalletContent,
  },
  terms: {
    badge: 'Legal',
    title: 'Terms & Conditions',
    subtitle: 'Please read these terms carefully before using the STOSHI platform.',
    Content: TermsContent,
  },
  refund: {
    badge: 'Policy',
    title: 'Refund & Cancellation Policy',
    subtitle: 'Guidelines on cancellations, refund eligibility, and non-refundable scenarios.',
    Content: RefundContent,
  },
};

// ─── Main Modal Component ─────────────────────────────────────────────────────

export default function PolicyModal({ page, onClose }) {
  const policy = POLICIES[page];

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!policy) return null;
  const { badge, title, subtitle, Content } = policy;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-0 sm:px-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="bg-white w-full sm:max-w-3xl rounded-t-[36px] sm:rounded-[36px] overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh]"
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-slate-100 shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold font-sora text-brand-green uppercase tracking-widest block mb-2">
                  {badge}
                </span>
                <h2 className="text-xl sm:text-2xl font-black font-sora text-brand-dark leading-tight">
                  {title}
                </h2>
                <p className="text-xs text-slate-500 mt-1.5 font-medium">{subtitle}</p>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer mt-1"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 px-8 py-8">
            <Content />
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-slate-100 shrink-0 bg-slate-50/80">
            <p className="text-[11px] text-slate-400 font-medium text-center">
              © {new Date().getFullYear()} Stoshi Green Energy Private Limited · All Rights Reserved
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Export policy keys for use in Footer/App
export const POLICY_KEYS = Object.keys(POLICIES);
