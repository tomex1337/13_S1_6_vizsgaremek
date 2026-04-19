// Swagger / OpenAPI konfiguráció a Corelytics API-hoz
import swaggerJsdoc from 'swagger-jsdoc'

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Corelytics API',
    version: '1.0.0',
    description:
      'A Corelytics egy MyFitnessPal-szerű alkalmazás API dokumentációja. Az alkalmazás lehetővé teszi a felhasználók számára, hogy nyomon kövessék étkezési szokásaikat és edzéseiket.',
    contact: {
      name: 'Corelytics Team',
    },
  },
  servers: [
    {
      url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      description: 'Fejlesztői szerver',
    },
  ],
  tags: [
    {
      name: 'Autentikáció',
      description: 'Regisztráció, bejelentkezés és jelszókezelés',
    },
    {
      name: 'Profil',
      description: 'Felhasználói profil kezelése',
    },
    {
      name: 'Aktivitási Szintek',
      description: 'Aktivitási szintek lekérdezése és létrehozása',
    },
    {
      name: 'Célok',
      description: 'Felhasználói célok lekérdezése',
    },
    {
      name: 'Fiók',
      description: 'Fiókkezelés (deaktiválás)',
    },
    {
      name: 'tRPC',
      description: 'tRPC végpontok (étel, edzés, admin)',
    },
  ],
  components: {
    securitySchemes: {
      sessionAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'next-auth.session-token',
        description: 'NextAuth.js munkamenet cookie alapú hitelesítés',
      },
    },
    schemas: {
      // --- Alap modellek ---
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Felhasználó egyedi azonosítója' },
          email: { type: 'string', format: 'email', description: 'Email cím' },
          username: { type: 'string', description: 'Felhasználónév' },
          permissionLevel: { type: 'integer', description: 'Jogosultsági szint (0: felhasználó, 1: moderátor, 2: admin)' },
          canCreateCustomFood: { type: 'boolean', description: 'Egyéni étel létrehozási jog' },
          isActive: { type: 'boolean', description: 'Aktív fiók' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      UserProfile: {
        type: 'object',
        properties: {
          user_id: { type: 'string', format: 'uuid' },
          birthDate: { type: 'string', format: 'date', description: 'Születési dátum' },
          gender: { type: 'string', enum: ['male', 'female', 'other'], description: 'Nem' },
          heightCm: { type: 'integer', description: 'Magasság (cm)' },
          weightKg: { type: 'number', description: 'Testsúly (kg)' },
          activityLevel_id: { type: 'integer', description: 'Aktivitási szint azonosítója' },
          goal_id: { type: 'integer', description: 'Cél azonosítója' },
        },
      },
      ActivityLevel: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string', description: 'Aktivitási szint neve' },
        },
      },
      Goal: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string', description: 'Cél neve' },
        },
      },
      FoodItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', description: 'Étel neve' },
          brand: { type: 'string', nullable: true, description: 'Márka' },
          servingSizeGrams: { type: 'number', nullable: true, description: 'Adagméret (gramm)' },
          calories: { type: 'number', nullable: true, description: 'Kalória' },
          protein: { type: 'number', nullable: true, description: 'Fehérje (g)' },
          fat: { type: 'number', nullable: true, description: 'Zsír (g)' },
          carbs: { type: 'number', nullable: true, description: 'Szénhidrát (g)' },
          fiber: { type: 'number', nullable: true, description: 'Rost (g)' },
          sugar: { type: 'number', nullable: true, description: 'Cukor (g)' },
          sodium: { type: 'number', nullable: true, description: 'Nátrium (mg)' },
          isCustom: { type: 'boolean', description: 'Egyéni étel-e' },
          createdBy: { type: 'string', format: 'uuid', nullable: true },
        },
      },
      Exercise: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', description: 'Gyakorlat neve' },
          category: { type: 'string', nullable: true, description: 'Kategória' },
          metValue: { type: 'number', nullable: true, description: 'MET érték' },
          defaultDurationMinutes: { type: 'integer', nullable: true, description: 'Alapértelmezett időtartam (perc)' },
          isCustom: { type: 'boolean' },
          createdBy: { type: 'string', format: 'uuid', nullable: true },
        },
      },
      MealType: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string', description: 'Étkezés típusa (Reggeli, Ebéd, Vacsora, Snack)' },
        },
      },
      DailyGoal: {
        type: 'object',
        properties: {
          user_id: { type: 'string', format: 'uuid' },
          date: { type: 'string', format: 'date' },
          caloriesGoal: { type: 'integer', description: 'Napi kalória cél' },
          proteinGoal: { type: 'number', description: 'Napi fehérje cél (g)' },
          fatGoal: { type: 'number', description: 'Napi zsír cél (g)' },
          carbsGoal: { type: 'number', description: 'Napi szénhidrát cél (g)' },
        },
      },
      // --- Kérés sémák ---
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email', description: 'Email cím' },
          password: { type: 'string', minLength: 6, description: 'Jelszó' },
          name: { type: 'string', description: 'Felhasználónév' },
        },
      },
      ForgotPasswordRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', description: 'Email cím' },
        },
      },
      ResetPasswordRequest: {
        type: 'object',
        required: ['token', 'password'],
        properties: {
          token: { type: 'string', description: 'Visszaállító token' },
          password: { type: 'string', minLength: 6, description: 'Új jelszó' },
        },
      },
      ProfileRequest: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string', format: 'uuid', description: 'Felhasználó azonosítója' },
          birthDate: { type: 'string', format: 'date', description: 'Születési dátum' },
          gender: { type: 'string', enum: ['male', 'female', 'other'], description: 'Nem' },
          heightCm: { type: 'number', minimum: 50, maximum: 300, description: 'Magasság (cm)' },
          weightKg: { type: 'number', minimum: 20, maximum: 500, description: 'Testsúly (kg)' },
          activityLevelId: { type: 'integer', description: 'Aktivitási szint ID' },
          goalId: { type: 'integer', description: 'Cél ID' },
        },
      },
      // --- Válasz sémák ---
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', description: 'Hibaüzenet' },
          message: { type: 'string', description: 'Hibaüzenet (alternatív mező)' },
        },
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
        },
      },
    },
  },
  // REST API útvonalak dokumentációja
  paths: {
    // --- Autentikáció ---
    '/api/auth/register': {
      post: {
        tags: ['Autentikáció'],
        summary: 'Új felhasználó regisztrálása',
        description: 'Új felhasználó létrehozása email, jelszó és felhasználónév megadásával. Ha az email címmel már létezik inaktív fiók, az újraaktiválódik.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
              example: {
                email: 'teszt@example.com',
                password: 'jelszo123',
                name: 'TesztFelhasznalo',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Felhasználó sikeresen létrehozva',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        email: { type: 'string' },
                        username: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Hibás kérés (már létező email/felhasználónév)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '500': {
            description: 'Szerverhiba',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/auth/forgot-password': {
      post: {
        tags: ['Autentikáció'],
        summary: 'Elfelejtett jelszó - visszaállító email küldése',
        description: 'Jelszó-visszaállító email küldése. Mindig 200-as státuszt ad vissza az email enumeráció megelőzése érdekében.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ForgotPasswordRequest' },
              example: {
                email: 'teszt@example.com',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Kérés feldolgozva (mindig sikeresen válaszol)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
              },
            },
          },
          '400': {
            description: 'Email cím hiányzik',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '500': {
            description: 'Szerverhiba',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/auth/reset-password': {
      post: {
        tags: ['Autentikáció'],
        summary: 'Jelszó visszaállítása tokennel',
        description: 'Új jelszó beállítása a kapott visszaállító token segítségével. A token 24 óráig érvényes.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ResetPasswordRequest' },
              example: {
                token: 'abc123def456...',
                password: 'ujjelszo123',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Jelszó sikeresen visszaállítva',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
              },
            },
          },
          '400': {
            description: 'Hiányzó paraméterek vagy érvénytelen/lejárt token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '500': {
            description: 'Szerverhiba',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    // --- Profil ---
    '/api/profile': {
      get: {
        tags: ['Profil'],
        summary: 'Felhasználói profil lekérdezése',
        description: 'Az aktuális bejelentkezett felhasználó profiljának lekérdezése az aktivitási szinttel és céllal együtt.',
        security: [{ sessionAuth: [] }],
        responses: {
          '200': {
            description: 'Profil adatok',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    profile: { $ref: '#/components/schemas/UserProfile' },
                    activityLevel: { $ref: '#/components/schemas/ActivityLevel' },
                    goal: { $ref: '#/components/schemas/Goal' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Nincs bejelentkezve',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '500': {
            description: 'Szerverhiba',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Profil'],
        summary: 'Profil létrehozása vagy frissítése',
        description: 'Felhasználói profil létrehozása vagy frissítése. Ha a profil teljes, automatikusan kiszámítja a napi táplálkozási célokat (BMR a Mifflin-St Jeor egyenlet alapján).',
        security: [{ sessionAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProfileRequest' },
              example: {
                userId: '550e8400-e29b-41d4-a716-446655440000',
                birthDate: '1995-06-15',
                gender: 'male',
                heightCm: 180,
                weightKg: 75,
                activityLevelId: 3,
                goalId: 2,
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Profil sikeresen frissítve',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    profile: { $ref: '#/components/schemas/UserProfile' },
                    dailyGoals: { $ref: '#/components/schemas/DailyGoal' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Nincs bejelentkezve',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '403': {
            description: 'Tiltott - csak saját profil módosítható',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '500': {
            description: 'Szerverhiba',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    // --- Aktivitási szintek ---
    '/api/activity-levels': {
      get: {
        tags: ['Aktivitási Szintek'],
        summary: 'Összes aktivitási szint lekérdezése',
        description: 'Az összes elérhető aktivitási szint listájának lekérdezése. Az eredmény 1 órán át cache-elve van.',
        responses: {
          '200': {
            description: 'Aktivitási szintek listája',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/ActivityLevel' },
                },
              },
            },
          },
          '500': {
            description: 'Szerverhiba',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Aktivitási Szintek'],
        summary: 'Alapértelmezett aktivitási szintek létrehozása',
        description: 'Alapértelmezett aktivitási szintek feltöltése az adatbázisba, ha még nem léteznek.',
        responses: {
          '200': {
            description: 'Létrehozott aktivitási szintek',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/ActivityLevel' },
                },
              },
            },
          },
          '500': {
            description: 'Szerverhiba',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    // --- Célok ---
    '/api/goals': {
      get: {
        tags: ['Célok'],
        summary: 'Összes cél lekérdezése',
        description: 'Az összes elérhető cél (fogyás, súlytartás, hízás) listájának lekérdezése. Az eredmény 1 órán át cache-elve van.',
        responses: {
          '200': {
            description: 'Célok listája',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Goal' },
                },
              },
            },
          },
          '500': {
            description: 'Szerverhiba',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    // --- Fiók ---
    '/api/account/deactivate': {
      post: {
        tags: ['Fiók'],
        summary: 'Saját fiók deaktiválása',
        description: 'A bejelentkezett felhasználó saját fiókjának deaktiválása. A fiók inaktívvá válik, de nem törlődik.',
        security: [{ sessionAuth: [] }],
        responses: {
          '200': {
            description: 'Fiók sikeresen deaktiválva',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Nincs bejelentkezve',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '500': {
            description: 'Szerverhiba',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    // --- tRPC végpontok dokumentáció ---
    '/api/trpc/{procedure}': {
      get: {
        tags: ['tRPC'],
        summary: 'tRPC lekérdezés (query)',
        description: `A tRPC végponton keresztül elérhető lekérdezések (query-k). A végpont formátuma: \`/api/trpc/router.procedure\`.

**Elérhető lekérdezések:**

| Eljárás | Hitelesítés | Leírás |
|---------|-------------|--------|
| \`hello.world\` | Nyilvános | Teszt végpont |
| \`user.profile\` | Bejelentkezés | Felhasználói profil |
| \`user.stats\` | Bejelentkezés | Dashboard statisztikák |
| \`food.search\` | Bejelentkezés | Étel keresése (query, limit?) |
| \`food.getDailyLogs\` | Bejelentkezés | Napi étkezési naplók (date?) |
| \`food.getMealTypes\` | Nyilvános | Étkezés típusok |
| \`workout.getCategories\` | Bejelentkezés | Edzés kategóriák |
| \`workout.search\` | Bejelentkezés | Gyakorlat keresése (query?, category?, limit?) |
| \`workout.getDailyLogs\` | Bejelentkezés | Napi edzés naplók (date?) |
| \`workout.getStats\` | Bejelentkezés | Edzés statisztikák (startDate?, endDate?) |
| \`workout.getTodayBurnedCalories\` | Bejelentkezés | Mai elégetett kalóriák |
| \`admin.getPermissionLevel\` | Bejelentkezés | Jogosultsági szint |
| \`admin.getCustomFoods\` | Moderátor+ | Egyéni ételek listája (limit?, offset?, search?) |
| \`admin.getUsers\` | Admin | Felhasználók listája (limit?, offset?, search?) |`,
        parameters: [
          {
            name: 'procedure',
            in: 'path',
            required: true,
            description: 'tRPC eljárás neve (pl. user.profile, food.search)',
            schema: { type: 'string' },
          },
          {
            name: 'input',
            in: 'query',
            required: false,
            description: 'JSON kódolt bemeneti paraméterek',
            schema: { type: 'string' },
          },
        ],
        security: [{ sessionAuth: [] }],
        responses: {
          '200': {
            description: 'Sikeres lekérdezés',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    result: {
                      type: 'object',
                      properties: {
                        data: { type: 'object', description: 'Az eljárás válasza' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Nincs bejelentkezve (védett végpontnál)',
          },
          '403': {
            description: 'Nincs megfelelő jogosultság',
          },
        },
      },
      post: {
        tags: ['tRPC'],
        summary: 'tRPC mutáció (mutation)',
        description: `A tRPC végponton keresztül elérhető mutációk. A végpont formátuma: \`/api/trpc/router.procedure\`.

**Elérhető mutációk:**

| Eljárás | Hitelesítés | Leírás |
|---------|-------------|--------|
| \`food.logFood\` | Bejelentkezés | Étel naplózása (foodItemId, mealTypeId, quantity, logDate?) |
| \`food.deleteLog\` | Bejelentkezés | Étkezési napló törlése (logId) |
| \`food.updateLogQuantity\` | Bejelentkezés | Mennyiség frissítése (logId, quantity) |
| \`food.createCustomFood\` | Bejelentkezés | Egyéni étel létrehozása (name, brand?, calories?, stb.) |
| \`workout.logWorkout\` | Bejelentkezés | Edzés naplózása (exerciseId, durationMinutes, logDate?) |
| \`workout.deleteLog\` | Bejelentkezés | Edzésnapló törlése (logId) |
| \`workout.updateLog\` | Bejelentkezés | Edzésnapló frissítése (logId, durationMinutes) |
| \`workout.createCustomExercise\` | Bejelentkezés | Egyéni gyakorlat létrehozása (name, category?, metValue?, stb.) |
| \`workout.deleteCustomExercise\` | Bejelentkezés | Egyéni gyakorlat törlése (exerciseId) |
| \`admin.deleteCustomFood\` | Moderátor+ | Egyéni étel törlése (foodId) |
| \`admin.updateUserPermission\` | Admin | Jogosultság módosítása (userId, permissionLevel) |
| \`admin.toggleCustomFoodPermission\` | Admin | Étel létrehozási jog váltása (userId, canCreateCustomFood) |
| \`admin.deactivateUser\` | Moderátor+ | Felhasználó deaktiválása (userId) |
| \`admin.reactivateUser\` | Admin | Felhasználó újraaktiválása (userId) |
| \`account.deactivate\` | Bejelentkezés | Saját fiók deaktiválása |`,
        parameters: [
          {
            name: 'procedure',
            in: 'path',
            required: true,
            description: 'tRPC eljárás neve (pl. food.logFood)',
            schema: { type: 'string' },
          },
        ],
        security: [{ sessionAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                description: 'Az eljáráshoz szükséges bemeneti paraméterek JSON formátumban',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Sikeres mutáció',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    result: {
                      type: 'object',
                      properties: {
                        data: { type: 'object', description: 'A mutáció válasza' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Nincs bejelentkezve',
          },
          '403': {
            description: 'Nincs megfelelő jogosultság',
          },
        },
      },
    },
  },
}

// Swagger opciók (swagger-jsdoc nem fog fájlokat olvasni, mert mindent inline definiáltunk)
const options: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: [], // Nincs szükség fájl alapú annotációra, minden inline van
}

export const swaggerSpec = swaggerJsdoc(options)
