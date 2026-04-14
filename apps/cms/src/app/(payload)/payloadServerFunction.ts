"use server";

import config from "@payload-config";
import { handleServerFunctions } from "@payloadcms/next/layouts";
import type { ServerFunctionClient } from "payload";

import { importMap } from "./admin/importMap.js";

export async function payloadServerFunction(
  args: Parameters<ServerFunctionClient>[0],
) {
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  });
}
