# Requel

Type-safe `.sql` files with Vite.

## Usage

Add the plugin in `vite.config.ts`

```ts
import { defineConfig } from 'vite'
import { requel } from 'vite-plugin-requel'

export default defineConfig({
  plugins: [ requel() ]
})
```

Add `DATABASE_URL` to the `.env` file.

Then, initialize the repo:

```bash
pnpx requel init
```

Pull the database schema:

```bash
pnpx requel db pull
```

Create a `.sql` file, for example `db/products.sql`.

**Note**: input params can be typed via front matter

```sql
---
minPrice: integer
---

select *
  from products
  where price > :minPrice
```

Import the `.sql` file:

```ts
import { query } from '$db/products.sql'

// input params and output rows are full typed
const rows = await query({ minPrice: 100 })
```

## Related projects

- [Drizzle](https://orm.drizzle.team)
- [Prisma](https://www.prisma.io)
- [Kysely](https://kysely.dev)
- [TypeSQL](https://github.com/wsporto/typesql)

## License

MIT
