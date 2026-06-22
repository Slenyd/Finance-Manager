# frontend/src/components/ui/

## Responsibility

Provides the complete set of primitive UI components that form the design system of the finance-manager application. These are stateless, style-driven, presentation-only components with no business logic. They follow the [shadcn/ui](https://ui.shadcn.com/) convention — copy-paste-adaptable React components built on top of [Radix UI](https://www.radix-ui.com/) primitives, styled with Tailwind CSS via `class-variance-authority` (CVA). Every component in this directory is consumed by forms, pages, and layouts throughout the application.

## Design Patterns

**Radix UI Headless Primitive Wrapping:** `dialog.tsx`, `label.tsx`, `progress.tsx`, and `select.tsx` re-export and style Radix UI primitives (`@radix-ui/react-dialog`, `@radix-ui/react-label`, `@radix-ui/react-progress`, `@radix-ui/react-select`). Each file wraps the Radix component in a `React.forwardRef` and applies Tailwind utility classes via `cn()`. The Radix `Root` component is re-exported as-is (e.g., `Dialog = DialogPrimitive.Root`) to maintain the compound component API.

**Compound Component Pattern:** Four component families use the compound pattern:
- **Card:** `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` — independent named exports that must be composed by consumers. Each is a thin styled `<div>` or `<h3>`/`<p>` with `displayName` set.
- **Dialog:** `Dialog` (Root), `DialogTrigger`, `DialogPortal`, `DialogOverlay`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`, `DialogClose`. The overlay, content, title, and description wrap Radix primitives with animation classes (Tailwind `data-[state=open]:animate-*`). Header and Footer are plain `<div>` layout helpers.
- **Table:** `Table` (wrapped in scrolling container `<div>`), `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` — semantic `<table>` elements with scoped styling via `cn()`.
- **Select:** `Select` (Root), `SelectGroup`, `SelectValue`, `SelectTrigger`, `SelectContent`, `SelectItem`. Trigger, Content, and Item wrap Radix primitives. Content includes scroll-up/scroll-down buttons and uses `SelectPrimitive.Portal` for portal rendering.

**Polymorphic Component (asChild pattern):** `button.tsx` accepts an `asChild?: boolean` prop. When `true`, it renders the Radix `Slot` component as its root element, allowing the consumer to render a different semantic element (e.g., `<a>`, `<Link>`) while inheriting all styling and accessibility from `Button`. This is the standard Radix polymorphic pattern.

**Variant-Driven Styling with CVA:** `badge.tsx` and `button.tsx` use `class-variance-authority` to define typed variant and size props:
- **Badge variants:** `default`, `secondary`, `destructive`, `outline`, `success`, `warning` (last two are custom extensions beyond shadcn/ui defaults).
- **Button variants:** `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`.
- **Button sizes:** `default`, `sm`, `lg`, `icon` (all 44px height for touch targets).
- Both export the underlying `cva` result (`badgeVariants`, `buttonVariants`) for use by consumers.

**ForwardRef + DisplayName:** Every interactive component uses `React.forwardRef` and sets `displayName` for React DevTools compatibility and ref forwarding to the underlying DOM node (or Radix primitive).

**Static CSS-Only Components:** `input.tsx`, `skeleton.tsx`, `morph-loading.tsx`, `page-transition.tsx`, `pagination.tsx`, `spinner.tsx` are pure CSS/styling components with no runtime library dependencies beyond React. They accept standard HTML attributes and custom props for size, variant, or animation type.

**Animation Components:**
- `page-transition.tsx` exports `PageTransition` (single element with CSS animation class) and `StaggerChildren`/`StaggerItem` for staggered list animations. Animation types are a closed union of 7 CSS keyframe names (`fade-in`, `fade-in-up`, `fade-in-down`, `slide-up`, `slide-in-right`, `scale-in`, `bounce-in`).
- `morph-loading.tsx` renders 4 absolutely-positioned `<div>` elements with individual CSS `animation-delay` values for a morphing loader effect.

**Loading/Progress Indicators:**
- `spinner.tsx` exports `Spinner` (two variants: `default` single-border spin, `gradient` dual-layer counter-rotating spin), `LoadingCard`, and `LoadingPage` (centered layout with optional message).
- `progress.tsx` wraps `@radix-ui/react-progress` with a `translateX` transform for animated progress indication.

**Pagination Component:** `pagination.tsx` is a memoized pure component that consumes `PaginationMeta` (from `@/types`) and renders a Previous/Next button pair with a "Showing X-Y of Z" label. It returns `null` when `totalPages <= 1`.

## Data & Control Flow

These components are **purely presentational** — they do not manage state (except internal animation timing in `morph-loading`). Data flows in via standard React props:

- **`Button`, `Input`, `Label`, `Badge`, `Card` sub-components, `Table` sub-components, `Skeleton`:** Accept standard HTML attributes (`className`, `children`, event handlers) forwarded to the root element. No domain-specific props.
- **`Dialog` sub-components:** Controlled via Radix's `open`/`onOpenChange` on `Dialog.Root`. `DialogContent` renders via `DialogPortal` into a React portal. Close button is built-in.
- **`Select` sub-components:** Controlled via Radix's `value`/`onValueChange` on `Select.Root`. `SelectContent` renders via `SelectPrimitive.Portal`. The `SelectItem` renders a `Check` icon indicator.
- **`Progress`:** Accepts `value?: number | null` (0–100). Applies `translateX(-${100 - (value || 0)}%)` to the indicator.
- **`Spinner`, `MorphLoading`:** Accept `size: 'sm' | 'md' | 'lg'` mapped to Tailwind dimension classes.
- **`PageTransition`, `StaggerItem`:** Accept `animation` (union of 7 animation names), `delay` (ms), optional `index`/`baseDelay`/`staggerBy` for staggered children.
- **`Pagination`:** Accepts `page: number`, `meta: PaginationMeta`, `onPageChange: (page: number) => void`. State is held by the parent.

No component dispatches events, manages async state, or accesses stores. They are leaf nodes in the data flow.

## Integration Points

- **`@/lib/utils` (`cn`):** Every component imports `cn` for Tailwind class merging. This is the only shared utility dependency.
- **`lucide-react`:** `dialog.tsx` imports `X` (close icon). `select.tsx` imports `Check`, `ChevronDown`, `ChevronUp`. `button.tsx` does not import icons directly (icons are passed as children by consumers).
- **Radix UI packages:** `@radix-ui/react-dialog`, `@radix-ui/react-label`, `@radix-ui/react-progress`, `@radix-ui/react-select`, `@radix-ui/react-slot` — headless accessibility primitives that these components wrap and style.
- **`class-variance-authority` (CVA):** `badge.tsx` and `button.tsx` use CVA for variant/size prop definitions.
- **`@/types` (`PaginationMeta`):** Consumed by `pagination.tsx` for the meta prop type.
- **Consumers:** All feature components, pages, and layouts import from this directory:
  - Forms (`budget-form.tsx`, `goal-form.tsx`, `transaction-form.tsx`, `contribute-form.tsx`) import `Button`, `Input`, `Label`, `Dialog`, `Select`.
  - `app-layout.tsx` imports `Button` and `Spinner`/`LoadingPage`.
  - `auth-layout.tsx` imports `Spinner`.
  - Page-level components (dashboard, transactions lists, settings, etc.) import from here for all UI rendering.
