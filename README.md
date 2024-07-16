# Requel

Import `.sql` files with Vite. TypeScript compatible.

## Example

Add the plugin in `vite.config.ts`

```ts
import { defineConfig } from 'vite'
import { requel } from 'vite-plugin-requel'

export default defineConfig({
  plugins: [ requel() ]
})
```

Then create an `.sql` file, for example `db/products.sql`.

Note: input params can be typed via frontmatter

```sql
---
minPrice: integer
---
select * from products
where price > :minPrice
```

Then import the `.sql` file.

```ts
import { query } from '$db/products.sql'

// input params and output rows are typed
const rows = await query({ minPrice: 100 })
```

## License

MIT
