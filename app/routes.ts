import { type RouteConfig, index, prefix, route } from "@react-router/dev/routes";

export default [
    index("routes/Home"),
    ...prefix("start", [
        route("/play/:roomId/", "routes/Play/Play"),
    ]),
] satisfies RouteConfig;
