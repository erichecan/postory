"use client";

import { useEffect } from "react";

export function RestaurantRequestAuthReturn() {
  useEffect(() => {
    window.opener?.postMessage({ type: "postory:restaurant-request-auth" }, window.location.origin);
  }, []);

  return null;
}
