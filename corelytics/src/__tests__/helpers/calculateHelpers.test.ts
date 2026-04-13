/**
 * Segédfüggvények tesztjei (calculateAge és calculateDailyGoals)
 * Ezek a server/index.ts-ben definiált privát függvények,
 * amelyeket itt újradefiniálunk a teszteléshez.
 */

// Az életkor kiszámítása a születési dátumból
function calculateAge(birthDate: Date): number {
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

// Napi táplálkozási célok kiszámítása
function calculateDailyGoals(
  age: number,
  gender: string,
  heightCm: number,
  weightKg: number,
  activityLevelId: number,
  goalId: number
) {
  // BMR számítása a Mifflin-St Jeor egyenlet alapján
  let bmr: number

  if (gender === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5
  } else if (gender === 'female') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 78
  }

  // Aktivitási szint szorzók
  const activityMultipliers: { [key: number]: number } = {
    2: 1.2,    // Ülő életmód
    4: 1.375,  // Enyhén aktív
    3: 1.55,   // Mérsékelten aktív
    1: 1.725,  // Nagyon aktív
  }

  const activityMultiplier = activityMultipliers[activityLevelId] || 1.2
  const tdee = bmr * activityMultiplier

  // Cél alapján módosítás
  let caloriesGoal: number
  if (goalId === 3) {
    caloriesGoal = tdee - 500 // Fogyás
  } else if (goalId === 1) {
    caloriesGoal = tdee + 500 // Hízás
  } else {
    caloriesGoal = tdee // Súlytartás
  }

  // Minimális kalória biztosítása
  const minCalories = gender === 'female' ? 1200 : gender === 'male' ? 1500 : 1350
  caloriesGoal = Math.max(caloriesGoal, minCalories)

  // Makrók számítása
  let proteinMultiplier = 0.8

  if (activityLevelId === 4) {
    proteinMultiplier += 0.4
  } else if (activityLevelId === 3) {
    proteinMultiplier += 0.6
  } else if (activityLevelId === 1) {
    proteinMultiplier += 1.0
  }

  if (goalId === 3) {
    proteinMultiplier += 0.2
  } else if (goalId === 1) {
    proteinMultiplier += 0.4
  }

  const proteinGoal = weightKg * proteinMultiplier
  const fatCalories = caloriesGoal * 0.30
  const fatGoal = fatCalories / 9
  const proteinCalories = proteinGoal * 4
  const remainingCalories = caloriesGoal - proteinCalories - fatCalories
  const carbsGoal = remainingCalories / 4

  return {
    caloriesGoal: Math.round(caloriesGoal),
    proteinGoal: Math.round(proteinGoal),
    fatGoal: Math.round(fatGoal),
    carbsGoal: Math.round(carbsGoal),
  }
}

