import { Capacitor } from "@capacitor/core";
import {
  HealthConnect,
  type HealthConnectAvailability,
  type AggregateRecordType,
  type RecordType,
} from "@devmaxime/capacitor-health-connect";

export type HealthConnectFetchResult =
  | {
      status: "ok";
      steps: number;
      activeCaloriesBurned: number;
    }
  | {
      status: "not-native" | "not-android" | "not-supported" | "not-installed";
    };

type HealthConnectPermissionType = RecordType | AggregateRecordType;

const readPermissions: HealthConnectPermissionType[] = ["Steps", "ActivitySession", "ActiveCaloriesBurned"];

const toDayBounds = (dateString: string) => {
  const [year, month, day] = dateString.split("-").map(Number);
  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day, 23, 59, 59, 999);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
};

const mapAvailabilityToStatus = (availability: HealthConnectAvailability): HealthConnectFetchResult["status"] => {
  if (availability === "NotInstalled") {
    return "not-installed";
  }

  if (availability === "NotSupported") {
    return "not-supported";
  }

  return "ok";
};

const sumAggregateValues = (aggregates: Array<{ value: number }>) => {
  return aggregates.reduce((sum, aggregate) => sum + Number(aggregate.value || 0), 0);
};

export const fetchHealthConnectDailySummary = async (dateString: string): Promise<HealthConnectFetchResult> => {
  if (!Capacitor.isNativePlatform()) {
    return { status: "not-native" };
  }

  if (Capacitor.getPlatform() !== "android") {
    return { status: "not-android" };
  }

  const availabilityResult = await HealthConnect.checkAvailability();
  const availabilityStatus = mapAvailabilityToStatus(availabilityResult.availability);

  if (availabilityStatus !== "ok") {
    return { status: availabilityStatus };
  }

  // A plugin típusdefiníciója nem tartalmazza az összes érvényes Android rekordot a read listában.
  // Runtime szinten viszont a rekordnév-mapping támogatja az ActiveCaloriesBurned engedélyt is.
  await HealthConnect.requestPermissions({
    read: readPermissions as unknown as RecordType[],
    write: [],
  });

  const { start, end } = toDayBounds(dateString);

  const [stepsResult, activeCaloriesResult] = await Promise.all([
    HealthConnect.aggregateRecords({
      type: "Steps",
      start,
      end,
      groupBy: "day",
    }),
    HealthConnect.aggregateRecords({
      type: "ActiveCaloriesBurned",
      start,
      end,
      groupBy: "day",
    }),
  ]);

  const steps = Math.max(0, Math.round(sumAggregateValues(stepsResult.aggregates ?? [])));
  const activeCaloriesBurned = Math.max(0, Math.round(sumAggregateValues(activeCaloriesResult.aggregates ?? [])));

  return {
    status: "ok",
    steps,
    activeCaloriesBurned,
  };
};
