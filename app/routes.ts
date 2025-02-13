import { type RouteConfig, index, prefix, route } from "@react-router/dev/routes";

export default [
    index("routes/Home.tsx"),
    ...prefix("start", [
        route("/play/:roomId/", "routes/Play/Play.tsx"),
    ]),
] satisfies RouteConfig;
