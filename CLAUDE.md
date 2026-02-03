# Project: Venue Booking Platform

## Stack
- **Vite + React** (JSX, not TSX unless noted)
- **Tailwind CSS v3** (config: `tailwind.config.js`)
- **Routing:** React Router (yoki sizdagi)
- **State:** (sizning state management — Zustand/Redux/Context)

---

## 🎨 Design System: "The Kinetic Curator"

Bu loyiha **Stitch'da yaratilgan dizayn tizimiga** to'liq amal qiladi.

**HAR BIR UI o'zgarishidan oldin SHU FAYLNI o'qi:**
👉 `./design-reference/luxe_horizon/DESIGN.md`

**Har bir sahifa uchun visual reference:**
- Mock screenshots: `./design-reference/<page_name>/screen.png`
- Source HTML (faqat reference uchun, ko'chirma!): `./design-reference/<page_name>/code.html`

---

## 🚫 Mutlaqo qilinmaydigan narsalar (DESIGN.md dan)

1. **❌ 1px solid border ishlatma** content'ni bo'lish uchun.
   - O'rniga: surface tier'larini ishlat (`bg-surface` ustiga `bg-surface-container-low`).

2. **❌ `#000000` yoki `text-black` ishlatma.**
   - O'rniga: `text-on-surface` (#191c1d) yoki `text-on-secondary-fixed` (#1a1a2e).

3. **❌ Default `shadow-md`, `shadow-lg` ishlatma.**
   - O'rniga: `shadow-ambient` (config'da yozilgan Double-Drop shadow).

4. **❌ Divider chiziqlar (`border-t`, `<hr>`) ishlatma list item'lar orasida.**
   - O'rniga: vertical white space (`space-y-6` yoki `space-y-8`).

5. **❌ Card'larga rest holatda shadow qo'yma.**
   - O'rniga: tonal layering (`bg-surface-container-lowest` ustida `bg-surface-container-low`).

6. **❌ Input'larga box border qo'yma.**
   - O'rniga: `bg-surface-container-low` background, focus'da `bg-surface-container-lowest` + ghost border.

---

## ✅ Doimo qilinadigan narsalar

1. **Surface hierarchy** (depth uchun):
   - Layer 0: `bg-surface` (sahifa fon)
   - Layer 1: `bg-surface-container-low` (katta content area)
   - Layer 2: `bg-surface-container-lowest` (asosiy card'lar — eng yuqorida turadi)
   - Layer 3: `bg-surface-container-high` (sidebar, nested panel)

2. **Primary CTA:** har doim gradient — `bg-gradient-to-r from-primary to-primary-container`.

3. **Border radius:** `rounded-lg` (0.5rem), `rounded-xl` (0.75rem), `rounded-full`.

4. **Typography:** Inter font, display'lar uchun `tracking-tightest` (-0.02em).

5. **Body text rang:** asosiy `text-on-surface`, ikkinchi darajali `text-on-surface-variant`.

6. **Label/metadata:** kichik, all-caps, `tracking-wider` (+0.05em).

7. **Glass effect** (modal, dropdown, navbar): `bg-surface-container-lowest/70 backdrop-blur-glass`.

---

## 📁 Loyiha strukturasi

```
src/
├── components/
│   ├── ui/              ← Base design system komponentlar (Button, Input, Card)
│   └── layout/          ← Navbar, Footer, Sidebar
├── pages/               ← Route-level sahifalar
├── hooks/
├── lib/
└── styles/
    └── index.css        ← Tailwind directives + custom utilities
```

**Yangi komponent qo'shganda:** har doim avval `src/components/ui/` da bor-yo'qligini tekshir. Yo'q bo'lsa — yarat. Bor bo'lsa — qayta ishlat.

---

## 🔄 Sahifa ko'chirish workflow

Stitch'dagi mock'ni loyihaga ko'chirayotganda:

1. `design-reference/<page>/screen.png` ni vizual ravishda ko'r.
2. `design-reference/<page>/code.html` ni reference sifatida o'qi (struktura va layout uchun).
3. `DESIGN.md` qoidalariga amal qil.
4. `src/components/ui/` dagi mavjud komponentlardan foydalan.
5. HTML class'larini ko'r-ko'rona ko'chirma — qayta yoz, semantic React komponent qil.
6. Mavjud business logic (API, state, validation) ni saqlab qol.
7. Tugagach — DEV server'da ochib, screen.png bilan vizual solishtir.

---

## 🎯 Material Symbols iconlari

Stitch HTML'larida `<span class="material-symbols-outlined">icon_name</span>` ishlatilgan.
React'da o'rniga **`lucide-react`** ishlat (allaqachon o'rnatilgan bo'lishi kerak):

```jsx
import { Calendar, User, Settings } from 'lucide-react'
```

Material Symbols nomi → Lucide nomi mosligini o'zing topib qo'y.
