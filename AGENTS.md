<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep student visual overrides in a route-loaded, screen-only stylesheet scoped to the student page root; this prevents teacher and print styling changes.
- Keep scan-page visual overrides in a route-loaded, screen-only stylesheet scoped to the teacher scan root; this isolates its skin from student pages, shared navigation and printing.
- Keep teacher points visual overrides in a route-loaded, screen-only stylesheet scoped to its page root; this isolates list and grant-control styling from all other pages and printing.
- Scope item BOX visual overrides beneath both the student page and collection BOX root in the student screen stylesheet; this keeps home, gacha, prize rendering and print styles unchanged.
- Scope gacha visual overrides beneath both the student page and gacha root in the student screen stylesheet; this isolates cinematic machine, video and acquisition styling from other screens and printing.
- Keep gacha presentation state in the /me-owned collection hook with a synchronous session lock; this preserves in-flight draws and confirmed results across student tab changes without repeating server requests.
- Keep gacha film and its single externally sourced soundtrack separate from draw/save functions and shared feedback audio; this makes playback failure harmless to saved results and prevents legacy sound overlap.
- Keep teacher history visual overrides in a route-loaded screen-only stylesheet scoped to its page root; this preserves shared navigation, other pages and print appearance.
- Keep teacher board visual overrides in a route-loaded screen-only stylesheet scoped to its page root; this preserves shared navigation, other pages and print appearance.
- Keep teacher manage visual overrides in a route-loaded screen-only stylesheet scoped to its page root; this preserves child panels' logic, other pages and print appearance.
- Write an unprefixed backdrop-filter in its own rule when it must work in Chrome; the CSS build can collapse a prefixed/unprefixed pair to only -webkit-.
- Treat background-category items as name plates via one shared NamePlate component (teacher screens use its image-free lite mode); this keeps saved IDs/equip data unchanged and the 30-row teacher list light.
- Keep generated plate art in an ID-keyed asset module, with teacher overrides taking priority and valid background-image values; this separates text, artwork and saved equipment and prevents CSS shorthand from invalidating plates.
- Run BOX equipment changes only through an explicit button guarded by a synchronous ref lock; this prevents card taps and rapid repeated input from consuming multiple daily changes.
- Keep nameplate prototypes in a static isolated lab route with scoped screen CSS and no catalog, equipment, or data calls; this lets visual experiments run without modifying production items or authorization of existing routes.
- Define animated prize eligibility and rarity in the shared animated-plates catalog, never as initial equipment; render motion only for explicit IDs so static plates and saved equipment stay unchanged.
- Enforce teacher login failure limits server-side via login_attempts (per-source + global keys, failures only); UI messages are cosmetic and must never be the only guard.
- Split each print type into explicit capacity-specific page groups before rendering, with independently scoped physical grids; shared preview/print boundaries prevent overflow and split cards without changing QR payloads or authentication.