describe('calculateAge', () => {
  beforeAll(() => {
    // Fix dátum: 2026. február 27.
    jest.useFakeTimers()
    jest.setSystemTime(new Date(2026, 1, 27))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('helyesen számolja ki az életkort', () => {
    const birthDate = new Date(2000, 0, 1) // 2000. január 1.
    expect(calculateAge(birthDate)).toBe(26)
  })

  it('figyelembe veszi, ha még nem volt születésnap az adott évben', () => {
    // Március 15-i születésnap, de most február 27 van
    const birthDate = new Date(2000, 2, 15) // 2000. március 15.
    expect(calculateAge(birthDate)).toBe(25) // Még nem töltötte be a 26-ot
  })

  it('figyelembe veszi, ha már volt születésnap az adott évben', () => {
    // Január 1-i születésnap, ami már elmúlt
    const birthDate = new Date(2000, 0, 1)
    expect(calculateAge(birthDate)).toBe(26)
  })

  it('helyesen számolja ki pontosan a születésnap napján', () => {
    // A születésnap ma van (február 27)
    const birthDate = new Date(2000, 1, 27)
    expect(calculateAge(birthDate)).toBe(26)
  })

  it('0-t ad vissza, ha a mai napon született', () => {
    const birthDate = new Date(2026, 1, 27)
    expect(calculateAge(birthDate)).toBe(0)
  })

  it('72-t ad egy idős személy születési dátumára', () => {
    const birthDate = new Date(1953, 5, 15) // 1953. június 15.
    expect(calculateAge(birthDate)).toBe(72)
  })

  it('helyesen kezeli a szökőévi születésnapot', () => {
    // Szökőnapi születésnap: február 29
    const birthDate = new Date(2000, 1, 29)
    expect(calculateAge(birthDate)).toBe(25) // Feb 27 < Feb 29
  })
})

describe('calculateDailyGoals', () => {
  describe('BMR számítás', () => {
    it('helyes BMR-t számol férfi felhasználónak', () => {
      // Férfi, 25 éves, 180cm, 80kg, ülő életmód, súlytartás
      const result = calculateDailyGoals(25, 'male', 180, 80, 2, 2)
      
      // BMR = 10 * 80 + 6.25 * 180 - 5 * 25 + 5 = 800 + 1125 - 125 + 5 = 1805
      // TDEE = 1805 * 1.2 = 2166
      expect(result.caloriesGoal).toBe(Math.round(1805 * 1.2))
    })

    it('helyes BMR-t számol női felhasználónak', () => {
      // Nő, 30 éves, 165cm, 60kg, ülő életmód, súlytartás
      const result = calculateDailyGoals(30, 'female', 165, 60, 2, 2)
      
      // BMR = 10 * 60 + 6.25 * 165 - 5 * 30 - 161 = 600 + 1031.25 - 150 - 161 = 1320.25
      // TDEE = 1320.25 * 1.2 = 1584.3
      expect(result.caloriesGoal).toBe(Math.round(1320.25 * 1.2))
    })

    it('helyes BMR-t számol egyéb nemű felhasználónak', () => {
      // Egyéb nem, 25 éves, 170cm, 70kg, ülő életmód, súlytartás
      const result = calculateDailyGoals(25, 'other', 170, 70, 2, 2)
      
      // BMR = 10 * 70 + 6.25 * 170 - 5 * 25 - 78 = 700 + 1062.5 - 125 - 78 = 1559.5
      // TDEE = 1559.5 * 1.2 = 1871.4
      expect(result.caloriesGoal).toBe(Math.round(1559.5 * 1.2))
    })
  })

  describe('Aktivitási szint szorzók', () => {
    it('ülő életmódnál 1.2-es szorzót alkalmaz', () => {
      const result = calculateDailyGoals(25, 'male', 180, 80, 2, 2)
      // BMR = 1805, TDEE = 1805 * 1.2 = 2166
      expect(result.caloriesGoal).toBe(Math.round(1805 * 1.2))
    })

    it('enyhén aktívnál 1.375-ös szorzót alkalmaz', () => {
      const result = calculateDailyGoals(25, 'male', 180, 80, 4, 2)
      // BMR = 1805, TDEE = 1805 * 1.375 = 2481.875
      expect(result.caloriesGoal).toBe(Math.round(1805 * 1.375))
    })

    it('mérsékelten aktívnál 1.55-ós szorzót alkalmaz', () => {
      const result = calculateDailyGoals(25, 'male', 180, 80, 3, 2)
      // BMR = 1805, TDEE = 1805 * 1.55 = 2797.75
      expect(result.caloriesGoal).toBe(Math.round(1805 * 1.55))
    })

    it('nagyon aktívnál 1.725-ös szorzót alkalmaz', () => {
      const result = calculateDailyGoals(25, 'male', 180, 80, 1, 2)
      // BMR = 1805, TDEE = 1805 * 1.725 = 3113.625
      expect(result.caloriesGoal).toBe(Math.round(1805 * 1.725))
    })

    it('ismeretlen aktivitási szintnél alapértelmezetten 1.2-t alkalmaz', () => {
      const result = calculateDailyGoals(25, 'male', 180, 80, 99, 2)
      // BMR = 1805, TDEE = 1805 * 1.2 = 2166 (alapértelmezett)
      expect(result.caloriesGoal).toBe(Math.round(1805 * 1.2))
    })
  })

  describe('Cél alapján kalória módosítás', () => {
    it('fogyásnál 500 kalóriát levon', () => {
      // goalId = 3 -> fogyás
      const result = calculateDailyGoals(25, 'male', 180, 80, 2, 3)
      // BMR = 1805, TDEE = 1805 * 1.2 = 2166, cél = 2166 - 500 = 1666
      expect(result.caloriesGoal).toBe(Math.round(1805 * 1.2 - 500))
    })

    it('hízásnál 500 kalóriát hozzáad', () => {
      // goalId = 1 -> hízás
      const result = calculateDailyGoals(25, 'male', 180, 80, 2, 1)
      // BMR = 1805, TDEE = 1805 * 1.2 = 2166, cél = 2166 + 500 = 2666
      expect(result.caloriesGoal).toBe(Math.round(1805 * 1.2 + 500))
    })

    it('súlytartásnál nem módosítja a kalóriát', () => {
      // goalId = 2 -> súlytartás
      const result = calculateDailyGoals(25, 'male', 180, 80, 2, 2)
      // BMR = 1805, TDEE = 1805 * 1.2 = 2166
      expect(result.caloriesGoal).toBe(Math.round(1805 * 1.2))
    })
  })

  describe('Minimális kalória', () => {
    it('férfiaknál nem csökken 1500 alá', () => {
      // Nagyon alacsony súly + fogyás = nagyon alacsony kalória
      const result = calculateDailyGoals(60, 'male', 160, 45, 2, 3)
      expect(result.caloriesGoal).toBeGreaterThanOrEqual(1500)
    })

    it('nőknél nem csökken 1200 alá', () => {
      const result = calculateDailyGoals(60, 'female', 150, 40, 2, 3)
      expect(result.caloriesGoal).toBeGreaterThanOrEqual(1200)
    })

    it('egyéb nemnél nem csökken 1350 alá', () => {
      const result = calculateDailyGoals(60, 'other', 155, 42, 2, 3)
      expect(result.caloriesGoal).toBeGreaterThanOrEqual(1350)
    })
  })

  describe('Makró számítások', () => {
    it('a zsír a kalóriák 30%-a kell legyen', () => {
      const result = calculateDailyGoals(25, 'male', 180, 80, 2, 2)
      // caloriesGoal = 2166
      const expectedFat = Math.round((2166 * 0.30) / 9)
      expect(result.fatGoal).toBe(expectedFat)
    })

    it('a fehérje, zsír és szénhidrát kalóriák összege megközelítőleg egyenlő a teljes kalóriával', () => {
      const result = calculateDailyGoals(25, 'male', 180, 80, 2, 2)
      // Ellenőrizzük, hogy a makrók kalóriái nagyjából egyeznek a cél kalóriával
      const totalFromMacros = result.proteinGoal * 4 + result.fatGoal * 9 + result.carbsGoal * 4
      // Kerekítési hibák miatt ± 10 kalória tolerancia
      expect(Math.abs(totalFromMacros - result.caloriesGoal)).toBeLessThanOrEqual(10)
    })

    it('aktívabb életmódnál magasabb fehérje cél', () => {
      const sedentary = calculateDailyGoals(25, 'male', 180, 80, 2, 2) // Ülő
      const active = calculateDailyGoals(25, 'male', 180, 80, 1, 2) // Nagyon aktív
      expect(active.proteinGoal).toBeGreaterThan(sedentary.proteinGoal)
    })

    it('fogyásnál magasabb fehérje szorzó', () => {
      const maintenance = calculateDailyGoals(25, 'male', 180, 80, 2, 2) // Súlytartás
      const weightLoss = calculateDailyGoals(25, 'male', 180, 80, 2, 3) // Fogyás
      expect(weightLoss.proteinGoal).toBeGreaterThan(maintenance.proteinGoal)
    })

    it('hízásnál magasabb fehérje szorzó', () => {
      const maintenance = calculateDailyGoals(25, 'male', 180, 80, 2, 2) // Súlytartás
      const weightGain = calculateDailyGoals(25, 'male', 180, 80, 2, 1) // Hízás
      expect(weightGain.proteinGoal).toBeGreaterThan(maintenance.proteinGoal)
    })
  })

  describe('Visszatérési érték formátum', () => {
    it('kerekített számokat ad vissza', () => {
      const result = calculateDailyGoals(25, 'male', 180, 80, 2, 2)
      expect(Number.isInteger(result.caloriesGoal)).toBe(true)
      expect(Number.isInteger(result.proteinGoal)).toBe(true)
      expect(Number.isInteger(result.fatGoal)).toBe(true)
      expect(Number.isInteger(result.carbsGoal)).toBe(true)
    })

    it('tartalmazza az összes szükséges mezőt', () => {
      const result = calculateDailyGoals(25, 'male', 180, 80, 2, 2)
      expect(result).toHaveProperty('caloriesGoal')
      expect(result).toHaveProperty('proteinGoal')
      expect(result).toHaveProperty('fatGoal')
      expect(result).toHaveProperty('carbsGoal')
    })

    it('pozitív értékeket ad vissza', () => {
      const result = calculateDailyGoals(25, 'male', 180, 80, 2, 2)
      expect(result.caloriesGoal).toBeGreaterThan(0)
      expect(result.proteinGoal).toBeGreaterThan(0)
      expect(result.fatGoal).toBeGreaterThan(0)
      expect(result.carbsGoal).toBeGreaterThan(0)
    })
  })

  describe('Realisztikus esetek', () => {
    it('20 éves aktív férfi - izomépítés', () => {
      const result = calculateDailyGoals(20, 'male', 185, 85, 1, 1)
      // Magas kalória szükséglet (nagyon aktív + hízás)
      expect(result.caloriesGoal).toBeGreaterThan(3000)
      // Magas fehérje (aktív + izomépítés)
      expect(result.proteinGoal).toBeGreaterThan(150)
    })

    it('50 éves ülő életmódú nő - fogyás', () => {
      const result = calculateDailyGoals(50, 'female', 160, 75, 2, 3)
      // Mérsékelt, de nem túl alacsony kalória
      expect(result.caloriesGoal).toBeGreaterThanOrEqual(1200)
      expect(result.caloriesGoal).toBeLessThan(2000)
    })

    it('35 éves mérsékelten aktív férfi - súlytartás', () => {
      const result = calculateDailyGoals(35, 'male', 175, 75, 3, 2)
      // Átlagos TDEE
      expect(result.caloriesGoal).toBeGreaterThan(2200)
      expect(result.caloriesGoal).toBeLessThan(3200)
    })
  })
})
