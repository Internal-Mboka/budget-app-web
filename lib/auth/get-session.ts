import { cache } from "react";

import { auth } from "./instance";

/** Déduplique `auth()` par requête RSC (layout + pages). */
export const getSession = cache(auth);
