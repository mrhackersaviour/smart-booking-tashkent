import { useState } from 'react';
import {
  ArrowRight, Search, Mail, User, Calendar, Heart, Star, Settings,
  Crown, Sparkles, Phone, Lock, Bell,
} from 'lucide-react';
import { Button, Input, Card, Badge, Avatar, Container } from '../components/ui';

/**
 * DesignSystem — internal showcase for "The Kinetic Curator" design system.
 *
 * Demonstrates every base UI primitive (Button, Input, Card, Badge, Avatar,
 * Container) plus the full color palette so designers and engineers can
 * verify visual consistency and reach for the right token.
 *
 * Route: /design-system
 */

// Color palette pulled from tailwind.config.js (the `*` token namespace).
const PALETTE = {
  Surface: [
    { name: 'surface', hex: '#f8f9fa', token: 'bg-surface', textOnDark: false },
    { name: 'surface-low', hex: '#f3f4f5', token: 'bg-surface-container-low' },
    { name: 'surface-container', hex: '#edeeef', token: 'bg-surface-container' },
    { name: 'surface-high', hex: '#e7e8e9', token: 'bg-surface-container-high' },
    { name: 'surface-highest', hex: '#e1e3e4', token: 'bg-surface-container-highest' },
    { name: 'surface-lowest', hex: '#ffffff', token: 'bg-surface-container-lowest' },
    { name: 'surface-dim', hex: '#d9dadb', token: 'bg-surface-dim' },
    { name: 'inverse-surface', hex: '#2e3132', token: 'bg-inverse-surface', textOnDark: true },
  ],
  Primary: [
    { name: 'primary', hex: '#2346d5', token: 'bg-primary', textOnDark: true },
    { name: 'primary-container', hex: '#4361ee', token: 'bg-primary-container', textOnDark: true },
    { name: 'on-primary', hex: '#ffffff', token: 'bg-on-primary' },
    { name: 'on-primary-container', hex: '#f4f2ff', token: 'bg-on-primary-container' },
    { name: 'inverse-primary', hex: '#bac3ff', token: 'bg-inverse-primary' },
  ],
  Secondary: [
    { name: 'secondary', hex: '#5d5c74', token: 'bg-secondary', textOnDark: true },
    { name: 'secondary-container', hex: '#e2e0fc', token: 'bg-secondary-container' },
    { name: 'on-secondary', hex: '#ffffff', token: 'bg-on-secondary' },
    { name: 'on-secondary-fixed', hex: '#1a1a2e', token: 'bg-on-secondary-fixed', textOnDark: true },
  ],
  Tertiary: [
    { name: 'tertiary', hex: '#933c00', token: 'bg-tertiary', textOnDark: true },
    { name: 'tertiary-container', hex: '#ba4e00', token: 'bg-tertiary-container', textOnDark: true },
  ],
  Text: [
    { name: 'on-surface', hex: '#191c1d', token: 'bg-on-surface', textOnDark: true },
    { name: 'on-surface-variant', hex: '#444655', token: 'bg-on-surface-variant', textOnDark: true },
    { name: 'on-background', hex: '#191c1d', token: 'bg-on-background', textOnDark: true },
  ],
  Outline: [
    { name: 'outline', hex: '#747686', token: 'bg-outline', textOnDark: true },
    { name: 'outline-variant', hex: '#c4c5d7', token: 'bg-outline-variant' },
  ],
  Status: [
    { name: 'error', hex: '#ba1a1a', token: 'bg-error', textOnDark: true },
  ],
};

function Section({ title, eyebrow, children }) {
  return (
    <section className="space-y-6">
      <div>
        {eyebrow && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">
            {eyebrow}
          </p>
        )}
        <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">{title}</h2>
      </div>
      <Card tier="lowest" padding="lg">
        {children}
      </Card>
    </section>
  );
}

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4 md:gap-8 py-5 first:pt-0 last:pb-0">
      <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pt-2">
        {label}
      </div>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

