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
- Scope gacha visual overrides beneath both the student page and gacha root in the student screen stylesheet; this isolates machine and result styling without changing draw logic or animation timelines.
