type DataConst = {
  local: any;
  build: any;
}

export const isDevelopment = process.env.NODE_ENV === "development";
export const isProduction = !isDevelopment;

export function getConst<T>(data: DataConst): T {
  if (!data.local || !data.build) {
    throw new Error("Both local and build values must be provided.");
  }
  return isDevelopment ? data.local : data.build;
}