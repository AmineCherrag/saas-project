# UI/UX Design System Guidelines: TradePulse
**Design System, Component Specifications & Visual Identity**

---

## 1. Brand Identity & Design Philosophy

**TradePulse** reflects institutional elegance, analytical precision, and emotional calm. Trading platforms often overwhelm users with chaotic flashing neon and cluttered panels. TradePulse employs a dark obsidian foundation, structured card hierarchy, crystal-clear typography, and deliberate color coding designed to minimize visual fatigue during intense market hours.

### Visual Principles
- **Clarity Over Clutter**: Generous whitespace, unambiguous metrics, and tabular alignment for all currency and percentage values.
- **Purposeful Color Semantics**: Color is reserved for critical status and performance data. Profit is represented by a crisp emerald (`#10B981`), loss by a refined crimson (`#EF4444`), and neutral states by slate (`#64748B`).
- **High-Contrast Micro-Interactions**: Smooth 150ms transitions on hover, glassmorphism stat headers, subtle glowing border highlights on focus.

---

## 2. Color Palette & Design Tokens

### 2.1 Dark Mode (Default)
```css
:root[data-theme="dark"] {
  /* Surfaces & Backgrounds */
  --bg-app: #0B0E14;              /* Deep obsidian base */
  --bg-surface: #121824;          /* Elevated card surface */
  --bg-surface-elevated: #182234; /* Modal and dropdown surface */
  --bg-surface-subtle: #1C273C;   /* Input backgrounds & table headers */

  /* Borders & Dividers */
  --border-subtle: #1E293B;       /* Default border */
  --border-muted: #334155;        /* Hover border */
  --border-focus: #6366F1;        /* Focus border */

  /* Typography */
  --text-primary: #F8FAFC;        /* High-emphasis text */
  --text-secondary: #94A3B8;      /* Supporting labels & captions */
  --text-muted: #64748B;          /* Placeholders & disabled text */

  /* Brand Accents */
  --accent-primary: #6366F1;      /* Electric Indigo */
  --accent-primary-hover: #4F46E5;
  --accent-secondary: #06B6D4;    /* Cyber Cyan */

  /* Semantic Financial Indicators */
  --color-profit: #10B981;        /* Luminous Emerald */
  --color-profit-bg: rgba(16, 185, 129, 0.12);
  --color-loss: #EF4444;          /* Crimson Coral */
  --color-loss-bg: rgba(239, 68, 68, 0.12);
  --color-warning: #F59E0B;       /* Amber */
  --color-warning-bg: rgba(245, 158, 11, 0.12);
  --color-info: #38BDF8;
  --color-info-bg: rgba(56, 189, 248, 0.12);
}
```

### 2.2 Light Mode
```css
:root[data-theme="light"] {
  --bg-app: #F8FAFC;
  --bg-surface: #FFFFFF;
  --bg-surface-elevated: #F1F5F9;
  --bg-surface-subtle: #E2E8F0;

  --border-subtle: #E2E8F0;
  --border-muted: #CBD5E1;
  --border-focus: #4F46E5;

  --text-primary: #0F172A;
  --text-secondary: #475569;
  --text-muted: #94A3B8;

  --accent-primary: #4F46E5;
  --accent-primary-hover: #4338CA;
  --accent-secondary: #0891B2;

  --color-profit: #059669;
  --color-profit-bg: #ECFDF5;
  --color-loss: #DC2626;
  --color-loss-bg: #FEF2F2;
  --color-warning: #D97706;
  --color-warning-bg: #FFFBEB;
  --color-info: #0284C7;
  --color-info-bg: #F0F9FF;
}
```

---

## 3. Typography Hierarchy

- **Primary UI Font**: Inter / Plus Jakarta Sans (`system-ui, -apple-system, sans-serif`)
- **Financial & Data Font**: JetBrains Mono (`'JetBrains Mono', 'Roboto Mono', monospace`) with `font-variant-numeric: tabular-nums;`

| Element | Size | Weight | Line Height | Tracking |
|---|---|---|---|---|
| Display / H1 | 32px / 2.0rem | 700 (Bold) | 1.2 | -0.02em |
| Heading 2 | 24px / 1.5rem | 600 (SemiBold) | 1.3 | -0.01em |
| Heading 3 | 18px / 1.125rem | 600 (SemiBold) | 1.4 | 0.0em |
| Subhead / Card Title | 14px / 0.875rem | 500 (Medium) | 1.4 | +0.01em |
| Body Text | 14px / 0.875rem | 400 (Regular) | 1.5 | 0.0em |
| Financial Metric (Large) | 28px / 1.75rem | 700 (Bold) | 1.1 | -0.02em |
| Financial Metric (Medium) | 16px / 1.0rem | 600 (SemiBold) | 1.2 | 0.0em |
| Small Caption / Timestamp | 12px / 0.75rem | 400 (Regular) | 1.4 | +0.02em |

