export const routeRoles: Record<string, string[]> = {
    "addreservation": ["Prestamista", "Administrador"],
    "reservations": ["Prestamista", "Administrador"],
    "reservationdetail": ["Prestamista"],
    "reservationdetailAdmin": ["Administrador"],
    "formEquipo": ["Administrador"],
    "formEspacio": ["Administrador"],
    "formChat": ["Prestamista", "Administrador"],
    "inventario": ["Administrador"],
    "menu": ["Prestamista", "Administrador"],
    "reservationsroom": ["Prestamista"],
    "tipoequipo": ["Administrador"],
    "equipo": ["Administrador"],
    "login": [], // Pública, sin roles
    "": ["Prestamista", "Administrador"], // Home/index                                                                                         
  };
  