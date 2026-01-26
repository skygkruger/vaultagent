'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - PRICING PAGE
//  Pastel Retro Terminal Design
// ═══════════════════════════════════════════════════════════════

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const colors = {
    bg: '#1a1a2e',
    bgLight: '#252542',
    text: '#e8e3e3',
    muted: '#6e6a86',
    mint: '#a8d8b9',
    lavender: '#c4a7e7',
    coral: '#eb6f92',
    cyan: '#7eb8da',
    cream: '#ffe9b0',
  };

  const plans = [
    {
      name: 'FREE',
      icon: 'F',
      price: { monthly: 0, yearly: 0 },
      description: 'Perfect for personal projects',
      color: colors.muted,
      features: [
        { text: '1 vault', included: true },
        { text: '10 secrets', included: true },
        { text: '50 sessions/day', included: true },
        { text: 'Basic audit log', included: true },
        { text: 'Audit export', included: false },
        { text: 'Team features', included: false },
        { text: 'Priority support', included: false },
      ],
      cta: 'CURRENT PLAN',
      ctaStyle: 'muted',
      stripeLink: null,
    },
    {
      name: 'PRO',
      icon: 'PRO',
      price: { monthly: 9, yearly: 90 },
      description: 'For professional developers',
      color: colors.mint,
      recommended: true,
      features: [
        { text: '5 vaults', included: true },
        { text: '100 secrets', included: true },
        { text: 'Unlimited sessions', included: true },
        { text: 'Full audit log', included: true },
        { text: 'Audit export (JSON/CSV)', included: true },
        { text: 'Team features', included: false },
        { text: 'Email support', included: true },
      ],
      cta: 'UPGRADE TO PRO',
      ctaStyle: 'primary',
      stripeLink: '#stripe-pro-link', // TODO: Replace with actual Stripe link
    },
    {
      name: 'TEAM',
      icon: 'T',
      price: { monthly: 29, yearly: 290 },
      description: 'For growing teams',
      color: colors.lavender,
      features: [
        { text: '20 vaults', included: true },
        { text: '500 secrets', included: true },
        { text: 'Unlimited sessions', included: true },
        { text: 'Full audit log', included: true },
        { text: 'Audit export + API', included: true },
        { text: 'Team sharing', included: true },
        { text: 'Role-based access', included: true },
        { text: 'Priority support', included: true },
      ],
      cta: 'START TEAM PLAN',
      ctaStyle: 'secondary',
      stripeLink: '#stripe-team-link', // TODO: Replace with actual Stripe link
    },
    {
      name: 'ENTERPRISE',
      icon: 'E',
      price: { monthly: 99, yearly: 990 },
      description: 'For large organizations',
      color: colors.cyan,
      features: [
        { text: 'Unlimited vaults', included: true },
        { text: 'Unlimited secrets', included: true },
        { text: 'Unlimited sessions', included: true },
        { text: 'Advanced audit + compliance', included: true },
        { text: 'SSO integration (SAML/OIDC)', included: true },
        { text: 'Custom retention policies', included: true },
        { text: 'Dedicated support', included: true },
        { text: 'Self-hosted option', included: true },
      ],
      cta: 'CONTACT SALES',
      ctaStyle: 'enterprise',
      stripeLink: null, // Contact sales instead
    },
  ];

  const faqs = [
    {
      question: 'Can I change plans at any time?',
      answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate the difference.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, Mastercard, American Express) through our secure Stripe integration.',
    },
    {
      question: 'Is there a free trial for paid plans?',
      answer: 'Yes, all paid plans come with a 14-day free trial. No credit card required to start.',
    },
    {
      question: 'What happens to my secrets if I downgrade?',
      answer: 'Your secrets remain encrypted and safe. If you exceed the new plan\'s limits, you\'ll need to remove some before adding new ones.',
    },
    {
      question: 'Do you offer refunds?',
      answer: 'Yes, we offer a 30-day money-back guarantee on all paid plans. No questions asked.',
    },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bg,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
      color: colors.text,
    }}>
      {/* Header */}
      <header style={{
        borderBottom: `1px solid ${colors.muted}`,
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/" style={{ color: colors.mint, fontSize: '18px', textDecoration: 'none' }}>
            VaultAgent
          </Link>
          <span style={{ color: colors.muted }}>|</span>
          <span style={{ color: colors.muted }}>Pricing</span>
        </div>
        <nav style={{ display: 'flex', gap: '24px' }}>
          <Link href="/" style={{ color: colors.muted, textDecoration: 'none' }}>[~] Home</Link>
          <Link href="/docs" style={{ color: colors.muted, textDecoration: 'none' }}>[?] Docs</Link>
          <span style={{ color: colors.mint }}>[$] Pricing</span>
        </nav>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <pre style={{
            color: colors.mint,
            fontSize: '14px',
            lineHeight: '1.2',
            margin: '0 0 24px 0',
            overflow: 'visible',
          }}>
{`╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     [$] SIMPLE, TRANSPARENT PRICING                           ║
║                                                               ║
║         Secure your secrets at any scale                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝`}
          </pre>

          {/* Billing Toggle */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '16px',
            padding: '8px 16px',
            border: `1px solid ${colors.muted}`,
            background: colors.bgLight,
          }}>
            <button
              onClick={() => setBillingCycle('monthly')}
              style={{
                background: billingCycle === 'monthly' ? colors.mint : 'transparent',
                color: billingCycle === 'monthly' ? colors.bg : colors.muted,
                border: 'none',
                padding: '8px 16px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '12px',
              }}
            >
              MONTHLY
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              style={{
                background: billingCycle === 'yearly' ? colors.mint : 'transparent',
                color: billingCycle === 'yearly' ? colors.bg : colors.muted,
                border: 'none',
                padding: '8px 16px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '12px',
              }}
            >
              YEARLY
              <span style={{
                marginLeft: '8px',
                color: billingCycle === 'yearly' ? colors.bg : colors.cream,
                fontSize: '10px',
              }}>
                (2 months free)
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px',
          marginBottom: '64px',
        }}>
          {plans.map((plan) => (
            <div
              key={plan.name}
              style={{
                border: plan.recommended ? `2px solid ${plan.color}` : `1px solid ${colors.muted}`,
                background: colors.bgLight,
                position: 'relative',
              }}
            >
              {plan.recommended && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: plan.color,
                  color: colors.bg,
                  padding: '4px 12px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                }}>
                  RECOMMENDED
                </div>
              )}

              <div style={{ padding: '24px' }}>
                {/* Plan Header */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '48px',
                    height: '48px',
                    border: `2px solid ${plan.color}`,
                    color: plan.color,
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginBottom: '12px',
                  }}>
                    {plan.icon}
                  </div>
                  <h3 style={{ color: plan.color, margin: '0 0 4px 0', fontSize: '18px' }}>
                    {plan.name}
                  </h3>
                  <p style={{ color: colors.muted, margin: 0, fontSize: '12px' }}>
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
                    <span style={{ color: colors.muted, fontSize: '14px' }}>$</span>
                    <span style={{ color: colors.text, fontSize: '36px', fontWeight: 'bold' }}>
                      {billingCycle === 'monthly' ? plan.price.monthly : Math.floor(plan.price.yearly / 12)}
                    </span>
                    <span style={{ color: colors.muted, fontSize: '12px' }}>/mo</span>
                  </div>
                  {billingCycle === 'yearly' && plan.price.yearly > 0 && (
                    <div style={{ color: colors.muted, fontSize: '11px', marginTop: '4px' }}>
                      ${plan.price.yearly}/year (billed annually)
                    </div>
                  )}
                  {plan.price.monthly === 0 && (
                    <div style={{ color: colors.mint, fontSize: '11px', marginTop: '4px' }}>
                      Free forever
                    </div>
                  )}
                </div>

                {/* Features */}
                <div style={{ marginBottom: '24px' }}>
                  {plan.features.map((feature, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 0',
                        borderBottom: i < plan.features.length - 1 ? `1px solid ${colors.bg}` : 'none',
                      }}
                    >
                      <span style={{ color: feature.included ? colors.mint : colors.muted }}>
                        {feature.included ? '[/]' : '[x]'}
                      </span>
                      <span style={{ color: feature.included ? colors.text : colors.muted, fontSize: '12px' }}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                {plan.stripeLink ? (
                  <a
                    href={plan.stripeLink}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '12px',
                      textAlign: 'center',
                      textDecoration: 'none',
                      fontFamily: 'inherit',
                      fontSize: '12px',
                      cursor: 'pointer',
                      border: `1px solid ${plan.color}`,
                      background: plan.ctaStyle === 'primary' ? plan.color : 'transparent',
                      color: plan.ctaStyle === 'primary' ? colors.bg : plan.color,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    [&gt;] {plan.cta}
                  </a>
                ) : plan.name === 'ENTERPRISE' ? (
                  <a
                    href="mailto:sky@veridian.run?subject=VaultAgent Enterprise Inquiry"
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '12px',
                      textAlign: 'center',
                      textDecoration: 'none',
                      fontFamily: 'inherit',
                      fontSize: '12px',
                      cursor: 'pointer',
                      border: `1px solid ${plan.color}`,
                      background: 'transparent',
                      color: plan.color,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    [&gt;] {plan.cta}
                  </a>
                ) : (
                  <div
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '12px',
                      textAlign: 'center',
                      fontFamily: 'inherit',
                      fontSize: '12px',
                      border: `1px solid ${colors.muted}`,
                      background: 'transparent',
                      color: colors.muted,
                    }}
                  >
                    {plan.cta}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Feature Comparison */}
        <div style={{ marginBottom: '64px' }}>
          <pre style={{
            color: colors.mint,
            fontSize: '12px',
            textAlign: 'center',
            margin: '0 0 24px 0',
            overflow: 'visible',
          }}>
{`┌─────────────────────────────────────┐
│  [~] FEATURE COMPARISON             │
└─────────────────────────────────────┘`}
          </pre>

          <div style={{
            border: `1px solid ${colors.muted}`,
            overflow: 'auto',
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12px',
            }}>
              <thead>
                <tr style={{ background: colors.bgLight }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: `1px solid ${colors.muted}`, color: colors.muted }}>
                    FEATURE
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: `1px solid ${colors.muted}`, color: colors.muted }}>
                    FREE
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: `1px solid ${colors.muted}`, color: colors.mint }}>
                    PRO
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: `1px solid ${colors.muted}`, color: colors.lavender }}>
                    TEAM
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: `1px solid ${colors.muted}`, color: colors.cyan }}>
                    ENTERPRISE
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Vaults', '1', '5', '20', 'Unlimited'],
                  ['Secrets', '10', '100', '500', 'Unlimited'],
                  ['Sessions/day', '50', 'Unlimited', 'Unlimited', 'Unlimited'],
                  ['Audit log retention', '7 days', '30 days', '90 days', 'Custom'],
                  ['Audit export', '[x]', '[/]', '[/]', '[/]'],
                  ['API access', '[x]', '[/]', '[/]', '[/]'],
                  ['Team members', '-', '-', '10', 'Unlimited'],
                  ['Role-based access', '[x]', '[x]', '[/]', '[/]'],
                  ['SSO (SAML/OIDC)', '[x]', '[x]', '[x]', '[/]'],
                  ['Self-hosted option', '[x]', '[x]', '[x]', '[/]'],
                  ['Support', 'Community', 'Email', 'Priority', 'Dedicated'],
                ].map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : colors.bgLight }}>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.bg}`, color: colors.text }}>
                      {row[0]}
                    </td>
                    {row.slice(1).map((cell, j) => (
                      <td
                        key={j}
                        style={{
                          padding: '10px 12px',
                          textAlign: 'center',
                          borderBottom: `1px solid ${colors.bg}`,
                          color: cell === '[/]' ? colors.mint : cell === '[x]' ? colors.muted : colors.text,
                        }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div style={{ marginBottom: '64px' }}>
          <pre style={{
            color: colors.mint,
            fontSize: '12px',
            textAlign: 'center',
            margin: '0 0 24px 0',
            overflow: 'visible',
          }}>
{`┌─────────────────────────────────────┐
│  [?] FREQUENTLY ASKED QUESTIONS     │
└─────────────────────────────────────┘`}
          </pre>

          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            {faqs.map((faq, i) => (
              <details
                key={i}
                style={{
                  marginBottom: '8px',
                  border: `1px solid ${colors.muted}`,
                  background: colors.bgLight,
                }}
              >
                <summary style={{
                  padding: '16px',
                  cursor: 'pointer',
                  color: colors.mint,
                  fontSize: '13px',
                  listStyle: 'none',
                }}>
                  [?] {faq.question}
                </summary>
                <div style={{
                  padding: '0 16px 16px 16px',
                  color: colors.text,
                  fontSize: '12px',
                  lineHeight: '1.6',
                }}>
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div style={{ textAlign: 'center' }}>
          <pre style={{
            color: colors.lavender,
            fontSize: '12px',
            margin: '0 0 24px 0',
            overflow: 'visible',
          }}>
{`╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     Ready to secure your AI agent's secrets?                  ║
║                                                               ║
║     Start with our free tier - no credit card required        ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝`}
          </pre>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link
              href="/"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                border: `1px solid ${colors.mint}`,
                background: colors.mint,
                color: colors.bg,
                textDecoration: 'none',
                fontSize: '12px',
              }}
            >
              [&gt;] GET STARTED FREE
            </Link>
            <Link
              href="/docs"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                border: `1px solid ${colors.muted}`,
                background: 'transparent',
                color: colors.text,
                textDecoration: 'none',
                fontSize: '12px',
              }}
            >
              [?] READ THE DOCS
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${colors.muted}`,
        padding: '24px',
        marginTop: '64px',
      }}>
        <div style={{ textAlign: 'center', color: colors.muted, fontSize: '12px' }}>
          <pre style={{ margin: '0 0 16px 0', overflow: 'visible' }}>════════════════════════════════════════════════════════════════════════════════</pre>
          <div style={{ marginBottom: '16px' }}>
            <div>SECURED WITH &lt;3 IN THE TERMINAL</div>
            <div style={{ marginTop: '8px' }}>(c) 2025 VAULTAGENT</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link href="/" className="hover:text-[#a8d8b9] transition-colors" style={{ color: colors.muted, textDecoration: 'none' }}>[HOME]</Link>
            <Link href="/docs" className="hover:text-[#a8d8b9] transition-colors" style={{ color: colors.muted, textDecoration: 'none' }}>[DOCS]</Link>
            <Link href="/pricing" className="hover:text-[#a8d8b9] transition-colors" style={{ color: colors.muted, textDecoration: 'none' }}>[PRICING]</Link>
            <a href="https://github.com/skygkruger" target="_blank" rel="noopener noreferrer" className="hover:text-[#a8d8b9] transition-colors" style={{ color: colors.muted, textDecoration: 'none' }}>[GITHUB]</a>
            <a href="https://x.com/run_veridian" target="_blank" rel="noopener noreferrer" className="hover:text-[#a8d8b9] transition-colors" style={{ color: colors.muted, textDecoration: 'none' }}>[X]</a>
            <a href="mailto:sky@veridian.run" className="hover:text-[#a8d8b9] transition-colors" style={{ color: colors.muted, textDecoration: 'none' }}>[CONTACT]</a>
          </div>
          <pre style={{ margin: '16px 0 0 0', overflow: 'visible' }}>════════════════════════════════════════════════════════════════════════════════</pre>
        </div>
      </footer>
    </div>
  );
}