---

## 4. Application Layout & Navigation Structure

```
+-----------------------------------------------------------------------------------------------+
| TOP BAR: [Logo: TradePulse] | [Account Selector v] | [Date Range: Last 30 Days v] | (Bell) [Avatar v] |
+---------------+-------------------------------------------------------------------------------+
| SIDEBAR       | MAIN CONTENT WORKSPACE                                                        |
| (Collapsible) |                                                                               |
|               | [Overview Header: Welcome Back, Alex] [Add Trade +] [Import CSV ^]            |
| [Dashboard]   | +-----------------+ +-----------------+ +-----------------+ +-----------------+
| [Trades]      | | Net P&L         | | Win Rate        | | Profit Factor   | | Avg R-Multiple  |
| [Analytics]   | | +$14,820.50     | | 64.2%           | | 2.18            | | +1.85 R         |
| [Calendar]    | +-----------------+ +-----------------+ +-----------------+ +-----------------+
| [Journal]     |                                                                               |
| [Playbooks]   | +-----------------------------------------------------------------------------+
| [Progress]    | | CUMULATIVE P&L & EQUITY CURVE (Interactive Chart)                           |
| [Replay]      | |                                                                             |
|               | +-----------------------------------------------------------------------------+
| [Settings]    | +------------------------------------+ +--------------------------------------+
| [Admin]*      | | MONTHLY CALENDAR                   | | RECENT TRADES & MISTAKES             |
| [Billing]     | | (Daily Net P&L Badges)             | | AAPL +$450 | NQ -$120 | TSLA +$800   |
+---------------+--------------------------------------+----------------------------------------+
```

### 4.1 Persistent Navigation Elements
1. **Collapsible Sidebar**:
   - Expanded: 260px width with icons and labels.
   - Collapsed: 72px width icon-only mode with tooltips.
   - Mobile: Hidden off-canvas drawer triggered by hamburger icon.
2. **Top Filter Bar**:
   - Global Account Selector: Dropdown allowing selection of "All Accounts" or specific sub-accounts (e.g., "Apex Funded 50k", "Interactive Brokers Main").
   - Global Date Range Picker: Quick presets (`Today`, `Yesterday`, `This Week`, `Last 30 Days`, `Month to Date`, `Year to Date`, `Custom Range`).
   - Quick Action Buttons: `Add Trade` (Primary modal trigger) and `Import CSV` (File drop wizard).

---

## 5. Core Component Specifications

### 5.1 Metric Stat Card
- **Structure**: Icon badge, metric title, primary numeric value (with conditional emerald/crimson coloring), and secondary comparison pill (e.g., `+12.4% vs last month`).
- **Styling**: Subtle `1px solid var(--border-subtle)` border, card background `var(--bg-surface)`, rounded-xl (12px), padded 20px.

### 5.2 Interactive Financial Calendar
- **Structure**: 7-column grid (Sun–Sat or Mon–Sun selectable).
- **Day Cell Content**:
  - Date number (top-left).
  - Net P&L badge (center): Green badge for positive, Red badge for negative, Slate for break-even.
  - Secondary details: Trade count (e.g., `4 trades`), win rate (e.g., `75%`).
- **Interaction**: Clicking any cell launches a side drawer displaying all trades, fills, and journal reflections for that specific day.

### 5.3 Trade Detail Dual-Pane View
- **Left Pane (40% width)**:
  - Metric summary grid (Net P&L, Gross P&L, Fees, R-Multiple, Duration).
  - Executions list (table of individual fills with execution price, timestamp, and size).
  - Tags container (Mistakes in coral tags, Setup strategies in indigo tags).
- **Right Pane (60% width)**:
  - Interactive Lightweight Candlestick chart showing trade duration with green upward arrow at entry and red downward arrow at exit.
  - Trade execution notes (markdown rendered).
  - Screenshot attachment gallery with lightbox zoom.

### 5.4 Form Controls & Modals
- **Inputs**: Floating or crisp top labels, auto-formatted currency/number inputs, inline validation errors.
- **Modals**: Centered backdrop overlay with blur (`backdrop-filter: blur(8px)`), keyboard trap (`Esc` to close), clear primary/cancel action buttons.

---

## 6. Responsive Breakpoints

| Breakpoint | Target Devices | Layout Behavior |
|---|---|---|
| `> 1440px` (XL) | Ultra-wide / 4K Monitors | 4-column metric cards; dual-pane trade view side-by-side; full calendar. |
| `1024px – 1439px` (LG) | Standard Desktop / Laptops | 4-column cards; 2-column analytics charts; collapsible sidebar. |
| `768px – 1023px` (MD) | Tablets / Small Laptops | 2-column cards; stacked analytics charts; mini-sidebar; horizontal scroll tables. |
| `< 768px` (SM) | Mobile Phones | 1-column cards; off-canvas slideover navigation; stacked trade detail view. |
