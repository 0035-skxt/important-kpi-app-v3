## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

# Branch Rules

- main は本番相当。直接コミット・直接push禁止。
- develop は次回リリース統合用。直接pushは原則禁止。
- feature/* は develop から作成し、develop へMRする。
- release/* は develop から作成し、main と develop へ戻す。
- hotfix/* は main から作成し、main と develop へ戻す。
- main / develop への変更前に pnpm check, pnpm test, pnpm build を確認する。