function Swatch({ name, hex, token, textOnDark }) {
  const text = textOnDark ? 'text-white' : 'text-on-surface';
  return (
    <div className="rounded-2xl overflow-hidden">
      <div className={`${token} h-24 flex items-end p-3 ${text}`}>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{hex}</p>
        </div>
      </div>
      <div className="bg-surface-container-low p-3 space-y-0.5">
        <p className="text-xs font-bold text-on-surface">{name}</p>
        <p className="text-[10px] text-outline font-mono">{token.replace('bg-', '')}</p>
      </div>
    </div>
  );
}

export default function DesignSystem() {
  const [textValue, setTextValue] = useState('');
  const [floatingValue, setFloatingValue] = useState('jane@smartbook.uz');
  const [errorValue, setErrorValue] = useState('not-an-email');

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 bg-surface min-h-screen pb-24">
      {/* HERO */}
      <div className="bg-surface-container-low">
        <Container size="7xl" asymmetric>
          <div className="py-16">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-4">
              Design System · v1.0
            </p>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-on-surface mb-4 leading-[1.05]">
              SmartBook<br />Tashkent
            </h1>
            <p className="text-lg text-on-surface-variant max-w-xl">
              Foundation primitives for the venue booking platform. Tonal layering,
              gradient CTAs, ghost borders — built with React + Tailwind.
            </p>
          </div>
        </Container>
      </div>

      <Container size="7xl">
        <div className="space-y-16 mt-12">
          {/* ===== BUTTONS ===== */}
          <Section eyebrow="01 · Components" title="Buttons">
            <div className="divide-y divide-outline-variant/0">
              <Row label="Variants">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="tertiary">Tertiary</Button>
                <Button variant="ghost">Ghost</Button>
              </Row>
              <Row label="Sizes">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </Row>
              <Row label="With icon">
                <Button icon={Search}>Search</Button>
                <Button iconRight={ArrowRight} variant="primary">Continue</Button>
                <Button icon={Heart} variant="secondary">Favorite</Button>
                <Button icon={Star} variant="tertiary">Rate</Button>
              </Row>
              <Row label="States">
                <Button loading>Loading</Button>
                <Button disabled>Disabled</Button>
                <Button variant="secondary" disabled>Disabled</Button>
              </Row>
              <Row label="Full width">
                <div className="w-full max-w-md">
                  <Button fullWidth iconRight={ArrowRight}>Book Now</Button>
                </div>
              </Row>
            </div>
          </Section>

          {/* ===== INPUTS ===== */}
          <Section eyebrow="02 · Components" title="Inputs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
              <Input
                label="Full Name"
                placeholder="Jane Doe"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                icon={User}
              />
              <Input
                label="Email"
                type="email"
                placeholder="you@smartbook.uz"
                icon={Mail}
                required
              />
              <Input
                label="Phone Number"
                type="tel"
                placeholder="+998 ..."
                icon={Phone}
                hint="We'll only use this for booking confirmations."
              />
              <Input
                label="Email"
                type="email"
                value={errorValue}
                onChange={(e) => setErrorValue(e.target.value)}
                icon={Mail}
                error="Enter a valid email address"
              />
              <div className="md:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                  Floating Label Variant
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    floating
                    label="Email Address"
                    type="email"
                    value={floatingValue}
                    onChange={(e) => setFloatingValue(e.target.value)}
                    icon={Mail}
                  />
                  <Input
                    floating
                    label="Search venues"
                    icon={Search}
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* ===== CARDS ===== */}
          <Section eyebrow="03 · Components" title="Cards">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card tier="lowest" padding="md">
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Layer 2</p>
                <h4 className="font-bold text-on-surface mb-1">Lowest (white)</h4>
                <p className="text-sm text-on-surface-variant">Primary lifted card surface.</p>
              </Card>
              <Card tier="low" padding="md">
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Layer 1</p>
                <h4 className="font-bold text-on-surface mb-1">Low (#f3f4f5)</h4>
                <p className="text-sm text-on-surface-variant">Recessed grouping container.</p>
              </Card>
              <Card tier="high" padding="md">
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Layer 3</p>
                <h4 className="font-bold text-on-surface mb-1">High (#e7e8e9)</h4>
                <p className="text-sm text-on-surface-variant">Sidebar / utility panel.</p>
              </Card>
              <Card interactive padding="md">
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Interactive</p>
                <h4 className="font-bold text-on-surface mb-1">Hover for ambient lift</h4>
                <p className="text-sm text-on-surface-variant">Ambient shadow appears only on hover (Double-Drop spec).</p>
              </Card>
              <Card padding="lg" className="md:col-span-2">
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Padding lg + flex</p>
                <h4 className="font-bold text-on-surface mb-3">Composing with primitives</h4>
                <div className="flex items-center gap-4">
                  <Avatar name="Julian Voss" size="md" />
                  <div className="flex-1">
                    <p className="font-bold text-sm text-on-surface">Julian Voss</p>
                    <p className="text-xs text-on-surface-variant">Gold tier · 2,450 pts</p>
                  </div>
                  <Badge variant="primary">Verified</Badge>
                </div>
              </Card>
            </div>
          </Section>

          {/* ===== BADGES ===== */}
          <Section eyebrow="04 · Components" title="Badges">
            <div className="space-y-0">
              <Row label="Variants">
                <Badge variant="neutral">Neutral</Badge>
                <Badge variant="primary">Primary</Badge>
                <Badge variant="accent">Accent</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="error">Error</Badge>
              </Row>
              <Row label="Sizes">
                <Badge size="sm">Small</Badge>
                <Badge size="md">Medium</Badge>
              </Row>
              <Row label="Shapes">
                <Badge shape="pill">Pill</Badge>
                <Badge shape="square">Square</Badge>
              </Row>
              <Row label="With icon">
                <Badge icon={Star} variant="accent">4.8 Rated</Badge>
                <Badge icon={Crown} variant="primary">Gold Tier</Badge>
                <Badge icon={Sparkles} variant="success">New</Badge>
              </Row>
            </div>
          </Section>

          {/* ===== AVATARS ===== */}
          <Section eyebrow="05 · Components" title="Avatars">
            <div className="space-y-0">
              <Row label="Sizes">
                <Avatar name="Jane Doe" size="xs" />
                <Avatar name="Jane Doe" size="sm" />
                <Avatar name="Jane Doe" size="md" />
                <Avatar name="Jane Doe" size="lg" />
                <Avatar name="Jane Doe" size="xl" />
              </Row>
              <Row label="Fallback">
                <Avatar name="Aziz Karimov" />
                <Avatar name="Bobur Saidov" />
                <Avatar name="Charlie Chen" />
                <Avatar name="Diana Ergasheva" />
              </Row>
              <Row label="With ring">
                <Avatar name="Elena Vance" ring />
                <Avatar name="Marcus Chen" size="lg" ring />
              </Row>
            </div>
          </Section>

          {/* ===== CONTAINERS ===== */}
          <Section eyebrow="06 · Layout" title="Container">
            <div className="space-y-4">
              <p className="text-sm text-on-surface-variant max-w-2xl">
                Use <code className="text-primary font-mono text-xs">Container</code> for
                page-level wrappers. Pass <code className="text-primary font-mono text-xs">asymmetric</code>
                {' '}for editorial hero sections (heavier right padding).
              </p>
              <div className="bg-surface-container-low rounded-2xl py-2">
                <Container size="md" flush>
                  <div className="bg-surface-container-lowest rounded-xl p-6 my-4">
                    <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Symmetric</p>
                    <p className="text-sm text-on-surface-variant">Standard responsive padding (`px-4 sm:px-6 lg:px-8`).</p>
                  </div>
                </Container>
              </div>
              <div className="bg-surface-container-low rounded-2xl py-2">
                <Container size="md" flush asymmetric>
                  <div className="bg-surface-container-lowest rounded-xl p-6 my-4">
                    <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Asymmetric</p>
                    <p className="text-sm text-on-surface-variant">Editorial-feel padding — heavier on the right.</p>
                  </div>
                </Container>
              </div>
            </div>
          </Section>

          {/* ===== PALETTE ===== */}
          <Section eyebrow="07 · Foundation" title="Color Palette">
            <div className="space-y-10">
              {Object.entries(PALETTE).map(([group, swatches]) => (
                <div key={group}>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-4">
                    {group}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {swatches.map((s) => <Swatch key={s.name} {...s} />)}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </Container>
    </div>
  );
}
