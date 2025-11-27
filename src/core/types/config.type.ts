export interface IConfig {
    port: number,
    name: string
}

type Primitive = string | number | boolean | null | undefined;

export type DeepKeyOf<T, Prefix extends string = ""> =
  T extends Primitive
    ? never
    : {
        [K in keyof T & string]:
          T[K] extends Primitive | any[]
            ? `${Prefix}${K}`
            : `${Prefix}${K}` | DeepKeyOf<T[K], `${Prefix}${K}.`>
      }[keyof T & string];