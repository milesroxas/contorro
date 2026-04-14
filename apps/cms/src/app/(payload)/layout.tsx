/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from "@payload-config";
import "@payloadcms/next/css";
import "../payload-admin.css";
import { RootLayout } from "@payloadcms/next/layouts";
import type React from "react";

import { importMap } from "./admin/importMap.js";
import { payloadServerFunction } from "./payloadServerFunction";
import "./custom.scss";

type Args = {
  children: React.ReactNode;
};

const Layout = ({ children }: Args) => (
  <RootLayout
    config={config}
    importMap={importMap}
    serverFunction={payloadServerFunction}
  >
    {children}
  </RootLayout>
);

export default Layout;
