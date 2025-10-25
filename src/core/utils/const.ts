type DataConst = {
  local: any;
  production: any;
}

export const isDevelopment = process.env.NODE_ENV === "development";
export const isProduction = !isDevelopment;

export function getConst<T>(data: DataConst): T {
  if (!data.local || !data.production) {
    throw new Error("Both local and production values must be provided.");
  }
  return isDevelopment ? data.local : data.production;
}