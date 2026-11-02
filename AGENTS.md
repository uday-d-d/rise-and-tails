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

- The service-radius rule is enforced twice: client-side Haversine in src/lib/geo.ts for instant feedback, and a DB trigger (enforce_service_radius) that rejects inserts outside ngo_settings.radius_km — why: public anonymous inserts must not bypass the radius.
- NGO staff access is via public.user_roles ('staff'); the first account ever created gets staff automatically — why: bootstraps the single NGO admin without a seed user.
