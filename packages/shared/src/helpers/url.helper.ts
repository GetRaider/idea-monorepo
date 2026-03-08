import { primitiveHelper } from "@repo/shared";

class UrlHelper {
  construct(
    { base, params = [], queries = {} }: IConstructPathArgs,
    {
      shouldGetExistingArgs = false,
      shouldSkipMissingArgs = false,
    }: IConstructOptions = {},
  ): string {
    if (shouldGetExistingArgs) {
      return `${base}${this.getExistingParams(...params)}${this.getExistingQuery(
        queries,
      )}`;
    }

    const strictParams = this.getParams(params, shouldSkipMissingArgs);
    const strictQuery = this.getQuery(queries, shouldSkipMissingArgs);

    return `${base}${strictParams}${strictQuery}`;
  }

  getQueryValues(
    url: string,
    queryKeys: string[],
  ): Record<string, string | null> {
    const { searchParams } = new URL(url);
    const queryValues: Record<string, string | null> = {};

    queryKeys.forEach((queryKey) => {
      queryValues[queryKey] = searchParams.get(queryKey);
    });

    return queryValues;
  }

  private getExistingParams(...possibleParams: string[]): string {
    return possibleParams
      .map((possibleParam) => {
        const param = possibleParam ?? "";
        return `${param && `/${param}`}`;
      })
      .join(",")
      .replaceAll(",", "");
  }

  private getExistingQuery(
    possibleQueries: Record<string, string | number>,
  ): string {
    if (!possibleQueries || Object.keys(possibleQueries).length === 0) {
      return "";
    }
    const queryParts = Object.keys(possibleQueries)
      .map((key) => {
        const possibleQuery = possibleQueries[key];
        // Skip null, undefined, empty string, but allow 0
        if (
          possibleQuery === null ||
          possibleQuery === undefined ||
          possibleQuery === ""
        ) {
          return "";
        }
        return `${encodeURIComponent(key)}=${encodeURIComponent(possibleQuery)}`;
      })
      .filter((part) => part.length > 0);
    return queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  }

  private getParams(params: string[], shouldSkipMissingArgs: boolean): string {
    if (shouldSkipMissingArgs && (!params || !params.length)) {
      return "";
    }

    if (!params || params.length === 0) {
      return "";
    }

    if (params.some((param) => !param)) {
      throw new Error(
        `Some of passed params is null or undefined: ${primitiveHelper.jsonStringify(
          params,
        )}`,
      );
    }
    return params
      .map((param) => {
        return `/${param}`;
      })
      .join(",")
      .replaceAll(",", "");
  }

  private getQuery(
    queries: Record<string, string | number>,
    shouldSkipMissingArgs: boolean,
  ): string {
    if (
      shouldSkipMissingArgs &&
      (!queries || Object.keys(queries).length === 0)
    ) {
      return "";
    }

    if (!queries || Object.keys(queries).length === 0) {
      return "";
    }

    // Check for null/undefined but allow 0
    if (
      Object.values(queries).some(
        (query) => query === null || query === undefined || query === "",
      )
    ) {
      throw new Error(
        `Some of passed queries is null or undefined: ${primitiveHelper.jsonStringify(
          { value: queries },
        )}`,
      );
    }

    const queryKeys = Object.keys(queries);
    const queryParts = queryKeys.map(
      (key) => `${encodeURIComponent(key)}=${encodeURIComponent(queries[key])}`,
    );
    return `?${queryParts.join("&")}`;
  }
}

export interface IConstructPathArgs {
  base: string;
  params?: string[];
  queries?: Record<string, string | number>;
}

export interface IConstructOptions {
  shouldGetExistingArgs?: boolean;
  shouldSkipMissingArgs?: boolean;
}

export const urlHelper = new UrlHelper();
