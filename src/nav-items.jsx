import { HomeIcon, PencilIcon } from "lucide-react";
import Index from "./pages/Index.jsx";
import InscriptionService from "./pages/InscriptionService.jsx";

/**
 * Central place for defining the navigation items. Used for navigation components and routing.
 */
export const navItems = [
  {
    title: "Home",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <Index />,
  },
  {
    title: "Inscription Service",
    to: "/inscribe",
    icon: <PencilIcon className="h-4 w-4" />,
    page: <InscriptionService />,
  },
];