import Dashboard from "layouts/dashboard";

import { IoHome } from "react-icons/io5";

const routes = [
  {
    type: "collapse",
    name: "AI Monitor",
    key: "dashboard",
    route: "/dashboard",
    icon: <IoHome size="15px" color="inherit" />,
    component: Dashboard,
    noCollapse: true,
  },
];

export default routes;

