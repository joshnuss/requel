# Requel

Import `.sql` files with Vite. TypeScript compatible.

## Example

Add the plugin in `vite.config.ts`

```ts
import { defineConfig } from 'vite'
import { requel } from 'requel'

export default defineConfig({
  plugins: [ requel() ]
})
```

Then create an `.sql` file, for example `db/products.sql`

```sql
---
minPrice: integer
---
select * from products
where price > :minPrice
```

Then import that file

```ts
import { query } from '$db/products.sql'

const rows = await query({ minPrice: 100 })
```

## License

MIT
