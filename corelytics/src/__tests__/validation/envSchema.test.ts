/**
 * Környezeti változók validációs tesztek
 * Az env.ts-ben definiált Zod séma tesztelése
 */
import { z } from 'zod'

// Közvetlenül teszteljük a Zod sémát, nem importáljuk az env.ts-t
// (az env.ts azonnal validál import-nál, ezért a sémát újra definiáljuk)
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

describe('Environment Variables Schema', () => {
  describe('DATABASE_URL', () => {
    it('érvényes PostgreSQL URL-t elfogad', () => {
      const result = envSchema.safeParse({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/mydb',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXTAUTH_SECRET: 'titkos-kulcs',
      })
      expect(result.success).toBe(true)
    })

    it('elutasítja a hiányzó DATABASE_URL-t', () => {
      const result = envSchema.safeParse({
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXTAUTH_SECRET: 'titkos-kulcs',
      })
      expect(result.success).toBe(false)
    })

    it('elutasítja az érvénytelen URL-t', () => {
      const result = envSchema.safeParse({
        DATABASE_URL: 'nem-url',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXTAUTH_SECRET: 'titkos-kulcs',
      })
      expect(result.success).toBe(false)
    })

    it('elutasítja az üres DATABASE_URL-t', () => {
      const result = envSchema.safeParse({
        DATABASE_URL: '',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXTAUTH_SECRET: 'titkos-kulcs',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('NEXTAUTH_URL', () => {
    it('érvényes URL-t elfogad', () => {
      const result = envSchema.safeParse({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/mydb',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXTAUTH_SECRET: 'titkos-kulcs',
      })
      expect(result.success).toBe(true)
    })

    it('HTTPS URL-t is elfogad', () => {
      const result = envSchema.safeParse({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/mydb',
        NEXTAUTH_URL: 'https://myprod.vercel.app',
        NEXTAUTH_SECRET: 'titkos-kulcs',
      })
      expect(result.success).toBe(true)
    })

    it('elutasítja az érvénytelen NEXTAUTH_URL-t', () => {
      const result = envSchema.safeParse({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/mydb',
        NEXTAUTH_URL: 'nem-url',
        NEXTAUTH_SECRET: 'titkos-kulcs',
      })
      expect(result.success).toBe(false)
    })

    it('elutasítja a hiányzó NEXTAUTH_URL-t', () => {
      const result = envSchema.safeParse({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/mydb',
        NEXTAUTH_SECRET: 'titkos-kulcs',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('NEXTAUTH_SECRET', () => {
    it('érvényes titkos kulcsot elfogad', () => {
      const result = envSchema.safeParse({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/mydb',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXTAUTH_SECRET: 'szuper-titkos-kulcs-123',
      })
      expect(result.success).toBe(true)
    })

    it('elutasítja az üres NEXTAUTH_SECRET-et', () => {
      const result = envSchema.safeParse({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/mydb',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXTAUTH_SECRET: '',
      })
      expect(result.success).toBe(false)
    })

    it('elutasítja a hiányzó NEXTAUTH_SECRET-et', () => {
      const result = envSchema.safeParse({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/mydb',
        NEXTAUTH_URL: 'http://localhost:3000',
      })
      expect(result.success).toBe(false)
    })

    it('egy karakteres titkot is elfogad', () => {
      const result = envSchema.safeParse({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/mydb',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXTAUTH_SECRET: 'x',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('NODE_ENV', () => {
    it('elfogadja a development értéket', () => {
      const result = envSchema.safeParse({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/mydb',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXTAUTH_SECRET: 'titok',
        NODE_ENV: 'development',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.NODE_ENV).toBe('development')
      }
    })

    it('elfogadja a production értéket', () => {
      const result = envSchema.safeParse({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/mydb',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXTAUTH_SECRET: 'titok',
        NODE_ENV: 'production',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.NODE_ENV).toBe('production')
      }
    })

    it('elfogadja a test értéket', () => {
      const result = envSchema.safeParse({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/mydb',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXTAUTH_SECRET: 'titok',
        NODE_ENV: 'test',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.NODE_ENV).toBe('test')
      }
    })

    it('elutasítja az érvénytelen NODE_ENV értéket', () => {
      const result = envSchema.safeParse({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/mydb',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXTAUTH_SECRET: 'titok',
        NODE_ENV: 'staging',
      })
      expect(result.success).toBe(false)
    })

    it('alapértelmezetten development, ha nincs megadva', () => {
      const result = envSchema.safeParse({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/mydb',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXTAUTH_SECRET: 'titok',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.NODE_ENV).toBe('development')
      }
    })
  })

  describe('Teljes validáció', () => {
    it('elfogad egy teljesen érvényes konfigurációt', () => {
      const result = envSchema.safeParse({
        DATABASE_URL: 'postgresql://myuser:mypass@db.example.com:5432/corelytics',
        NEXTAUTH_URL: 'https://corelytics.vercel.app',
        NEXTAUTH_SECRET: 'egy-nagyon-hosszu-es-biztonsagos-titkos-kulcs',
        NODE_ENV: 'production',
      })
      expect(result.success).toBe(true)
    })

    it('elutasít egy teljesen üres objektumot', () => {
      const result = envSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it('jelzi az összes hiányzó mezőt', () => {
      const result = envSchema.safeParse({})
      expect(result.success).toBe(false)
      if (!result.success) {
        const missingPaths = result.error.issues.map(e => e.path[0])
        expect(missingPaths).toContain('DATABASE_URL')
        expect(missingPaths).toContain('NEXTAUTH_URL')
        expect(missingPaths).toContain('NEXTAUTH_SECRET')
      }
    })

    it('figyelmen kívül hagyja az extra mezőket', () => {
      const result = envSchema.safeParse({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/mydb',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXTAUTH_SECRET: 'titok',
        EXTRA_VAR: 'extra-ertek',
      })
      expect(result.success).toBe(true)
    })
  })
})
