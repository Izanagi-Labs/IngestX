// @ts-nocheck
import * as __fd_glob_24 from "../content/docs/reference/types.mdx?collection=docs"
import * as __fd_glob_23 from "../content/docs/reference/api.mdx?collection=docs"
import * as __fd_glob_22 from "../content/docs/core/validation.mdx?collection=docs"
import * as __fd_glob_21 from "../content/docs/core/schemas.mdx?collection=docs"
import * as __fd_glob_20 from "../content/docs/core/progress.mdx?collection=docs"
import * as __fd_glob_19 from "../content/docs/core/lifecycle.mdx?collection=docs"
import * as __fd_glob_18 from "../content/docs/core/ingest.mdx?collection=docs"
import * as __fd_glob_17 from "../content/docs/core/excel.mdx?collection=docs"
import * as __fd_glob_16 from "../content/docs/core/errors.mdx?collection=docs"
import * as __fd_glob_15 from "../content/docs/core/csv.mdx?collection=docs"
import * as __fd_glob_14 from "../content/docs/core/configuration.mdx?collection=docs"
import * as __fd_glob_13 from "../content/docs/guides/streaming.mdx?collection=docs"
import * as __fd_glob_12 from "../content/docs/guides/memory.mdx?collection=docs"
import * as __fd_glob_11 from "../content/docs/guides/large-files.mdx?collection=docs"
import * as __fd_glob_10 from "../content/docs/guides/errors.mdx?collection=docs"
import * as __fd_glob_9 from "../content/docs/adapters/react.mdx?collection=docs"
import * as __fd_glob_8 from "../content/docs/adapters/node.mdx?collection=docs"
import * as __fd_glob_7 from "../content/docs/quick-start.mdx?collection=docs"
import * as __fd_glob_6 from "../content/docs/installation.mdx?collection=docs"
import * as __fd_glob_5 from "../content/docs/index.mdx?collection=docs"
import { default as __fd_glob_4 } from "../content/docs/reference/meta.json?collection=docs"
import { default as __fd_glob_3 } from "../content/docs/guides/meta.json?collection=docs"
import { default as __fd_glob_2 } from "../content/docs/adapters/meta.json?collection=docs"
import { default as __fd_glob_1 } from "../content/docs/core/meta.json?collection=docs"
import { default as __fd_glob_0 } from "../content/docs/meta.json?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();

export const docs = await create.docs("docs", "content/docs", {"meta.json": __fd_glob_0, "core/meta.json": __fd_glob_1, "adapters/meta.json": __fd_glob_2, "guides/meta.json": __fd_glob_3, "reference/meta.json": __fd_glob_4, }, {"index.mdx": __fd_glob_5, "installation.mdx": __fd_glob_6, "quick-start.mdx": __fd_glob_7, "adapters/node.mdx": __fd_glob_8, "adapters/react.mdx": __fd_glob_9, "guides/errors.mdx": __fd_glob_10, "guides/large-files.mdx": __fd_glob_11, "guides/memory.mdx": __fd_glob_12, "guides/streaming.mdx": __fd_glob_13, "core/configuration.mdx": __fd_glob_14, "core/csv.mdx": __fd_glob_15, "core/errors.mdx": __fd_glob_16, "core/excel.mdx": __fd_glob_17, "core/ingest.mdx": __fd_glob_18, "core/lifecycle.mdx": __fd_glob_19, "core/progress.mdx": __fd_glob_20, "core/schemas.mdx": __fd_glob_21, "core/validation.mdx": __fd_glob_22, "reference/api.mdx": __fd_glob_23, "reference/types.mdx": __fd_glob_24, });