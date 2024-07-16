# Requel

Type-safe `.sql` files with Vite.

## Example

1. Add the plugin in `vite.config.ts`

```ts
import { defineConfig } from 'vite'
import { requel } from 'vite-plugin-requel'

export default defineConfig({
  plugins: [ requel() ]
})
```

2. Add `DATABASE_URL` to the `.env` file

3. Initialize the repo:

```bash
pnpx requel init
```

4. Pull the database schema:

```bash
pnpx requel db pull
```

5. Create a `.sql` file, for example `db/products.sql`.

**Note**: input params can be typed via front matter

```sql
---
minPrice: integer
---
select * from products
where price > :minPrice
```

6. Import the `.sql` file.

```ts
import { query } from '$db/products.sql'

// input params and output rows are full typed
const rows = await query({ minPrice: 100 })
```

## License

MIT
