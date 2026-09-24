// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  docs: create.doc("docs", {"index.mdx": () => import("../content/docs/index.mdx?collection=docs"), "installation.mdx": () => import("../content/docs/installation.mdx?collection=docs"), "quick-start.mdx": () => import("../content/docs/quick-start.mdx?collection=docs"), "adapters/node.mdx": () => import("../content/docs/adapters/node.mdx?collection=docs"), "adapters/react.mdx": () => import("../content/docs/adapters/react.mdx?collection=docs"), "core/configuration.mdx": () => import("../content/docs/core/configuration.mdx?collection=docs"), "core/csv.mdx": () => import("../content/docs/core/csv.mdx?collection=docs"), "core/errors.mdx": () => import("../content/docs/core/errors.mdx?collection=docs"), "core/excel.mdx": () => import("../content/docs/core/excel.mdx?collection=docs"), "core/ingest.mdx": () => import("../content/docs/core/ingest.mdx?collection=docs"), "core/lifecycle.mdx": () => import("../content/docs/core/lifecycle.mdx?collection=docs"), "core/progress.mdx": () => import("../content/docs/core/progress.mdx?collection=docs"), "core/schemas.mdx": () => import("../content/docs/core/schemas.mdx?collection=docs"), "core/validation.mdx": () => import("../content/docs/core/validation.mdx?collection=docs"), "guides/errors.mdx": () => import("../content/docs/guides/errors.mdx?collection=docs"), "guides/large-files.mdx": () => import("../content/docs/guides/large-files.mdx?collection=docs"), "guides/memory.mdx": () => import("../content/docs/guides/memory.mdx?collection=docs"), "guides/streaming.mdx": () => import("../content/docs/guides/streaming.mdx?collection=docs"), "reference/api.mdx": () => import("../content/docs/reference/api.mdx?collection=docs"), "reference/types.mdx": () => import("../content/docs/reference/types.mdx?collection=docs"), }),
};
export default browserCollections;