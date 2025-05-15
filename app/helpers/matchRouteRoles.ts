import { routeRoles } from "../types/routeRoles";
import { Role } from "../types/roles";

export function getAllowedRoles(path: string): Role[] {
  const cleanPath = path.split("?")[0].replace(/\/+$/, ""); // limpia query y trailing slash

  for (const pattern in routeRoles) {
    const regex = new RegExp("^" + pattern.replace(/:\w+/g, "[^/]+") + "$");

    if (regex.test(cleanPath)) {
      return routeRoles[pattern as keyof typeof routeRoles];
    }
  }

  return [];
}
