import { type RouteConfig, index, prefix, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    ...prefix("start", [
        route("/play/:roomId/", "routes/play/play.tsx"),
    ]),
] satisfies RouteConfig;
